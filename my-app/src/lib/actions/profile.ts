"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { sanitizeString, normalizeSocialUrl } from "@/lib/validation";
import { auth0 } from "@/lib/auth0";
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
