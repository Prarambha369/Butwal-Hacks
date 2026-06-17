import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { captureServerEvent, identifyServerUser } from "@/lib/analytics/server"
import { posthogLog } from "@/lib/posthog-logger"

const AUTH0_WEBHOOK_SECRET = process.env.AUTH0_WEBHOOK_SECRET ?? "";

/**
 * POST /api/webhooks/auth0
 *
 * Called by Auth0 Action (Post-Login) to sync user to Supabase profiles.
 * Auth0 Actions send a POST with the user's sub (Auth0 User ID), email, and name.
 *
 * If AUTH0_WEBHOOK_SECRET is set (production), verifies the X-Webhook-Secret
 * header matches. In dev, the secret is usually unset so the check is skipped.
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    // ponytail: content-length check before parsing body
    const rawLength = req.headers.get("content-length")
    const contentLength = parseInt(rawLength ?? "0", 10)
    if (!isNaN(contentLength) && contentLength > 1_048_576) {
      return new NextResponse("Payload too large", { status: 413 })
    }

    // ── Webhook secret verification ──────────────────────────────
    // Only enforced when AUTH0_WEBHOOK_SECRET is set (production).
    // Dev/staging environments can leave it unset to skip the check.
    if (AUTH0_WEBHOOK_SECRET) {
      const headerSecret = req.headers.get("x-webhook-secret");
      if (!headerSecret || headerSecret !== AUTH0_WEBHOOK_SECRET) {
        logger.warn("[auth0-webhook] Rejected request — invalid or missing webhook secret");
        return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
      }
    }

    const { sub, email, name } = await req.json() as {
      sub?: string
      email?: string
      name?: string
    }

    if (!sub || !email) {
      return NextResponse.json({ error: "sub and email are required" }, { status: 400 })
    }

    const db = createServiceClient()

    // Check if profile already exists (by auth0_user_id)
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", sub)
      .single()

    let profileDbId: string | undefined = existingProfile?.id

    if (existingProfile) {
      // Update existing profile
      await db
        .from("profiles")
        .update({
          email,
          full_name: name?.trim() || null,
        })
        .eq("id", existingProfile.id)

      posthogLog.info("Auth0 webhook: existing profile updated", {
        auth0_id: sub,
        email,
        has_name: !!name,
      });
    } else {
      // Atomic BH-ID generation via Postgres RPC — prevents race conditions
      // on concurrent signups (migration 086_atomic_bh_id_generation).
      const { data: result, error: rpcError } = await db.rpc('create_profile_with_bh_id', {
        p_auth0_user_id: sub,
        p_email: email,
        p_full_name: name?.trim() || 'New Hacker',
        p_role: 'hacker',
      })

      if (rpcError || !result) {
        logger.error("[auth0-webhook] RPC insert failed:", rpcError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      profileDbId = (result as { id: string }).id
      const bhId = (result as { bh_id: string }).bh_id

      await identifyServerUser(sub, { bh_id: bhId, role: "hacker" })
      await captureServerEvent('user_signed_up', sub, { bh_id: bhId })

      posthogLog.info("Auth0 webhook: new profile created", {
        auth0_id: sub,
        email,
        bh_id: bhId,
        name: name?.trim(),
      });

      logger.info(`[auth0-webhook] Created profile with BH-ID: ${bhId} for ${email}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    posthogLog.error("Auth0 webhook failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[auth0-webhook] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}, "bulk")
