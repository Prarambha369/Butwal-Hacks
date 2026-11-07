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
  id, url, span, optimized_transform, created_at, media_type, duration_seconds,
  events ( id, title, slug ),
  profiles!photos_uploader_id_fkey ( full_name )
`;

export function mapPhoto(p: Record<string, unknown>): GalleryPhoto {
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
  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    logger.error("Error fetching gallery photo:", error);
    throw error;
  }
  if (!data) return null;
  return mapPhoto(data as Record<string, unknown>);
});
