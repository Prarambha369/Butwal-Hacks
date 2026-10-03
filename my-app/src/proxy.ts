import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  handleLocalDev,
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
  "/initiatives/",
  "/legal/",
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

export default async function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  if (hostname === "localhost" || hostname === "app.localhost" || hostname === "127.0.0.1") {
    return handleLocalDev(request);
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
    return requireRole(request, pathname, ["sponsor", "maintainer"]);
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
