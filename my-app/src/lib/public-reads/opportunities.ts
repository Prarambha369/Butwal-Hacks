/**
 * Active sponsor opportunities for the public /support page and /api/bounties.
 *
 * Plain server module, not a "use server" action file: a server action in a
 * marketing page's import graph blocks the static export (scripts/
 * build-static.mjs), and this read is public anyway. Sponsor writes stay in
 * lib/actions/sponsor-opportunities.ts.
 */
import "server-only";
import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
// ── Get public opportunities (active only) ─────────────────────────

export async function getPublicOpportunities(options?: {
  type?: string;
  is_bounty?: boolean;
  page?: number;
  per_page?: number;
}) {
  try {
    const supabase = createServiceClient();
    const page = Math.max(1, options?.page ?? 1);
    const perPage = Math.min(100, Math.max(1, options?.per_page ?? 20));
    const offset = (page - 1) * perPage;

    // Get total count for pagination metadata
    let countQuery = supabase
      .from("sponsor_opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (options?.type) countQuery = countQuery.eq("type", options.type);
    if (options?.is_bounty !== undefined) countQuery = countQuery.eq("is_bounty", options.is_bounty);

    const { count, error: countError } = await countQuery;
    if (countError) {
      // Not fatal -- the rows can still render -- but it used to report a total
      // of 0 with nothing in the logs to explain why.
      logger.error("[sponsor-opportunities] count query failed", {
        code: countError.code,
        message: countError.message,
      });
    }

    // Fetch paginated results
    let query = supabase
      .from("sponsor_opportunities")
      .select(`
        *,
        sponsor_profiles!inner(
          company_name,
          company_website,
          company_logo_url,
          locations,
          industries
        )
      `)
      .eq("is_active", true);

    if (options?.type) query = query.eq("type", options.type);
    if (options?.is_bounty !== undefined) query = query.eq("is_bounty", options.is_bounty);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      logger.error("[sponsor-opportunities] public opportunities read failed", {
        code: error.code,
        message: error.message,
      });
    }

    return {
      data: data || [],
      pagination: {
        page,
        perPage,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / perPage) : 0,
      },
    };
  } catch (err) {
    logger.error("[sponsor-opportunities] public opportunities read threw", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } };
  }
}
