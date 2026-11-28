/**
 * Event share banners: each partner event's own 1200×630 Open Graph image,
 * copied into public/events/ (not hotlinked) so the static export serves it.
 *
 * - HackDay Butwal: designed in Figma in the HackDay site's style.
 * - Daydream Butwal: daydream.butwalhacks.com/og-image.png.
 * - CyberUtsav Lumbini: cyberutsavlumbini.butwalhacks.com/og-image.png.
 *
 * Keyed by event slug, like lib/external-registration.ts. A banner an
 * organizer uploads (events.banner_url) still wins; this is the fallback,
 * so no database change is needed.
 */
import { SITE_URL } from "@/lib/constants";

export const SHARE_BANNER_WIDTH = 1200;
export const SHARE_BANNER_HEIGHT = 630;

export const EVENT_SHARE_BANNERS: Readonly<Record<string, string>> = {
  "hackday-butwal": "/events/hackday-butwal.png",
  "daydream-butwal": "/events/daydream-butwal.png",
  "cyberutsav-lumbini": "/events/cyberutsav-lumbini.png",
};

/** The share banner path for an event, or null if it has none. */
export function shareBannerPath(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return Object.hasOwn(EVENT_SHARE_BANNERS, slug) ? EVENT_SHARE_BANNERS[slug] : null;
}

/** True for one of the 1200×630 share banners above (shown uncropped on the detail page). */
export function isShareBanner(url: string | null | undefined): boolean {
  return typeof url === "string" && Object.values(EVENT_SHARE_BANNERS).includes(url);
}

/** The banner to show: an uploaded banner first, else the event's share banner. */
export function resolveEventBanner(
  slug: string | null | undefined,
  bannerUrl: string | null | undefined,
): string | null {
  const uploaded = bannerUrl?.trim();
  return uploaded ? uploaded : shareBannerPath(slug);
}

/** Absolute URL for a banner path, for og:image and JSON-LD. */
export function absoluteBannerUrl(url: string): string {
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}
