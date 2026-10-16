import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { scoreText, searchStatic, suggestNearMisses } from "@/lib/search-index";
import { SEARCH_TERM_PATTERN } from "@/lib/validation";

type SearchType = "profile" | "project" | "event" | "blog" | "initiative" | "chapter";

interface SearchItem {
  type: SearchType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** Relevance score. Only meaningful for ordering; not shown to the user. */
  score: number;
}

/**
 * The free-text part of a search query.
 *
 * Comma, parenthesis, period, colon and asterisk are PostgREST's own `or()`
 * grammar delimiters, and the query is interpolated into that grammar below.
 * Allowing them means a crafted query can close one condition and append
 * another. The character class is the boundary that keeps a user-supplied
 * string a *value* rather than a fragment of filter syntax.
 */
const SEARCH_QUERY = z
  .string()
  .transform(v => v.trim())
  .pipe(
    z
      .string()
      .min(2)
      .max(100)
      .regex(
        SEARCH_TERM_PATTERN,
        "Search terms may only contain letters, numbers, spaces and _ ' & + . -",
      ),
  );

const searchSchema = z.object({
  q: SEARCH_QUERY,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = searchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ results: [], suggestions: [] });
    }

    const { q, page, limit } = parsed.data;
    const term = `%${q}%`;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = createServiceClient();

    const [profilesRes, projectsRes, eventsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, bh_id")
        .or(`full_name.ilike.${term},bh_id.ilike.${term}`)
        .range(from, to),
      supabase
        .from("projects")
        .select("id, title")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .range(from, to),
      supabase
        .from("events")
        .select("id, slug, title, start_date")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .range(from, to),
    ]);

    const results: SearchItem[] = [];

    // Database-backed sources. Titles are re-scored locally so they rank on the
    // same curve as the static index instead of arriving in fixed source order.
    profilesRes.data?.forEach((p) => {
      const title = p.full_name || "Unnamed";
      results.push({
        type: "profile",
        id: p.id,
        title,
        subtitle: p.bh_id || "",
        href: `/p/${p.bh_id || p.id}`,
        score: scoreText(q, `${title} ${p.bh_id || ""}`),
      });
    });

    projectsRes.data?.forEach((p) => {
      results.push({
        type: "project",
        id: p.id,
        title: p.title,
        subtitle: "Project",
        href: `/projects/${p.id}`,
        score: scoreText(q, p.title, 6),
      });
    });

    eventsRes.data?.forEach((e) => {
      results.push({
        type: "event",
        id: e.id,
        title: e.title,
        subtitle: e.start_date
          ? new Date(e.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Event",
        href: `/events/${e.slug}`,
        score: scoreText(q, e.title, 6),
      });
    });

    // Code-backed sources: blog posts (including body text), chapters, initiatives.
    searchStatic(q, limit).forEach((doc) => {
      results.push({
        type: doc.type,
        id: doc.id,
        title: doc.title,
        subtitle: doc.subtitle,
        href: doc.href,
        score: scoreText(q, `${doc.title} ${doc.tags.join(" ")}`),
      });
    });

    results.sort((a, b) => b.score - a.score);

    const hasMore =
      (profilesRes.data?.length ?? 0) >= limit ||
      (projectsRes.data?.length ?? 0) >= limit ||
      (eventsRes.data?.length ?? 0) >= limit;

    // Did-you-mean, only when nothing matched at all.
    const suggestions = results.length === 0 ? suggestNearMisses(q) : [];

    return NextResponse.json({ results, suggestions, page, limit, hasMore });
  } catch (err) {
    logger.error("[api/search] Unexpected error:", err);
    return NextResponse.json({ results: [], suggestions: [] }, { status: 500 });
  }
}, "frequent");
