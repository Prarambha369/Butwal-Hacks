import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export const dynamic = "force-dynamic"

/**
 * GET /api/keep-alive
 *
 * Lightweight Supabase keep-alive endpoint.
 * Call this every few days to prevent the Supabase free-tier database
 * from pausing after 7 days of inactivity.
 *
 * Vercel Cron Jobs are Pro-only — on the Hobby plan, use a free external
 * cron service to hit this endpoint every 3 days:
 *   - cron-job.org (free, no account needed for basic schedules)
 *   - GitHub Actions scheduled workflow with a simple curl
 *   - UptimeRobot free tier (50 monitors, 5-min checks)
 */
export async function GET() {
  const start = Date.now()

  try {
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

    return NextResponse.json(
      {
        status: "error",
        db_online: false,
        response_time_ms: elapsed,
        message: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
