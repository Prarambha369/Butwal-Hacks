import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase"

export const dynamic = "force-dynamic"

/**
 * GET /api/keep-alive
 *
 * Lightweight Supabase keep-alive endpoint.
 *
 * Authentication:
 * - An Auth0 session is always accepted.
 * - If KEEP_ALIVE_SECRET (alias CRON_SECRET) is configured, unauthenticated
 *   callers must present it as `Authorization: Bearer <secret>` — this lets
 *   the scheduled Keep Alive workflow ping without a user session while
 *   keeping database enumeration behind a shared secret.
 * - If no secret is configured, anonymous pings are allowed so the scheduled
 *   workflow (which sends no credentials) still warms the database instead
 *   of failing with 401. The response only exposes an aggregate row count,
 *   matching the sensitivity of the public /api/health endpoint.
 */
export async function GET(req?: NextRequest) {
  const start = Date.now()
  // Tracked outside try so the catch block can tailor error detail to the caller.
  let authorized = false

  try {
    const cronSecret = process.env.KEEP_ALIVE_SECRET || process.env.CRON_SECRET || ""
    const authHeader = req?.headers.get("authorization") ?? ""
    const bearer = authHeader.replace(/^Bearer\s+/i, "")
    const hasValidCronSecret = Boolean(cronSecret && bearer && bearer === cronSecret)

    const session = await auth0.getSession()
    authorized = Boolean(session?.user) || hasValidCronSecret

    if (!authorized && cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = createServiceClient()

    // Minimal query — just enough to keep the DB warm
    const { count, error } = await db
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (error) throw error

    const elapsed = Date.now() - start

    return NextResponse.json({
      status: "ok",
      db_online: true,
      profile_count: count ?? 0,
      response_time_ms: elapsed,
      timestamp: new Date().toISOString(),
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  } catch (err) {
    const elapsed = Date.now() - start

    // Always log full detail server-side, but only expose it to authorized
    // callers — anonymous pings get a generic message so Supabase/connection
    // internals never leak through this public endpoint.
    logger.error("[api/keep-alive] check failed", err)
    const message = authorized
      ? (err instanceof Error ? err.message : String(err))
      : "Database check failed"

    return NextResponse.json(
      {
        status: "error",
        db_online: false,
        response_time_ms: elapsed,
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
