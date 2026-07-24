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
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL || "https://butwalhacks.com";

/**
 * Contact email for the organization.
 */
export const CONTACT_EMAIL = "hello@butwalhacks.com";
