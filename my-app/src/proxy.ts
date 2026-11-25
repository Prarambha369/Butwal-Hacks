import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { PORTAL_ROLES } from "@/lib/dashboard-access";
import { buildNonceCsp, generateNonce, usesNonceCsp } from "@/lib/csp";
import {
  handleLocalDev,
  redirectSignIn,
  redirectToDomain,
  requireAnyAuth,
  requireRole,
  requireRoleByPath,
  runAuthMiddleware,
} from "@/proxy-helpers";

const MARKETING_ROUTES = new Set([
  "/",
  "/about",
  "/blog",
  "/chapters",
  "/contact",
  "/cookie-policy",
  "/docs",
  "/events",
  "/explore",
  "/faq",
  "/gallery",
  "/governance",
  "/initiatives",
  "/legal",
  "/policies",
  "/privacy",
  "/learn",
  "/support",
  "/terms",
  "/transparency",
  "/offline",
]);

const MARKETING_PREFIXES = [
  "/blog/",
  "/events/",
  "/gallery/",
  "/initiatives/",
  "/legal/",
  "/policies/",
  "/docs/",
  "/explore/",
  "/p/",
  "/verify/",
  "/widget/",
  "/projects/",
];

const APP_PREFIXES = [
  "/dashboard/",
  "/portal/",
  "/p/",
  "/teams/",
  "/orgs/",
  "/api/",
];

const SHARED_PREFIXES = [
  "/auth/",
  "/_next/",
  "/api/",
];

function isMarketingHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "butwalhacks.com" ||
    hostname === "www.butwalhacks.com"
  );
}

function isAppHost(hostname: string): boolean {
  return (
    hostname === "app.localhost" ||
    hostname === "app.butwalhacks.com"
  );
}

function isCalendarHost(hostname: string): boolean {
  return (
    hostname === "calendar.localhost" ||
    hostname === "calendar.butwalhacks.com"
  );
}

function isRouteInSet(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p));
}

function isExactRouteMatch(pathname: string, routeSet: Set<string>): boolean {
  return routeSet.has(pathname);
}

/**
 * Forward `headers` to the render as request headers on a pass-through
 * response (`next()` or `rewrite()`), whichever helper created it.
 *
 * `NextResponse.next({ request: { headers } })` does this by listing every
 * forwarded header in `x-middleware-override-headers` and carrying each value
 * in `x-middleware-request-<name>`. The helpers and `auth0.middleware` build
 * their own responses, so the same encoding is applied here after the fact.
 * If a helper already overrode request headers, its list is extended rather
 * than replaced.
 */
function forwardRequestHeaders(
  request: NextRequest,
  response: NextResponse,
  headers: Record<string, string>,
): void {
  const isPassThrough =
    response.headers.has("x-middleware-next") || response.headers.has("x-middleware-rewrite");
  if (!isPassThrough) return;

  const existing = response.headers.get("x-middleware-override-headers");
  const keys = existing ? existing.split(",") : [];
  if (!existing) {
    request.headers.forEach((value, key) => {
      keys.push(key);
      response.headers.set(`x-middleware-request-${key}`, value);
    });
  }
  for (const [key, value] of Object.entries(headers)) {
    if (!keys.includes(key)) keys.push(key);
    response.headers.set(`x-middleware-request-${key}`, value);
  }
  response.headers.set("x-middleware-override-headers", keys.join(","));
}

/**
 * Dynamically rendered routes (dashboard, portal, claim — see
 * `NONCE_ROUTE_PREFIXES`) get a fresh nonce and the nonce CSP, which has no
 * 'unsafe-inline'. Next.js reads the nonce from the request's CSP header
 * during render; the same policy replaces next.config's static one on the
 * response. Every other route keeps the static policy so it stays CDN-cached.
 *
 * Wrapping the router (rather than each branch) means no exit path —
 * helpers, auth0.middleware, rewrites, local dev — can skip it.
 */
export default async function proxy(request: NextRequest) {
  const response = await route(request);
  if (!usesNonceCsp(request.nextUrl.pathname)) return response;

  const nonce = generateNonce();
  const csp = buildNonceCsp(nonce);
  forwardRequestHeaders(request, response, {
    "x-nonce": nonce,
    "content-security-policy": csp,
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

async function route(request: NextRequest): Promise<NextResponse> {
  const { hostname, pathname } = request.nextUrl;

  if (hostname === "localhost" || hostname === "app.localhost" || hostname === "127.0.0.1") {
    return handleLocalDev(request);
  }

  // Edge-level redirect avoids rendering the sign-in page (and its
  // meta-refresh fallback) which fails the axe meta-refresh accessibility audit.
  if (pathname === "/sign-in") {
    return redirectSignIn(request);
  }

  if (isRouteInSet(pathname, SHARED_PREFIXES)) {
    if (pathname.startsWith("/auth/")) {
      return runAuthMiddleware(request);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal/")) {
    if (!isAppHost(hostname)) {
      return redirectToDomain(request, "app");
    }
    return requireRole(request, pathname, [...PORTAL_ROLES]);
  }

  if (isCalendarHost(hostname)) {
    if (pathname.startsWith("/_next/") || pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    return requireAnyAuth(request, pathname);
  }

  if (isAppHost(hostname)) {
    if (pathname === "/dashboard" || isRouteInSet(pathname, APP_PREFIXES)) {
      if (pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname.startsWith("/portal/")) {
        return requireRoleByPath(request, pathname);
      }

      if (pathname.startsWith("/orgs/")) {
        return requireAnyAuth(request, pathname);
      }
      return NextResponse.next();
    }

    if (isExactRouteMatch(pathname, MARKETING_ROUTES) || isRouteInSet(pathname, MARKETING_PREFIXES)) {
      return redirectToDomain(request, "main");
    }

    return NextResponse.next();
  }

  if (isMarketingHost(hostname)) {
    if (isExactRouteMatch(pathname, MARKETING_ROUTES) || isRouteInSet(pathname, MARKETING_PREFIXES)) {
      if (pathname.startsWith("/auth/")) {
        return auth0.middleware(request);
      }
      return NextResponse.next();
    }

    if (pathname === "/dashboard" || isRouteInSet(pathname, APP_PREFIXES)) {
      return redirectToDomain(request, "app");
    }

    return NextResponse.next();
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const subdomain = parts[0];

    const SUBDOMAIN_MAP: Record<string, string> = {
      pokhara: "pokhara",
      kathmandu: "kathmandu",
      chitwan: "chitwan",
    };

    const slug = SUBDOMAIN_MAP[subdomain];

    if (slug) {
      if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
        return NextResponse.next();
      }

      const url = request.nextUrl.clone();
      url.pathname = pathname === "/"
        ? `/orgs/${slug}/dashboard`
        : `/orgs/${slug}${pathname}`;

      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api/|trpc/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
