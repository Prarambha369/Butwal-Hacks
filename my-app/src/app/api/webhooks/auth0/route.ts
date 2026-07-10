import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { captureServerEvent, identifyServerUser } from "@/lib/analytics/server"
import { posthogLog } from "@/lib/posthog-logger"

/**
 * POST /api/webhooks/auth0
 *
 * Called by Auth0 Action (Post-Login) to sync user to Supabase profiles.
 * Auth0 Actions send a POST with the user's sub (Auth0 User ID), email, and name.
 *
 * ponytail: No webhook signature verification since this is called from Auth0's
 * trusted Actions environment. In production, add a shared secret header check
 * (AUTH0_WEBHOOK_SECRET) to prevent unauthorized access.
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    // ponytail: content-length check before parsing body
    const rawLength = req.headers.get("content-length")
    const contentLength = parseInt(rawLength ?? "0", 10)
    if (!isNaN(contentLength) && contentLength > 1_048_576) {
      return new NextResponse("Payload too large", { status: 413 })
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
      // Generate a sequential BH-ID: BH-YY-NNN
      const yearSuffix = new Date().getFullYear().toString().slice(-2)
      const { data: maxRow } = await db
        .from("profiles")
        .select("slug_id")
        .like("slug_id", `BH-${yearSuffix}-%`)
        .order("slug_id", { ascending: false })
        .limit(1)
        .maybeSingle()

      let nextNum = 1
      if (maxRow?.slug_id) {
        const parts = maxRow.slug_id.split("-")
        const lastNum = parseInt(parts[2], 10)
        if (!isNaN(lastNum)) nextNum = lastNum + 1
      }
      const bhId = `BH-${yearSuffix}-${String(nextNum).padStart(3, "0")}`
      profileDbId = crypto.randomUUID()

      await db.from("profiles").insert({
        id: profileDbId,
        auth0_user_id: sub,
        slug_id: bhId,
        bh_id: bhId,
        email,
        full_name: name?.trim() || "New Hacker",
        role: "hacker",
        is_claimed: true,
      })

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
})
