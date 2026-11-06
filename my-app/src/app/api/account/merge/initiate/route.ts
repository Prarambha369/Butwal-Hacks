/**
 * POST /api/account/merge/initiate
 *
 * Initiate an account merge flow.
 * The user selects a source profile to merge into their current account.
 *
 * Request body:
 *   { source_profile_id: string }
 *
 * Response:
 *   { success: true, merge_preview: { ... } }
 *   or { success: false, error: "message" }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/utils/supabase";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { auth0 } from "@/lib/auth0";
import { githubAccountId, isMergeCandidate, linkedAuth0Subjects } from "@/lib/actions/account-consolidation";

const initiateSchema = z.object({
  source_profile_id: z.string().uuid("source_profile_id must be a valid UUID"),
});

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0UserId = session.user.sub;
    const body = await request.json().catch(() => ({}));
    const parsed = initiateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 }
      );
    }
    const { source_profile_id } = parsed.data;

    // Authorization: currentProfile is resolved from the authenticated
    // identity — service-role DB is only touched after this check.
    const db = createServiceClient();

    // Get current user's profile
    const { data: currentProfile, error: currentError } = await db
      .from("profiles")
      .select("id, email, github_username, role, slug_id, socials, skills, linked_accounts")
      .eq("auth0_user_id", auth0UserId)
      .single();

    if (currentError || !currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (source_profile_id === currentProfile.id) {
      return NextResponse.json({ error: "Cannot merge a profile into itself" }, { status: 400 });
    }

    // IDOR guard (shared with mergeProfiles): only a candidate of the caller
    // may have its profile data disclosed. 404 hides non-candidates.
    const eligible = await isMergeCandidate(
      currentProfile.id as string,
      currentProfile.email as string | null,
      githubAccountId(currentProfile.linked_accounts),
      source_profile_id,
      linkedAuth0Subjects(currentProfile.linked_accounts)
    );
    if (!eligible) {
      return NextResponse.json({ error: "Source profile is not eligible for merge" }, { status: 404 });
    }

    // Get source profile
    const { data: sourceProfile, error: sourceError } = await db
      .from("profiles")
      .select("id, email, github_username, role, slug_id, full_name, socials, skills, linked_accounts, created_at, is_suspended")
      .eq("id", source_profile_id)
      .single();

    if (sourceError || !sourceProfile) {
      return NextResponse.json({ error: "Source profile not found" }, { status: 404 });
    }

    if (sourceProfile.is_suspended) {
      return NextResponse.json({ error: "That profile has already been merged or deactivated" }, { status: 400 });
    }

    // Build merge preview
    const sourceLinked = (sourceProfile.linked_accounts as { provider: string; user_id: string; email: string | null; name: string | null; linked_at: string }[]) ?? [];
    const targetLinked = (currentProfile.linked_accounts as { provider: string; user_id: string; email: string | null; name: string | null; linked_at: string }[]) ?? [];

    const mergedSocials: Record<string, string> = { ...(currentProfile.socials as Record<string, string> | null ?? {}) };
    for (const [key, val] of Object.entries(sourceProfile.socials as Record<string, string> ?? {})) {
      if (!mergedSocials[key]) mergedSocials[key] = val;
    }

    const mergedSkills = Array.from(
      new Set([...(currentProfile.skills as string[] ?? []), ...(sourceProfile.skills as string[] ?? [])])
    ).sort();

    const linkedKey = (la: { provider: string; user_id: string }) => `${la.provider}:${la.user_id}`;
    const mergedLinked = [...targetLinked];
    for (const account of sourceLinked) {
      if (!mergedLinked.some((a) => linkedKey(a) === linkedKey(account))) {
        mergedLinked.push(account);
      }
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (sourceProfile.email && !currentProfile.email) {
      changes.email = { from: null, to: sourceProfile.email };
    }
    if (sourceProfile.github_username && !currentProfile.github_username) {
      changes.github_username = { from: null, to: sourceProfile.github_username };
    }
    if (mergedSkills.length > (currentProfile.skills?.length ?? 0)) {
      changes.skills = { from: currentProfile.skills ?? [], to: mergedSkills };
    }
    if (mergedLinked.length > targetLinked.length) {
      changes.linked_accounts = { from: targetLinked, to: mergedLinked };
    }

    return NextResponse.json({
      success: true,
      merge_preview: {
        target_profile: {
          id: currentProfile.id,
          email: currentProfile.email,
          github_username: currentProfile.github_username,
          role: currentProfile.role,
          slug_id: currentProfile.slug_id,
        },
        source_profile: {
          id: sourceProfile.id,
          email: sourceProfile.email,
          github_username: sourceProfile.github_username,
          role: sourceProfile.role,
          slug_id: sourceProfile.slug_id,
          full_name: sourceProfile.full_name,
          created_at: sourceProfile.created_at,
        },
        merged_result: {
          email: currentProfile.email || sourceProfile.email || null,
          github_username: currentProfile.github_username || sourceProfile.github_username || null,
          skills: mergedSkills,
          socials: mergedSocials,
          linked_accounts: mergedLinked,
        },
        changes,
        warning:
          sourceProfile.role === "maintainer" && currentProfile.role !== "maintainer"
            ? "The source profile has Maintainer role. Merging will not transfer roles. Contact a maintainer if you need role consolidation."
            : null,
      },
    });
  } catch (err) {
    logger.error("[account/merge/initiate] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}, "sensitive");
