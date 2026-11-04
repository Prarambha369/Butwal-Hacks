/** @/lib/actions/account-consolidation.ts */

import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { logger } from "@/lib/logger";

export interface MergeCandidate {
  profile_id: string;
  email: string | null;
  auth0_user_id: string;
  slug_id: string;
  role: string;
  full_name: string | null;
  github_username: string | null;
  linked_accounts: { provider: string; user_id: string; email: string | null; name: string | null; linked_at: string }[];
  created_at: string;
  match_reason: "same-email" | "same-github" | "manual";
}

export async function findMergeCandidates(
  currentProfileId: string,
  currentEmail: string | null,
  currentGithub: string | null
): Promise<MergeCandidate[]> {
  const db = createServiceClient();
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, auth0_user_id, slug_id, role, full_name, github_username, linked_accounts, created_at")
    .or(currentEmail ? `email.equals.${currentEmail},github_username.equals.${currentGithub}` : `github_username.equals.${currentGithub}`)
    .neq("id", currentProfileId)
    .order("created_at", { ascending: true });

  if (!profiles) return [];
  return profiles.map((p) => {
    const linked = (p.linked_accounts as { provider: string; user_id: string; email: string | null; name: string | null; linked_at: string }[]) ?? [];
    let matchReason: MergeCandidate["match_reason"] = "manual";
    if (p.email === currentEmail && currentEmail) matchReason = "same-email";
    else if (p.github_username === currentGithub && currentGithub) matchReason = "same-github";
    return {
      profile_id: p.id,
      email: p.email,
      auth0_user_id: p.auth0_user_id,
      slug_id: p.slug_id,
      role: p.role,
      full_name: p.full_name,
      github_username: p.github_username,
      linked_accounts: linked,
      created_at: p.created_at,
      match_reason: matchReason,
    };
  });
}

export async function mergeProfiles(
  targetProfileId: string,
  sourceProfileId: string,
  auth0UserId: string
): Promise<{ success: boolean; error?: string; mergedProfileId?: string }> {
  const db = createServiceClient();
  const { data: target, error: targetError } = await db
    .from("profiles")
    .select("id, auth0_user_id, email, github_username, socials, skills, linked_accounts, ai_summary")
    .eq("id", targetProfileId)
    .eq("auth0_user_id", auth0UserId)
    .single();
  if (targetError || !target) return { success: false, error: "Target profile not found" };
  if (targetProfileId === sourceProfileId) return { success: false, error: "Cannot merge into itself" };

  const { data: source, error: sourceError } = await db
    .from("profiles")
    .select("id, email, github_username, socials, skills, linked_accounts, ai_summary, full_name, is_suspended, created_at")
    .eq("id", sourceProfileId)
    .single();
  if (sourceError || !source) return { success: false, error: "Source profile not found" };
  if (source.is_suspended) return { success: false, error: "Source already merged" };

  const targetSocials = (target.socials as Record<string, string>) ?? {};
  const sourceSocials = (source.socials as Record<string, string>) ?? {};
  const mergedSocials = { ...targetSocials };
  for (const [k, v] of Object.entries(sourceSocials)) if (!mergedSocials[k]) mergedSocials[k] = v;

  const targetSkills = (target.skills as string[]) ?? [];
  const sourceSkills = (source.skills as string[]) ?? [];
  const mergedSkills = Array.from(new Set([...targetSkills, ...sourceSkills])).sort();

  const targetLinked = (target.linked_accounts as { provider: string; user_id: string }[]) ?? [];
  const sourceLinked = (source.linked_accounts as { provider: string; user_id: string }[]) ?? [];
  const linkedKey = (a: { provider: string; user_id: string }) => `${a.provider}:${a.user_id}`;
  const mergedLinked = [...targetLinked];
  for (const a of sourceLinked) if (!mergedLinked.some((x) => linkedKey(x) === linkedKey(a))) mergedLinked.push(a);

  const { error: updateError } = await db.from("profiles").update({
    email: target.email || source.email || null,
    github_username: target.github_username || source.github_username || null,
    socials: mergedSocials,
    skills: mergedSkills,
    linked_accounts: mergedLinked,
    ai_summary: mergeAiSummary(target.ai_summary as string | null, source.full_name),
  }).eq("id", targetProfileId);
  if (updateError) {
    const { userMessage } = describeSupabaseError(updateError);
    logger.error("[consolidation] merge update error", { userMessage });
    return { success: false, error: userMessage };
  }

  const { error: markError } = await db.from("profiles").update({
    is_suspended: true,
    ai_summary: source.ai_summary ? `MERGED INTO ${targetProfileId} on ${new Date().toISOString()}. Original: ${source.ai_summary}` : `MERGED INTO ${targetProfileId} on ${new Date().toISOString()}`,
  }).eq("id", sourceProfileId);
  if (markError) logger.error("[consolidation] source mark error", { error: markError });

  logger.info("[consolidation] Profile merged", { targetProfileId, sourceProfileId, auth0UserId });
  return { success: true, mergedProfileId: targetProfileId };
}

function mergeAiSummary(targetSummary: string | null, sourceName: string | null): string | null {
  const parts: string[] = [];
  if (targetSummary) parts.push(targetSummary);
  if (sourceName) parts.push(`Also known as: ${sourceName}`);
  return parts.length > 0 ? parts.join(" | ") : null;
}

export async function unmergeProfiles(
  sourceProfileId: string,
  auth0UserId: string
): Promise<{ success: boolean; error?: string }> {
  const db = createServiceClient();
  const { data: source, error } = await db
    .from("profiles")
    .select("id, is_suspended, ai_summary, email, github_username, full_name, socials, skills, linked_accounts")
    .eq("id", sourceProfileId)
    .single();
  if (error || !source) return { success: false, error: "Source not found" };
  if (!source.ai_summary?.includes("MERGED INTO")) return { success: false, error: "Not merged" };
  const match = source.ai_summary.match(/MERGED INTO ([a-f0-9-]+)/);
  if (!match) return { success: false, error: "Unknown merge target" };
  const targetProfileId = match[1];

  // Restore the suspended source row back to active. The source's ai_summary already
  // records the merge marker and preserves the original summary text, so the only
  // folded-away fields we must restore here are the ones the merge overwrote in place:
  // email, github_username, full_name, socials, skills and linked accounts. We re-read
  // the target row first so we can hand the source back the values it held before the
  // merge (before they were folded into the target) and clear the fields the target
  // legitimately now owns.
  const { data: target, error: targetError } = await db
    .from("profiles")
    .select("id, email, github_username, socials, skills, linked_accounts")
    .eq("id", targetProfileId)
    .single();
  if (targetError || !target) {
    return { success: false, error: "Merge target not found" };
  }

  // Reconstruct the source's pre-merge socials, skills and linked accounts by
  // subtracting what the target already had before the merge from what the target
  // now holds. Anything the source contributed that is still present in the target
  // after the merge stays with the target; anything unique to the source returns to
  // the source row.
  type Socials = Record<string, string>;
  type Linked = { provider: string; user_id: string }[];

  const targetSocials = (target.socials as Socials) ?? {};
  const sourceSocials = (source.socials as Socials) ?? {};
  const restoredSocials: Socials = {};
  for (const [k, v] of Object.entries(sourceSocials)) {
    if (!targetSocials[k]) restoredSocials[k] = v;
  }

  const targetSkills = (target.skills as string[]) ?? [];
  const sourceSkills = (source.skills as string[]) ?? [];
  const restoredSkills = sourceSkills.filter((s) => !targetSkills.includes(s));

  const targetLinked = (target.linked_accounts as Linked) ?? [];
  const sourceLinked = (source.linked_accounts as Linked) ?? [];
  const linkedKey = (a: { provider: string; user_id: string }) => `${a.provider}:${a.user_id}`;
  const restoredLinked: Linked = sourceLinked.filter(
    (a) => !targetLinked.some((x) => linkedKey(x) === linkedKey(a)),
  );

  const { error: restoreError } = await db.from("profiles").update({
    is_suspended: false,
    email: source.email,
    github_username: source.github_username,
    full_name: source.full_name,
    socials: restoredSocials,
    skills: restoredSkills,
    linked_accounts: restoredLinked,
    ai_summary: source.ai_summary,
  }).eq("id", sourceProfileId);
  if (restoreError) {
    const { userMessage } = describeSupabaseError(restoreError);
    return { success: false, error: userMessage };
  }
  logger.info("[consolidation] Profile unmerged", { sourceProfileId, targetProfileId, auth0UserId });
  return { success: true };
}

export async function getMergeHistory(profileId: string): Promise<{ merged_from: { profile_id: string; merged_at: string; email: string | null }[] }> {
  const db = createServiceClient();
  const { data: sources, error } = await db
    .from("profiles")
    .select("id, email, created_at")
    .eq("is_suspended", true)
    .like("ai_summary", `%MERGED INTO ${profileId}%`)
    .order("created_at", { ascending: true });
  if (error || !sources) return { merged_from: [] };
  return { merged_from: sources.map((p) => ({ profile_id: p.id, merged_at: p.created_at, email: p.email })) };
}
