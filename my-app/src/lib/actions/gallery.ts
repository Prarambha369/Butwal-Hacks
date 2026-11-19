"use server";

import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import { PHOTO_SELECT, PHOTO_SELECT_BY_EVENT, mapPhoto, selectWithCaptionFallback } from "@/lib/gallery-photo";
import type { GalleryPhoto } from "@/lib/gallery-photo";

export type { GalleryPhoto } from "@/lib/gallery-photo";

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
// 24 fills 1, 2, 3 or 4 columns evenly. Infinite scroll pulls the next page
// well before the visitor reaches the end, so a smaller page costs nothing in
// feel but cuts the first-load payload and the thumbnails it pulls in.
const PAGE_SIZE = 24;

/**
 * Totals and the event list change only when a maintainer approves media, but
 * they were read on every visit — and the event list scans every approved row.
 * Neither depends on the viewer, so cache them briefly across requests.
 */
const GALLERY_CACHE_SECONDS = 300;

/** Hard ceiling on offset so a crafted offset cannot force a deep scan. */
const MAX_OFFSET = 5000;

async function readGalleryTotals(): Promise<GalleryTotals> {
  const supabase = createServiceClient();

  // One round trip. COUNT(DISTINCT event_id) is not expressible over
  // PostgREST, so this lives in SQL — see migration 132.
  const { data, error } = await supabase.rpc("gallery_totals");

  // Throw, don't fall back: this runs inside unstable_cache, which would keep
  // a fallback value after the database recovers. The fallback lives in
  // fetchGalleryTotals, outside the cache.
  if (error || !data) throw new Error(`gallery_totals failed: ${error?.message ?? "no data"}`);

  const row = data as Partial<GalleryTotals>;
  return {
    photos: row.photos ?? 0,
    videos: row.videos ?? 0,
    events: row.events ?? 0,
  };
}

export type GalleryEvent = { title: string; slug: string | null };

async function readGalleryEvents(): Promise<GalleryEvent[]> {
  const supabase = createServiceClient();
  // Start from events and inner-join approved photos, so the result is one
  // row per event rather than one row per photo. Reading photos and
  // deduplicating pulled every approved photo row just to build this list.
  // Paginate anyway so a large event table is not cut off by the row cap.
  const seen = new Set<string>();
  const out: GalleryEvent[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("events")
      .select("title, slug, photos!inner(id)")
      .eq("photos.status", "approved")
      .limit(1, { referencedTable: "photos" })
      .order("title", { ascending: true })
      .range(offset, offset + PAGE - 1);
    // Throw rather than return a partial list: the cache would keep the
    // missing filter chips after the database recovers.
    if (error) throw new Error(`gallery events query failed: ${error.message}`);
    const rows = (data ?? []) as Array<{ title?: string | null; slug?: string | null }>;
    for (const row of rows) {
      const title = row.title;
      if (!title || seen.has(title)) continue;
      seen.add(title);
      out.push({ title, slug: row.slug ?? null });
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  // Keep the locale-aware order the UI has always used; the SQL order above
  // only makes pagination stable.
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

const cachedTotals = unstable_cache(readGalleryTotals, ["gallery-totals"], {
  revalidate: GALLERY_CACHE_SECONDS,
  tags: ["gallery"],
});
const cachedEvents = unstable_cache(readGalleryEvents, ["gallery-events"], {
  revalidate: GALLERY_CACHE_SECONDS,
  tags: ["gallery"],
});

export async function fetchGalleryTotals(): Promise<GalleryTotals> {
  try {
    return await cachedTotals();
  } catch (error) {
    logger.error("Error fetching gallery totals:", error);
    // Do not blank the page on a transient failure; the rendered rows still
    // stand on their own. Not cached, so the next request retries.
    return { photos: 0, videos: 0, events: 0 };
  }
}

export async function fetchGalleryEvents(): Promise<GalleryEvent[]> {
  try {
    return await cachedEvents();
  } catch (error) {
    logger.error("Error fetching gallery events:", error);
    return [];
  }
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

  // Filtering on an embedded table only narrows the parent rows when the
  // embed is an inner join. With the plain embed, `.eq("events.title", …)`
  // returned every photo and nulled the event on the rest, so a filtered view
  // showed the whole gallery labelled "Unknown Event".
  const { data, error } = await selectWithCaptionFallback(
    eventFilter ? PHOTO_SELECT_BY_EVENT : PHOTO_SELECT,
    (select) => {
      let query = supabase
        .from("photos")
        .select(select)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        // Defensive tie-break. Every row currently has a distinct created_at,
        // but an unstable sort is what makes paged UIs drop or duplicate rows
        // at the page boundary when a future upload lands in the same ms.
        .order("id", { ascending: true });
      if (eventFilter) query = query.eq("events.title", eventFilter);
      return query.range(safeOffset, safeOffset + PAGE_SIZE);
    },
  );

  if (error) {
    logger.error("Error fetching gallery page:", error);
    // Throw rather than return an empty page: an empty result is a valid
    // answer, and the grid would show it as "no photos" and cache it under the
    // filter, so picking that filter again would never retry. The grid catches
    // this into its retryable error state; the page render degrades itself.
    throw new Error("Could not load the gallery");
  }

  // The select string is chosen at runtime, so PostgREST cannot infer the row
  // type; mapPhoto validates each field itself.
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  // We asked for PAGE_SIZE + 1: the extra row is purely the "there is more"
  // signal, so it must not reach the grid or the last page renders ragged.
  const hasMore = rows.length > PAGE_SIZE;
  return { photos: rows.slice(0, PAGE_SIZE).map(mapPhoto), hasMore };
}

