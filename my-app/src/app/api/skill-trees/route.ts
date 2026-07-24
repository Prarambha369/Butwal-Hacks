import { NextRequest, NextResponse } from "next/server";
import { getSkillTreesWithStatus } from "@/lib/actions/skill-trees";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/skill-trees
 * Returns skill trees with the authenticated user's unlock status.
 * Supports pagination via ?page=1&per_page=10.
 * Used by the Skill Tree UI component.
 */
export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url);
    const page = parseInt(u.searchParams.get("page") ?? "", 10) || undefined;
    const per_page = parseInt(u.searchParams.get("per_page") ?? "", 10) || undefined;

    const trees = await getSkillTreesWithStatus(page ? { page, per_page } : undefined);
    return NextResponse.json({ trees }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch skill trees";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
