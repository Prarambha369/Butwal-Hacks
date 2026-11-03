/**
 * POST /api/account/merge/confirm
 *
 * Confirm and execute an account merge.
 * This is the final step after the user has reviewed the merge preview.
 *
 * Request body:
 *   { source_profile_id: string, confirm: true }
 *
 * Response:
 *   { success: true, merged_profile_id: string }
 *   or { success: false, error: "message" }
 */

import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { auth0 } from "@/lib/auth0";
import { mergeProfiles } from "@/lib/actions/account-consolidation";

export const POST = withRateLimit(async (request: Request) => {
  try {
    // Authenticate
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0UserId = session.user.sub;
    const body = await request.json().catch(() => ({}));
    const { source_profile_id, confirm } = body as {
      source_profile_id?: string;
      confirm?: boolean;
    };

    if (!source_profile_id) {
      return NextResponse.json(
        { error: "source_profile_id is required" },
        { status: 400 }
      );
    }

    if (!confirm) {
      return NextResponse.json(
        { error: "Confirmation required. Set confirm=true to proceed." },
        { status: 400 }
      );
    }

    // Execute the merge
    const result = await mergeProfiles(
      // Target = current user's profile (we need to look it up)
      // The mergeProfiles function looks up the target by auth0UserId
      // So we pass a placeholder and let it resolve
      "need-target-lookup",
      source_profile_id,
      auth0UserId
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    logger.info("[account/merge/confirm] Merge completed", {
      auth0UserId,
      source_profile_id,
      merged_profile_id: result.mergedProfileId,
    });

    return NextResponse.json({
      success: true,
      merged_profile_id: result.mergedProfileId,
      message:
        "Your accounts have been merged. The other profile has been deactivated.",
    });
  } catch (err) {
    logger.error("[account/merge/confirm] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}, "sensitive");
