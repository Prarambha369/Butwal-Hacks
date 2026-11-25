import { cache } from "react";
import { z } from "zod";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";

/**
 * Single approved gallery photo, keyed by id.
 *
 * This lives outside `lib/actions/gallery.ts` because that module is marked
 * `"use server"`, and a server-action module can only export async functions —
 * the row mapper and the column list are plain values. The grid and the
 * per-photo page share them here so there is one mapping of the embedded
 * event/profile rows instead of two that drift.
 *
 * `cache()` dedupes the read within a request: generateMetadata and the page
 * body both need the same photo, and without it every photo page would hit the
 * database twice for one render.
 */

export type GalleryPhoto = {
  id: string;
  url: string;
  event: string;
  event_slug: string | null;
  /** Where the event took place, when the event row records it. */
  location: string | null;
  /** One-line caption for this item; null means "use the event title". */
  caption: string | null;
  /**
   * When the moment happened: the event's start date. Falls back to the
   * upload time only for rows whose event has no date. The upload time alone
   * was wrong for every bulk import (HackDay, 17 Jan, showed as 21 Oct).
   */
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

export const PHOTO_SELECT = `
  id, url, span, optimized_transform, created_at, media_type, duration_seconds, caption,
  events ( id, title, slug, start_date, location ),
  profiles!photos_uploader_id_fkey ( full_name )
`;

/** Same columns, but the event embed is an inner join so it can filter rows. */
export const PHOTO_SELECT_BY_EVENT = PHOTO_SELECT.replace("events (", "events!inner (");

/** Postgres "undefined_column". */
const UNDEFINED_COLUMN = "42703";

/**
 * Run a photos read, retrying without `caption` if the column does not exist
 * yet. Migration 148 adds it; until it has run on a database, the gallery
 * must keep working rather than fail every read. Remove once 148 is applied
 * everywhere.
 */
export async function selectWithCaptionFallback<T>(
  select: string,
  run: (select: string) => PromiseLike<{ data: T; error: { code?: string } | null }>,
): Promise<{ data: T; error: { code?: string } | null }> {
  const first = await run(select);
  if (first.error?.code !== UNDEFINED_COLUMN) return first;
  return run(select.replace(" caption,", ""));
}

export function mapPhoto(p: Record<string, unknown>): GalleryPhoto {
  // PostgREST types the embedded event/profile as one-to-many, so they can
  // arrive wrapped in an array. Unwrap the same way the original read did,
  // otherwise `ev.title` is undefined and every tile reads "Unknown Event".
  const ev = (Array.isArray(p.events) ? p.events[0] : p.events ?? {}) as {
    title?: string;
    slug?: string;
    start_date?: string | null;
    location?: string | null;
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
    caption?: string | null;
  };
  const caption = typeof row.caption === "string" ? row.caption.trim() : "";
  return {
    id: row.id ?? "",
    url: row.url ?? "",
    event: ev.title ?? "Unknown Event",
    event_slug: ev.slug ?? null,
    location: ev.location?.trim() || null,
    caption: caption || null,
    date: ev.start_date ?? row.created_at ?? "",
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

const photoId = z.uuid();

/**
 * Read one approved photo for the canonical per-photo route.
 *
 * The id is validated before any query: `/gallery/anything` must 404 without
 * round-tripping a non-UUID into PostgREST, which would otherwise return a
 * 22P02 cast error that the route would have to distinguish from a real outage.
 *
 * A missing row is the only quiet `null`. A PostgREST error is logged and
 * rethrown so the route fails as a 500: swallowing it would turn a database
 * outage into a mass soft-404, which crawlers then cache as "this photo was
 * removed".
 */
export const getGalleryPhoto = cache(async (id: string): Promise<GalleryPhoto | null> => {
  if (!photoId.safeParse(id).success) return null;

  const supabase = createServiceClient();
  const { data, error } = await selectWithCaptionFallback(PHOTO_SELECT, (select) =>
    supabase.from("photos").select(select).eq("id", id).eq("status", "approved").maybeSingle(),
  );

  if (error) {
    logger.error("Error fetching gallery photo:", error);
    throw error;
  }
  if (!data) return null;
  // The select string is chosen at runtime, so PostgREST cannot type the row.
  return mapPhoto(data as unknown as Record<string, unknown>);
});
