"use server";

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";

// Not exported: a "use server" module may only export async functions.
const DUPLICATE_EMAIL_MESSAGE =
  "This email already has a Butwal Hacks account under a different sign-in method. " +
  "Sign in the way you did before, then link this method under Dashboard → Connections.";

/**
 * Create the profile for an Auth0 user who doesn't have one yet.
 *
 * Goes through create_profile_with_bh_id (atomic BH-ID, claims ghost rows)
 * with the session's email. The old version inserted directly with NO email
 * and a racy BH-ID, which is how production got email-less "New Hacker"
 * duplicates: the email belonged to the member's other login, the webhook
 * could not create a row, and this silently created a second one.
 */
async function upsertProfile(auth0Sub: string): Promise<string> {
  const supabase = createServiceClient();
  const session = await auth0.getSession().catch(() => null);
  const user = session?.user?.sub === auth0Sub ? session.user : null;
  const email = typeof user?.email === "string" && user.email.includes("@") ? user.email.toLowerCase() : null;
  const name = typeof user?.name === "string" && user.name.trim() && !user.name.includes("@") ? user.name.trim() : "New Hacker";

  const { data, error } = await supabase.rpc("create_profile_with_bh_id", {
    p_auth0_user_id: auth0Sub,
    p_email: email,
    p_full_name: name,
    p_role: "hacker",
    // Ghost-row claims need a verified address (migration 149).
    p_email_verified: user?.email_verified === true,
  });

  if (error?.code === "23505") {
    // Either the webhook created the row a moment ago (same sub: use it), or
    // the email belongs to another identity (don't mint a duplicate).
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", auth0Sub)
      .single();
    if (existing) return existing.id;
    throw new Error(DUPLICATE_EMAIL_MESSAGE);
  }
  const id = (data as { id?: string } | null)?.id;
  if (error || !id) throw new Error(`Failed to create profile: ${error?.message ?? "no id returned"}`);
  return id;
}

/**
 * Resolve the authenticated user's profile UUID from their Auth0 session.
 * Convenience wrapper that calls getSession() internally.
 * If no profile exists, creates one on-the-fly.
 *
 * @returns The profile UUID (id column)
 *
 * @example
 *   const profileId = await resolveProfileId();
 */
export async function resolveProfileId(): Promise<string> {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  return resolveProfileIdFromSub(session.user.sub);
}

/**
 * Resolve a profile UUID from an Auth0 sub (user ID) string.
 * Use this when you already have the sub value (e.g., from a webhook payload
 * or when the session was checked at a higher level).
 *
 * If no matching profile exists, creates one on-the-fly so that
 * authenticated users always have a profile.
 *
 * @param auth0Sub - The Auth0 user.sub value
 * @returns The profile UUID (id column)
 *
 * @example
 *   const profileId = await resolveProfileIdFromSub(userId);
 */
export async function resolveProfileIdFromSub(auth0Sub: string): Promise<string> {
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", auth0Sub)
    .single();

  if (profile) return profile.id;

  // Safety net: no profile exists yet — create one on-the-fly
  return upsertProfile(auth0Sub);
}
