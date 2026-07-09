import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { getYearMetrics } from "@/lib/metrics";

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
    const yearSchema = z
      .string()
      .optional()
      .transform((v) => {
        const n = parseInt(v ?? "", 10);
        if (!Number.isFinite(n) || n < 2020 || n > 2099) return new Date().getFullYear() - 1;
        return n;
      });
    const year = yearSchema.parse(url.searchParams.get("year") ?? undefined);

    const report = await getYearMetrics(year, true);

    return NextResponse.json(report);
  } catch (err) {
    logger.error("[annual-report] Error:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
