/**
 * Cron: Aggregate Daily Stats
 *
 * Vercel Cron Job — runs daily at 00:00 UTC.
 * Aggregates platform metrics into a daily snapshot table for analytics.
 *
 * Cron config in vercel.json:
 *   "crons": [{
 *     "path": "/api/cron/daily-stats",
 *     "schedule": "0 0 * * *"
 *   }]
 *
 * Protected by CRON_SECRET environment variable.
 *
 * ponytail: Single aggregation query — no incremental logic.
 * Upgrade path: Add hourly aggregation for real-time dashboards.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { logger } from "@/lib/logger";
import { posthogLog } from "@/lib/posthog-logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const today = new Date().toISOString().split("T")[0];

    // Aggregate counts
    const [
      { count: totalUsers },
      { count: totalEvents },
      { count: totalProjects },
      { count: totalTeams },
      { count: newSignups },
      { count: newMarkers },
      { data: xpData },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("teams").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00Z`),
      supabase
        .from("trust_markers")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00Z`),
      supabase.from("profiles").select("xp"),
    ]);

    const totalXp = xpData?.reduce((sum, p) => sum + (p.xp ?? 0), 0) ?? 0;

    // Upsert into daily_stats table
    const { error } = await supabase.from("daily_stats").upsert(
      {
        date: today,
        total_users: totalUsers ?? 0,
        total_events: totalEvents ?? 0,
        total_projects: totalProjects ?? 0,
        total_teams: totalTeams ?? 0,
        new_signups: newSignups ?? 0,
        new_markers: newMarkers ?? 0,
        total_xp: totalXp,
      },
      { onConflict: "date" },
    );

    if (error) throw error;

    posthogLog.info("Cron: daily stats aggregated", {
      date: today,
      total_users: totalUsers,
      total_events: totalEvents,
    });

    return NextResponse.json({
      ok: true,
      date: today,
      stats: {
        totalUsers,
        totalEvents,
        totalProjects,
        totalTeams,
        newSignups,
        newMarkers,
        totalXp,
      },
    });
  } catch (err) {
    logger.error("[cron-daily-stats] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
