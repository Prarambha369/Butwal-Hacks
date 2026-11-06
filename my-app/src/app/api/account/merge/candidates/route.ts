/**
 * GET /api/account/merge/candidates
 *
 * Find profiles that might be duplicates of the current user's profile.
 * Used to suggest accounts that can be merged.
 *
 * Response:
 *   { candidates: MergeCandidate[] }
 */

import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limiter";
import { auth0 } from "@/lib/auth0";
import { findMergeCandidates, githubAccountId, linkedAuth0Subjects } from "@/lib/actions/account-consolidation";

export const GET = withRateLimit(async () => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0UserId = session.user.sub;

    // Look up current profile
    const db = (await import("@/utils/supabase").then((m) => m.createServiceClient()));

    const { data: currentProfile } = await db
      .from("profiles")
      .select("id, email, github_username, linked_accounts")
      .eq("auth0_user_id", auth0UserId)
      .single();

    if (!currentProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const candidates = await findMergeCandidates(
      currentProfile.id,
      currentProfile.email,
      githubAccountId(currentProfile.linked_accounts),
      linkedAuth0Subjects(currentProfile.linked_accounts)
    );

    return NextResponse.json({ candidates });
  } catch (err) {
    // Import logger lazily to avoid edge runtime issues
    const { logger } = await import("@/lib/logger");
    logger.error("[account/merge/candidates] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}, "frequent");
