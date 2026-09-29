/**
 * Shared constants for Butwal Hacks.
 *
 * Centralizes environment variable access so components don't duplicate
 * the fallback logic. Import these instead of reading process.env directly.
 */

/**
 * App subdomain — auth routes live here.
 * In dev (localhost), env vars point to the same origin.
 * In production, NEXT_PUBLIC_APP_URL should be set to https://app.butwalhacks.com
 */
export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || "https://app.butwalhacks.com";

/**
 * Public site URL — used for SEO metadata, canonical links, and Open Graph.
 *
 * Trimmed, and defaulted to the `www` host. Two reasons, both learned the
 * hard way:
 *
 * 1. Whitespace. This env var shipped to production as
 *    `https://butwalhacks.com \n` — a trailing space plus newline. Code that
 *    interpolates it into a template literal emits that whitespace *inside*
 *    the URL, corrupting all 228 `sitemap.xml` entries, the robots.txt
 *    `Sitemap:` line, the iCal feed, and claim links in outbound email.
 *    `new URL()` strips the whitespace silently, so the bug is invisible in
 *    canonicals and only appears in string output — the whole SEO surface.
 * 2. Host. The apex 307s to `www`, so a sitemap built on the apex lists 228
 *    URLs that are all redirects. The canonical host is `www`.
 *
 * Anything that needs a URL should import this, not read the env var, so
 * there is one place for the value and one place that normalises it.
 */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.butwalhacks.com"
).trim();

/**
 * Contact email for the organization.
 */
export const CONTACT_EMAIL = "hello@butwalhacks.com";
