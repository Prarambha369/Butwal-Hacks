import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/annual-report
 *
 * Generates an annual impact report with key metrics from the platform.
 * Requires maintainer role. Returns structured JSON for rendering.
 *
 * Query params:
 *   year — defaults to previous year (e.g., 2025)
 *
 * ponytail: Single endpoint aggregates all metrics in one query batch.
 * Upgrade path: Add PDF export via Puppeteer/Playwright for downloadable reports.
 */

async function getMetrics(year: number) {
  const supabase = createServiceClient();
  const startDate = `${year}-01-01T00:00:00Z`;
  const endDate = `${year + 1}-01-01T00:00:00Z`;

  const [
    { count: newProfiles },
    { count: newEvents },
    { count: newProjects },
    { count: newTeams },
    { count: newMarkers },
    { count: newCredentials },
    { count: newRegistrations },
    { data: xpData },
    { data: topHackers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("events").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("projects").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("teams").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("trust_markers").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("profile_micro_credentials").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("event_registrations").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("profiles").select("xp")
      .gte("created_at", startDate).lt("created_at", endDate),
    supabase.from("profiles").select("bh_id, full_name, xp")
      .order("xp", { ascending: false }).limit(10),
  ]);

  const totalXpAwarded = xpData?.reduce((sum, p) => sum + (p.xp ?? 0), 0) ?? 0;

  // Monthly breakdown
  const { data: monthlyProfiles } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", startDate)
    .lt("created_at", endDate);

  const monthlySignups = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const count = monthlyProfiles?.filter((p) => {
      const d = new Date(p.created_at);
      return d.getMonth() + 1 === month;
    }).length ?? 0;
    return { month, count };
  });

  return {
    year,
    generatedAt: new Date().toISOString(),
    summary: {
      newUsers: newProfiles ?? 0,
      newEvents: newEvents ?? 0,
      newProjects: newProjects ?? 0,
      newTeams: newTeams ?? 0,
      trustMarkersIssued: newMarkers ?? 0,
      microCredentialsAwarded: newCredentials ?? 0,
      eventRegistrations: newRegistrations ?? 0,
      totalXpAwarded,
    },
    topHackers: topHackers ?? [],
    monthlySignups,
    // ponytail: These are static placeholders until real data sources are connected
    communityMetrics: {
      activeChapters: 3, // Pokhara, Kathmandu, Chitwan
      sponsorOrganizations: 0,
      bountyCompleted: 0,
      totalEventsHeld: newEvents ?? 0,
    },
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth0_user_id", session.user.sub)
      .single();

    if (profile?.role !== "maintainer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") ?? "", 10) || new Date().getFullYear() - 1;

    const report = await getMetrics(year);

    return NextResponse.json(report);
  } catch (err) {
    logger.error("[annual-report] Error:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
