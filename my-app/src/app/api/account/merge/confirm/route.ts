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
import { z } from "zod";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { auth0 } from "@/lib/auth0";
import { mergeProfiles } from "@/lib/actions/account-consolidation";

const confirmSchema = z.object({
  source_profile_id: z.string().uuid("source_profile_id must be a valid UUID"),
  confirm: z.literal(true),
});

export const POST = withRateLimit(async (request: Request) => {
  try {
    // Authenticate
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0UserId = session.user.sub;
    const body = await request.json().catch(() => ({}));
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 }
      );
    }
    const { source_profile_id } = parsed.data;

    // Execute the merge; mergeProfiles resolves the target from auth0UserId
    // and authorizes the source against the caller's merge candidates.
    const result = await mergeProfiles(source_profile_id, auth0UserId);

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
