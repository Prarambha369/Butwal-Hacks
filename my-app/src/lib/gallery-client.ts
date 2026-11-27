import type { GalleryPhoto } from "@/lib/gallery-photo";
import { appUrl } from "@/lib/app-origin";

export type { GalleryPhoto } from "@/lib/gallery-photo";
export type { GalleryTotals } from "@/lib/public-reads/gallery";

export type GalleryPage = { photos: GalleryPhoto[]; hasMore: boolean };

/**
 * Next page of the public gallery, from GET /api/gallery. Same-origin on
 * Vercel; the app origin on the static marketing site (lib/app-origin.ts).
 * Throws on any failure so the grid shows its retryable error state instead
 * of caching an empty page under the filter.
 */
export async function fetchGalleryPage(offset: number, eventFilter?: string): Promise<GalleryPage> {
  const query = new URLSearchParams({ offset: String(Math.max(0, Math.floor(offset) || 0)) });
  if (eventFilter) query.set("event", eventFilter);
  const res = await fetch(appUrl(`/api/gallery?${query.toString()}`));
  if (!res.ok) throw new Error("Could not load the gallery");
  const body = (await res.json()) as Partial<GalleryPage>;
  if (!Array.isArray(body.photos)) throw new Error("Could not load the gallery");
  return { photos: body.photos, hasMore: Boolean(body.hasMore) };
}
