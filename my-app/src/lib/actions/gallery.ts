"use server";

import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";

/**
 * Paged reads for the public event gallery.
 *
 * The gallery used to be a single unbounded read that was silently capped at
 * 100 rows. Because the visible counts ("N photos", "M videos", "K events")
 * were derived from the returned array, the cap did not just hide photos — it
 * made the page claim "100 photos, 0 videos" while 466 more sat in the
 * database. Counting from the database instead of the page, and paging
 * through the rest, fixes both halves of that.
 */

export type GalleryPhoto = {
  id: string;
  url: string;
  event: string;
  event_slug: string | null;
  date: string;
  span: number;
  uploader: string | null;
  /** Maintainer-chosen delivery recipe (null = default) */
  optimize: string | null;
  /** Duration in seconds — only set for video entries */
  duration?: number;
  /** "image" | "video". The URL is authoritative; this is the stored hint. */
  media_type?: string;
};

/**
 * Totals for the stat bar. Read with COUNT so they stay correct no matter how
 * many rows the current page holds.
 */
export type GalleryTotals = {
  photos: number;
  videos: number;
  /** Events actually represented in the gallery (not all published events). */
  events: number;
};

/**
 * Total items per request, including the one probe row described below.
 * The client sends only an offset, so paging cannot be used to pull the whole
 * table in one oversized request.
 */
const PAGE_SIZE = 60;

/** Hard ceiling on offset so a crafted offset cannot force a deep scan. */
const MAX_OFFSET = 5000;

const PHOTO_SELECT = `
  id, url, span, optimized_transform, created_at, media_type, duration_seconds,
  events ( id, title, slug ),
  profiles!photos_uploader_id_fkey ( full_name )
`;

export async function fetchGalleryTotals(): Promise<GalleryTotals> {
  const supabase = createServiceClient();

  // One round trip. COUNT(DISTINCT event_id) is not expressible over
  // PostgREST, so this lives in SQL — see migration 132.
  const { data, error } = await supabase.rpc("gallery_totals");

  if (error || !data) {
    logger.error("Error fetching gallery totals:", error);
    // Do not blank the stat bar on a transient failure; the rendered rows
    // still stand on their own.
    return { photos: 0, videos: 0, events: 0 };
  }

  const row = data as Partial<GalleryTotals>;
  return {
    photos: row.photos ?? 0,
    videos: row.videos ?? 0,
    events: row.events ?? 0,
  };
}

export type GalleryEvent = { title: string; slug: string | null };

export async function fetchGalleryEvents(): Promise<GalleryEvent[]> {
  const supabase = createServiceClient();
  // Paginate so event discovery is not truncated by the PostgREST row cap
  // before deduplication.
  const seen = new Set<string>();
  const out: GalleryEvent[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("photos")
      .select("events!inner(id, title, slug)")
      .eq("status", "approved")
      .not("event_id", "is", null)
      .range(offset, offset + PAGE - 1);
    if (error) {
      logger.error("Error fetching gallery events:", error);
      break;
    }
    const rows = (data ?? []) as Array<{ events: { title?: string; slug?: string } | null }>;
    for (const row of rows) {
      const ev = Array.isArray(row.events) ? row.events[0] : row.events;
      const title = ev?.title;
      if (!title || seen.has(title)) continue;
      seen.add(title);
      out.push({ title, slug: ev?.slug ?? null });
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

export async function fetchGalleryPage(
  offset: number,
  eventFilter?: string,
): Promise<{ photos: GalleryPhoto[]; hasMore: boolean }> {
  const supabase = createServiceClient();

  // Clamp whatever the client sent.
  const safeOffset =
    Number.isFinite(offset) && offset > 0
      ? Math.min(Math.floor(offset), MAX_OFFSET)
      : 0;

  let query = supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    // Defensive tie-break. Every row currently has a distinct created_at, but
    // an unstable sort is what makes paged UIs drop or duplicate rows at the
    // page boundary when a future upload lands in the same millisecond.
    .order("id", { ascending: true })
  if (eventFilter) {
    query = query.eq("events.title", eventFilter)
  }
  const { data, error } = await query.range(safeOffset, safeOffset + PAGE_SIZE);

  if (error) {
    logger.error("Error fetching gallery page:", error);
    // Degrade to the honest empty page rather than taking down the route.
    return { photos: [], hasMore: false };
  }

  const rows = data ?? [];
  // We asked for PAGE_SIZE + 1: the extra row is purely the "there is more"
  // signal, so it must not reach the grid or the last page renders ragged.
  const hasMore = rows.length > PAGE_SIZE;
  return { photos: rows.slice(0, PAGE_SIZE).map(mapPhoto), hasMore };
}

function mapPhoto(p: Record<string, unknown>): GalleryPhoto {
  // PostgREST types the embedded event/profile as one-to-many, so they can
  // arrive wrapped in an array. Unwrap the same way the original read did,
  // otherwise `ev.title` is undefined and every tile reads "Unknown Event".
  const ev = (Array.isArray(p.events) ? p.events[0] : p.events ?? {}) as {
    title?: string;
    slug?: string;
  };
  const prof = (Array.isArray(p.profiles)
    ? p.profiles[0]
    : p.profiles ?? {}) as { full_name?: string };
  const row = p as {
    id?: string;
    url?: string;
    created_at?: string;
    optimized_transform?: string | null;
    span?: number;
    duration_seconds?: number | null;
    media_type?: string;
  };
  return {
    id: row.id ?? "",
    url: row.url ?? "",
    event: ev.title ?? "Unknown Event",
    event_slug: ev.slug ?? null,
    date: row.created_at ?? "",
    span: row.span ?? 1,
    uploader: prof.full_name ?? null,
    optimize: row.optimized_transform ?? null,
    duration:
      row.duration_seconds === null || row.duration_seconds === undefined
        ? undefined
        : Number(row.duration_seconds),
    media_type: row.media_type ?? "image",
  };
}
