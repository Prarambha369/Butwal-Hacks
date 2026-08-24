import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase"

export const dynamic = "force-dynamic"

/**
 * GET /api/keep-alive
 *
 * Lightweight Supabase keep-alive endpoint.
 * Requires authentication to prevent unauthorized database enumeration.
 */
export async function GET() {
  const start = Date.now()

  try {
    const session = await auth0.getSession()
    if (!session?.user) {
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
