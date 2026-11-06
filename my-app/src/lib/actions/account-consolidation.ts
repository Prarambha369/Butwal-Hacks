/** @/lib/actions/account-consolidation.ts */

import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { logger } from "@/lib/logger";
import { identitySubject } from "@/lib/auth0-providers";
import { getLinkedIdentitySubjects } from "@/lib/auth0-management";

export interface MergeCandidate {
  profile_id: string;
  email: string | null;
  slug_id: string;
  role: string;
  full_name: string | null;
  github_username: string | null;
  linked_accounts: { provider: string; user_id: string; email: string | null; name: string | null; linked_at: string }[];
  created_at: string;
  match_reason: "same-email" | "same-github" | "linked-identity" | "manual";
}

/**
 * Stable GitHub identity for a profile: the Auth0 identity `user_id` stored in
 * `profiles.linked_accounts`, which for the GitHub connection is the numeric
 * GitHub account id (see `subjectToUserId`). GitHub logins are mutable and
 * reusable after a rename, so `github_username` alone is a heuristic, never
 * proof of identity.
 */
export function githubAccountId(linkedAccounts: unknown): string | null {
  if (!Array.isArray(linkedAccounts)) return null;
  for (const entry of linkedAccounts) {
    if (!entry || typeof entry !== "object") continue;
    const { provider, user_id } = entry as { provider?: unknown; user_id?: unknown };
    if (provider === "github" && typeof user_id === "string" && user_id.trim().length > 0) {
      return user_id.trim();
    }
  }
  return null;
}

/**
 * Auth0 subjects (`provider|user_id`) for the identities linked to a profile.
 *
 * When an owner links a secondary identity into their primary Auth0 user, the
 * identity MOVES at Auth0's side, but any profile that still sits on the old
 * `auth0_user_id` (the account they signed up with back then) is left
 * attached to nothing — the merge UI never offered it, so linked accounts
 * could not actually be consolidated ("mostly all accounts can't be merged").
 * Deriving the subjects from linked_accounts lets those profiles surface as
 * candidates: Auth0 guarantees a linked identity belongs to exactly one user,
 * so a match on this value can only hit the caller's own former accounts.
 */
export function linkedAuth0Subjects(linkedAccounts: unknown): string[] {
  if (!Array.isArray(linkedAccounts)) return [];
  const out: string[] = [];
  for (const entry of linkedAccounts) {
    if (!entry || typeof entry !== "object") continue;
    const { provider, user_id } = entry as { provider?: unknown; user_id?: unknown };
    if (typeof provider === "string" && typeof user_id === "string" && user_id.trim().length > 0) {
      out.push(identitySubject(provider, user_id));
    }
  }
  return out;
}

/**
 * Every identity subject to treat as the caller's own: the subjects cached on
 * the profile, unioned with what Auth0 says is linked right now.
 *
 * The cache alone was not enough. `profiles.linked_accounts` is written only by
 * the link callback, so a user whose link attempts failed (the 400 loop in
 * `linkIdentity`) or whose attempt predates that persistence has an empty array
 * while Auth0 already holds the identity — and therefore saw "No other accounts
 * found that can be merged" even though a former profile was sitting there.
 * Reading the authoritative set fixes that without weakening the gate: these
 * subjects come from Auth0's own identity list, which the user cannot forge,
 * so a match is still provably one of their own accounts.
 *
 * Auth0 being unreachable degrades to the cache rather than failing the whole
 * merge flow; the warning is logged so the degradation is visible.
 */
export async function resolveLinkedIdentitySubjects(
  auth0UserId: string,
  linkedAccounts: unknown
): Promise<string[]> {
  const subjects = new Set(linkedAuth0Subjects(linkedAccounts));
  try {
    for (const subject of await getLinkedIdentitySubjects(auth0UserId)) {
      subjects.add(subject);
    }
  } catch (err) {
    logger.warn("[consolidation] live linked-identity lookup failed — using cached subjects", {
      auth0UserId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return [...subjects];
}

/**
 * Find other profiles that may belong to the same owner as the current one.
 *
 * Matching identifiers are the verified email, the stable GitHub account id,
 * and the Auth0 subjects of identities this profile has linked (an identity's
 * former profile row keeps the old auth0_user_id); the mutable
 * `github_username` is only carried for display. Rows that are already
 * suspended (merged) are excluded. Callers must still gate merge eligibility
 * through isMergeCandidate rather than trusting this list directly.
 */
export async function findMergeCandidates(
  currentProfileId: string,
  currentEmail: string | null,
  currentGithubAccount: string | null,
  currentLinkedSubjects: string[] = []
): Promise<MergeCandidate[]> {
  const db = createServiceClient();
  const select =
    "id, email, slug_id, role, full_name, github_username, linked_accounts, auth0_user_id, created_at";

  // Run one query per non-null identifier (PostgREST has no .equals operator;
  // a raw .or() string would break if values contain filter grammar characters).
  const rows: Array<Record<string, unknown> & { id: string }> = [];
  const seen = new Set<string>();

  const collect = (data: unknown[] | null) => {
    for (const p of data ?? []) {
      const row = p as Record<string, unknown> & { id: string };
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  };

  const baseQuery = () =>
    db
      .from("profiles")
      .select(select)
      .eq("is_suspended", false)
      .neq("id", currentProfileId)
      .order("created_at", { ascending: true });

  if (currentEmail) {
    const { data, error } = await baseQuery().eq("email", currentEmail);
    if (error) {
      const { userMessage } = describeSupabaseError(error);
      logger.error("[consolidation] candidate email query error", { userMessage });
    } else {
      collect(data);
    }
  }

  // Match the stable GitHub account id held in linked_accounts; jsonb
  // containment keeps this a single indexed query against the GIN index.
  if (currentGithubAccount) {
    const { data, error } = await baseQuery().contains("linked_accounts", [
      { provider: "github", user_id: currentGithubAccount },
    ]);
    if (error) {
      const { userMessage } = describeSupabaseError(error);
      logger.error("[consolidation] candidate github query error", { userMessage });
    } else {
      collect(data);
    }
  }

  // Match identities the owner has linked: whatever profile still sits on one
  // of those subjects was attached to the account the identity used to be.
  if (currentLinkedSubjects.length > 0) {
    const { data, error } = await baseQuery().in("auth0_user_id", currentLinkedSubjects);
    if (error) {
      const { userMessage } = describeSupabaseError(error);
      logger.error("[consolidation] candidate linked-identity query error", { userMessage });
    } else {
      collect(data);
    }
  }

  rows.sort((a, b) =>
    String((a.created_at as string | null) ?? "").localeCompare(
      String((b.created_at as string | null) ?? "")
    )
  );

  return rows.map((p) => {
    const linked = (p.linked_accounts as { provider: string; user_id: string; email: string | null; name: string | null; linked_at: string }[]) ?? [];
    let matchReason: MergeCandidate["match_reason"] = "manual";
    if (currentEmail && p.email === currentEmail) matchReason = "same-email";
    else if (currentGithubAccount && githubAccountId(p.linked_accounts) === currentGithubAccount) {
      matchReason = "same-github";
    } else if (currentLinkedSubjects.includes(p.auth0_user_id as string)) {
      matchReason = "linked-identity";
    }
    return {
      profile_id: p.id,
      email: p.email as string | null,
      slug_id: p.slug_id as string,
      role: p.role as string,
      full_name: p.full_name as string | null,
      github_username: p.github_username as string | null,
      linked_accounts: linked,
      created_at: p.created_at as string,
      match_reason: matchReason,
    };
  });
}

/**
 * Single authorization source of truth for merge eligibility.
 *
 * A source profile is mergeable only if it appears in the caller's
 * findMergeCandidates result — i.e. it shares a verified email or the stable
 * GitHub account id with the target and is not suspended. A matching
 * `github_username` alone is not sufficient. Both mergeProfiles and the
 * initiate route MUST use this helper so preview disclosure and merge
 * execution cannot drift apart (IDOR guard).
 */
export async function isMergeCandidate(
  targetProfileId: string,
  targetEmail: string | null,
  targetGithubAccount: string | null,
  sourceProfileId: string,
  targetLinkedSubjects: string[] = []
): Promise<boolean> {
  if (sourceProfileId === targetProfileId) return false;
  const candidates = await findMergeCandidates(
    targetProfileId,
    targetEmail,
    targetGithubAccount,
    targetLinkedSubjects
  );
  return candidates.some((c) => c.profile_id === sourceProfileId);
}

/**
 * Merge a source profile into the target resolved from auth0UserId, combining
 * socials, skills, and linked accounts. The source must be a current merge
 * candidate; a successful merge marks the source suspended so it stops
 * appearing in the owner's active profile surfaces.
 */
export async function mergeProfiles(
  sourceProfileId: string,
  auth0UserId: string
): Promise<{ success: boolean; error?: string; mergedProfileId?: string }> {
  const db = createServiceClient();

  // Resolve the target from the authenticated identity (never a client-supplied id).
  const { data: target, error: targetError } = await db
    .from("profiles")
    .select("id, auth0_user_id, email, github_username, socials, skills, linked_accounts, ai_summary")
    .eq("auth0_user_id", auth0UserId)
    .single();
  if (targetError || !target) return { success: false, error: "Target profile not found" };
  const targetProfileId = target.id as string;

  if (targetProfileId === sourceProfileId) return { success: false, error: "Cannot merge into itself" };

  const { data: source, error: sourceError } = await db
    .from("profiles")
    .select("id, email, github_username, socials, skills, linked_accounts, ai_summary, full_name, is_suspended, created_at")
    .eq("id", sourceProfileId)
    .single();
  if (sourceError || !source) return { success: false, error: "Source profile not found" };
  if (source.is_suspended) return { success: false, error: "Source already merged" };

  // IDOR guard: only a candidate of this target may be merged into it.
  const eligible = await isMergeCandidate(
    targetProfileId,
    target.email as string | null,
    githubAccountId(target.linked_accounts),
    sourceProfileId,
    await resolveLinkedIdentitySubjects(auth0UserId, target.linked_accounts)
  );
  if (!eligible) return { success: false, error: "Source profile is not eligible for merge" };

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
  if (markError) {
    // Partial apply: target has combined data but source is still active.
    // Do not report success — surface the failure so the user can retry.
    // ponytail: full atomicity needs a single RPC/transaction (migration) — minimal fix here.
    const { userMessage } = describeSupabaseError(markError);
    logger.error("[consolidation] source mark error", { userMessage });
    return { success: false, error: "Merge was only partially applied. Please retry." };
  }

  logger.info("[consolidation] Profile merged", { targetProfileId, sourceProfileId, auth0UserId });
  return { success: true, mergedProfileId: targetProfileId };
}

function mergeAiSummary(targetSummary: string | null, sourceName: string | null): string | null {
  const parts: string[] = [];
  if (targetSummary) parts.push(targetSummary);
  if (sourceName) parts.push(`Also known as: ${sourceName}`);
  return parts.length > 0 ? parts.join(" | ") : null;
}

/**
 * Undo a previous merge: re-activate the source profile and restore its
 * original summary, after verifying the caller still owns the merge target.
 */
export async function unmergeProfiles(
  sourceProfileId: string,
  auth0UserId: string
): Promise<{ success: boolean; error?: string }> {
  const db = createServiceClient();
  const { data: source, error } = await db
    .from("profiles")
    .select("id, is_suspended, ai_summary")
    .eq("id", sourceProfileId)
    .single();
  if (error || !source) return { success: false, error: "Source not found" };
  const summary = source.ai_summary as string | null;
  if (!summary?.includes("MERGED INTO")) return { success: false, error: "Not merged" };
  const match = summary.match(/MERGED INTO ([a-f0-9-]+)/);
  if (!match) return { success: false, error: "Unknown merge target" };
  const targetProfileId = match[1];

  // Owner check: the caller must own the target this source was merged into.
  const { data: target, error: targetError } = await db
    .from("profiles")
    .select("id")
    .eq("id", targetProfileId)
    .eq("auth0_user_id", auth0UserId)
    .single();
  if (targetError || !target) {
    return { success: false, error: "Merge target not found" };
  }

  // mergeProfiles never mutates the source row's email/skills/socials/linked —
  // those still hold their originals. Restore only the suspended flag and the
  // original ai_summary (strip the MERGED INTO marker; keep the stored Original:).
  const originalMatch = summary.match(/Original: ([\s\S]+)/);
  const restoredSummary = originalMatch ? originalMatch[1].trim() : null;

  const { error: restoreError } = await db.from("profiles").update({
    is_suspended: false,
    ai_summary: restoredSummary,
  }).eq("id", sourceProfileId);
  if (restoreError) {
    const { userMessage } = describeSupabaseError(restoreError);
    return { success: false, error: userMessage };
  }
  logger.info("[consolidation] Profile unmerged", { sourceProfileId, targetProfileId, auth0UserId });
  return { success: true };
}

/**
 * List the profiles that were merged into the given profile, reconstructed
 * from the suspension marker left on each merged source row.
 */
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
