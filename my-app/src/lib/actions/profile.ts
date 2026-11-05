"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { sanitizeString, normalizeSocialUrl } from "@/lib/validation";
import { auth0 } from "@/lib/auth0";
import { getLinkedIdentities } from "@/lib/auth0-management";
import { PROFILE_SETTINGS_PATH } from "@/lib/routes";

/**
 * Update the signed-in member's own profile.
 *
 * There is no `userId` parameter and there must not be one. This runs on the
 * service-role client, which bypasses RLS, so the only thing standing between
 * one member and another's profile was the truthiness of a caller-supplied
 * identifier: it checked "is anyone signed in", not "is this my profile", and
 * then wrote to whatever `auth0_user_id` it was handed. The target is now
 * derived from the session, which cannot be forged.
 */
export async function updateProfile(updates: {
  full_name?: string;
  bio?: string;
  avatar_url?: string | null;
  open_to_mentor?: boolean;
  cal_com_url?: string;
  socials?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  }
}) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) throw new Error("Unauthorized");
  const supabase = createServiceClient();

  // Sanitize all string fields — discard invalid URLs entirely
  const normalizeOptionalUrl = (val: string | undefined): string | undefined =>
    val ? normalizeSocialUrl(val) ?? undefined : undefined

  const sanitized = {
    ...updates,
    full_name: updates.full_name ? sanitizeString(updates.full_name, 100) : updates.full_name,
    bio: updates.bio ? sanitizeString(updates.bio, 2000) : updates.bio,
    avatar_url: updates.avatar_url ? normalizeSocialUrl(updates.avatar_url) ?? null : updates.avatar_url,
    open_to_mentor: updates.open_to_mentor !== undefined ? updates.open_to_mentor : undefined,
    cal_com_url: updates.cal_com_url !== undefined ? normalizeSocialUrl(updates.cal_com_url) ?? null : undefined,
    socials: updates.socials ? {
      github: normalizeOptionalUrl(updates.socials.github),
      linkedin: normalizeOptionalUrl(updates.socials.linkedin),
      twitter: normalizeOptionalUrl(updates.socials.twitter),
      website: normalizeOptionalUrl(updates.socials.website),
    } : undefined,
  }

  const { error } = await supabase
    .from('profiles')
    .update(sanitized)
    .eq('auth0_user_id', session.user.sub);

  if (error) {
    logger.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  revalidatePath(PROFILE_SETTINGS_PATH);
  return { success: true };
}

/** Minimum waiting period between social profile fetches for the same field. */
const SOCIAL_FETCH_COOLDOWN_MS = 30_000;

/**
 * Fill the signed-in member's GitHub or LinkedIn URL from their provider
 * profile, so they do not have to type it by hand.
 *
 * This is an explicit on-demand step, not an automatic login-time sync. We ask
 * the provider only when it is legitimately linked to the account, we reuse a
 * provider-initiated identity link only for the field it is requested for, and
 * we never overwrite a field the member already set.
 */
export async function fetchProviderSocials(_provider: string): Promise<{ success: boolean; filled: boolean; message: string; socials?: Record<string, string> }> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) throw new Error("Unauthorized");

  const normalized = _provider === "linkedin" ? "linkedin" : _provider === "github" ? "github" : null;
  if (!normalized) throw new Error("Unsupported provider");
  const providerField = normalized;

  const now = Date.now();
  const lastFetchRaw = await getLastSocialFetch(session.user.sub);
  const lastFetch = lastFetchRaw ? new Date(lastFetchRaw).getTime() : 0;
  if (now - lastFetch < SOCIAL_FETCH_COOLDOWN_MS) {
    return { success: false, filled: false, message: "Social profile import is on cooldown. Try again in a moment." };
  }

  const supabase = createServiceClient();

  // Only a legitimately linked provider can be used to fill a profile URL.
  // There is no `linked_accounts` table; linked accounts live in the
  // `profiles.linked_accounts` JSONB array, written by the Auth0 link
  // callback. Read that column for the session's own profile.
  const { data: profileRow, error: profileRowError } = await supabase
    .from("profiles")
    .select("linked_accounts")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (profileRowError) {
    logger.error("[profile] Failed to read linked accounts", {
      auth0_user_id: session.user.sub,
      error: profileRowError,
    });
    return { success: false, filled: false, message: "Failed to verify linked accounts. Please try again." };
  }

  const linkedAccounts: unknown[] = Array.isArray(profileRow?.linked_accounts)
    ? (profileRow.linked_accounts as unknown[])
    : [];

  const isProviderLinked = linkedAccounts.some(
    (entry): entry is { provider: unknown } =>
      typeof entry === "object" &&
      entry !== null &&
      (entry as { provider: unknown }).provider === providerField
  );

  if (!isProviderLinked) {
    return {
      success: false,
      filled: false,
      message:
        providerField === "github"
          ? "Connect your GitHub account first, then import your profile URL."
          : "Connect your LinkedIn account first, then import your profile URL.",
    };
  }

  const profileUrl = await resolveProviderProfileUrl(providerField, session.user.sub);
  if (!profileUrl) {
    return {
      success: false,
      filled: false,
      message:
        providerField === "github"
          ? "Could not read a GitHub profile URL from your connected account. Check that the account is still public and try again."
          : "Could not read a LinkedIn profile URL from your connected account. Check that the account is still public and try again.",
    };
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("socials")
    .eq("auth0_user_id", session.user.sub)
    .single();

  const existing = ((current?.socials as Record<string, string> | null) ?? {});

  if (existing[providerField]) {
    return {
      success: true,
      filled: false,
      message: `You already have your ${providerField === "github" ? "GitHub" : "LinkedIn"} URL set. Edit it in the fields above instead.`,
      socials: existing,
    };
  }

  const updated = {
    ...existing,
    [providerField]: profileUrl,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ socials: updated, last_social_fetch_at: new Date().toISOString() })
    .eq("auth0_user_id", session.user.sub);

  if (error) {
    logger.error("[profile] Failed to persist fetched social URL", {
      auth0_user_id: session.user.sub,
      error,
    });
    return { success: false, filled: false, message: "Failed to save the imported social URL." };
  }

  await recordSocialFetch(session.user.sub);
  revalidatePath(PROFILE_SETTINGS_PATH);

  return {
    success: true,
    filled: true,
    message: `Imported your ${providerField === "github" ? "GitHub" : "LinkedIn"} URL automatically.`,
    socials: updated,
  };
}

/**
 * Resolve the member's public profile URL for a linked provider via the
 * Auth0 Management API. Mirrors the link-callback auto-population:
 * github -> https://github.com/{nickname}; linkedin -> https://linkedin.com/in/{nickname}
 * only when the nickname is not purely numeric (LinkedIn IDs are numeric).
 * Returns null on any error or when there is no usable nickname.
 */
export async function resolveProviderProfileUrl(
  provider: "github" | "linkedin",
  auth0UserId: string,
): Promise<string | null> {
  let linked: Awaited<ReturnType<typeof getLinkedIdentities>>;
  try {
    linked = await getLinkedIdentities(auth0UserId);
  } catch (error: unknown) {
    logger.error("[profile] Failed to fetch linked identities", {
      auth0_user_id: auth0UserId,
      error,
    });
    return null;
  }

  const identity = linked.find((id) => id.provider === provider);
  const nickname = identity?.profileData?.nickname;
  if (!nickname) return null;

  if (provider === "github") {
    return `https://github.com/${nickname}`;
  }

  // LinkedIn's numeric IDs cannot be used as vanity URL names.
  if (/^\d+$/.test(nickname)) {
    return null;
  }
  return `https://linkedin.com/in/${nickname}`;
}

async function getLastSocialFetch(auth0UserId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("last_social_fetch_at")
    .eq("auth0_user_id", auth0UserId)
    .single();
  if (error || !data) return null;
  return data.last_social_fetch_at;
}

async function recordSocialFetch(auth0UserId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ last_social_fetch_at: new Date().toISOString() })
    .eq("auth0_user_id", auth0UserId);
  if (error) {
    logger.error("[profile] Failed to record social fetch timestamp", {
      auth0_user_id: auth0UserId,
      error,
    });
  }
}

/**
 * Mark onboarding tour complete for the signed-in member.
 * Fire-and-forget from the client tour component (was a direct anon
 * write; moved server-side ahead of the RLS lockdown).
 */
export async function completeOnboarding(): Promise<{ success: boolean }> {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({ has_completed_onboarding: true })
    .eq('auth0_user_id', session.user.sub);
  if (error) {
    logger.error('Error completing onboarding:', error);
    throw new Error('Failed to save onboarding state');
  }
  return { success: true };
}
