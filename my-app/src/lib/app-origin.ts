/**
 * Where the app (auth, API, dashboard) lives, as seen from the browser.
 *
 * Empty on Vercel and in `next dev`: the app and the marketing pages share an
 * origin, so every call stays relative and nothing changes. The static
 * marketing build on Cloudflare (scripts/build-static.mjs) sets
 * NEXT_PUBLIC_APP_ORIGIN=https://app.butwalhacks.com, and the few client-side
 * calls a marketing page makes (session probe, chat, search, live stats,
 * event registration) go there instead. The session cookie is shared across
 * butwalhacks.com subdomains (lib/cookie-domain.ts), so `credentials:
 * "include"` carries it; the app answers with CORS for the marketing origins
 * (lib/cors.ts). See docs/CLOUDFLARE.md.
 */
export const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_ORIGIN ?? "").replace(/\/$/, "");

/** `path` on the app origin; unchanged when the app shares this origin. */
export function appUrl(path: string): string {
  return APP_ORIGIN ? `${APP_ORIGIN}${path}` : path;
}

/** Fetch credentials that carry the session to the app origin. */
export const APP_CREDENTIALS: RequestCredentials = APP_ORIGIN ? "include" : "same-origin";
