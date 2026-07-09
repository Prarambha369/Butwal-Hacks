"use server";

import { createServiceClient } from "@/utils/supabase/service";
import { auth0 } from "@/lib/auth0";

/**
 * Generate a sequential BH-ID like BH-26-001.
 */
async function generateBhId(): Promise<string> {
  const supabase = createServiceClient();
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const { data: maxRow } = await supabase
    .from("profiles")
    .select("slug_id")
    .like("slug_id", `BH-${yearSuffix}-%`)
    .order("slug_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (maxRow?.slug_id) {
    const parts = maxRow.slug_id.split("-");
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  return `BH-${yearSuffix}-${String(nextNum).padStart(3, "0")}`;
}

/**
 * Upsert a minimal profile row for an Auth0 user who doesn't have one yet.
 */
async function upsertProfile(auth0Sub: string): Promise<string> {
  const supabase = createServiceClient();
  const bhId = await generateBhId();
  const profileId = crypto.randomUUID();

  const { error } = await supabase.from("profiles").insert({
    id: profileId,
    auth0_user_id: auth0Sub,
    slug_id: bhId,
    bh_id: bhId,
    full_name: "New Hacker",
    role: "hacker",
    is_claimed: true,
  });

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return profileId;
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
