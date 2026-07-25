import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

/**
 * GET /api/metrics
 *
 * Public endpoint returning aggregate platform statistics.
 * Used by the landing page stats bar, footer counters, and external widgets.
 * No authentication required — cached aggressively by the CDN.
 *
 * Returns:
 *   { total_hackers, total_events, total_projects, total_trust_markers }
 */
export const revalidate = 86400; // 24 hours

export const GET = withRateLimit(async () => {
  try {
    const db = createServiceClient();

    const [
      { count: totalHackers },
      { count: totalEvents },
      { count: totalProjects },
      { count: totalTrustMarkers },
    ] = await Promise.all([
      db
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "hacker"),
      db
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      db
        .from("projects")
        .select("*", { count: "exact", head: true }),
      db
        .from("trust_markers")
        .select("*", { count: "exact", head: true })
        .eq("is_revoked", false),
    ]);

    return NextResponse.json({
      total_hackers: totalHackers ?? 0,
      total_events: totalEvents ?? 0,
      total_projects: totalProjects ?? 0,
      total_trust_markers: totalTrustMarkers ?? 0,
    }, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch (error) {
    logger.warn("[metrics] Failed to fetch aggregate stats:", error);
    // ponytail: never expose internal errors on a public endpoint
    return NextResponse.json(
      {
        total_hackers: 0,
        total_events: 0,
        total_projects: 0,
        total_trust_markers: 0,
        error: "Failed to fetch metrics",
      },
      { status: 500 },
    );
  }
}, "frequent");
