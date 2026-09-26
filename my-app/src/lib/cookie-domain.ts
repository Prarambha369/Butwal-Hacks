/**
 * Shared cookie domain, kept in its own module so it can be imported by code
 * that must not pull in the Auth0 SDK.
 *
 * `auth0.ts` instantiates `new Auth0Client(...)` at module scope, so importing
 * it from a route helper drags the whole SDK (and its env reads) into that
 * module's import graph and its tests. The Google OAuth state cookie needs the
 * identical policy — see `google-calendar/oauth-state.ts` — so both live here.
 */

/**
 * Shared session-cookie domain so auth state is visible on BOTH
 * butwalhacks.com and app.butwalhacks.com.
 *
 * Without this, the session cookie is host-scoped: logging in on the app
 * subdomain leaves the apex domain (and vice versa) reading logged-out —
 * navbars keep showing Sign in / Sign up and `getSession()` returns null.
 * A `Domain=butwalhacks.com` cookie is sent to the apex + all subdomains.
 *
 * The serving origin (APP_BASE_URL, required env) decides: localhost and
 * preview/unknown hosts keep the default host-only cookie so auth keeps
 * working there. Only a butwalhacks.com origin gets the shared domain.
 */
export function sharedCookieDomain(): string | undefined {
  const baseUrl =
    process.env.APP_BASE_URL ??
    process.env.AUTH0_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "";
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    if (!host) return undefined;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "app.localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".pages.dev")
    ) {
      return undefined;
    }
    if (host === "butwalhacks.com" || host.endsWith(".butwalhacks.com")) {
      return "butwalhacks.com";
    }
    // Unknown host (custom preview, tunnel) — host-only cookie is the safe default.
    return undefined;
  } catch {
    return undefined;
  }
}
