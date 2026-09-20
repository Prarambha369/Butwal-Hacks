import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Shared session-cookie domain so auth state is visible on BOTH
 * butwalhacks.com and app.butwalhacks.com.
 *
 * Without this, the session cookie is host-scoped: logging in on the app
 * subdomain leaves the apex domain (and vice versa) reading logged-out —
 * navbars keep showing Sign in/Sign up and `getSession()` returns null.
 * A `Domain=butwalhacks.com` cookie is sent to the apex + all subdomains.
 * Localhost keeps the default (host-only) cookie so dev still works.
 */
function sharedCookieDomain(): string | undefined {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_BASE_URL ?? "";
  try {
    const host = new URL(siteUrl).hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return undefined;
    // eTLD+1 heuristic is enough for butwalhacks.com (no public-suffix edge).
    return host.split(".").slice(-2).join(".");
  } catch {
    return undefined;
  }
}

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  // SDK v4 renamed AUTH0_BASE_URL to APP_BASE_URL; accept both so the
  // official quickstart env block works unchanged.
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL,
  session: {
    cookie: {
      domain: sharedCookieDomain(),
    },
  },
});
