import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limiter";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";

/**
 * GET /api/bounties
 *
 * Public endpoint — lists active bounty opportunities.
 * No auth required. Returns only is_active = true, is_bounty = true.
 */
export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const u = new URL(req.url);
    const page = parseInt(u.searchParams.get("page") ?? "", 10) || 1;
    const per_page = parseInt(u.searchParams.get("per_page") ?? "", 10) || 20;

    const { getPublicOpportunities } = await import("@/lib/actions/sponsor-opportunities");
    const result = await getPublicOpportunities({ is_bounty: true, page, per_page });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=120" },
    });
  } catch (err) {
    logger.error("[api/bounties] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});

/**
 * POST /api/bounties
 *
 * Sponsor-only — creates a new bounty opportunity.
 * Requires authenticated sponsor session.
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { createOpportunity } = await import("@/lib/actions/sponsor-opportunities");

    const result = await createOpportunity({
      title: body.title,
      description: body.description,
      type: "bounty",
      compensation: body.compensation,
      currency: body.currency || "USD",
      location: body.location,
      is_remote: body.is_remote ?? true,
      skills_required: body.skills_required || [],
      application_url: body.application_url,
      application_deadline: body.application_deadline,
      is_bounty: true,
      bounty_amount: body.bounty_amount,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    logger.error("[api/bounties] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}, "sensitive");
