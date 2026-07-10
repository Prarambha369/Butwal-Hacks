import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Proxy middleware — runs on every eligible request.
 *
 * Responsibilities (in order):
 * 1. Auth0 session handling (login, callback, logout)
 * 2. White-label subdomain routing for chapters
 *
 * ponytail: Auth0 middleware first, then subdomain rewrite.
 * API routes on subdomains pass through without rewrites.
 */
export async function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // ── Step 1: Auth0 middleware ──────────────────────────────
  // Apply auth0 middleware for localhost and main domain only.
  // Subdomains skip auth0 middleware — auth is handled on the main domain.
  const isMainDomain =
    hostname === "localhost" ||
    hostname === "butwalhacks.com" ||
    hostname === "www.butwalhacks.com";

  if (isMainDomain) {
    return auth0.middleware(request);
  }

  // ── Step 2: White-label subdomain routing ─────────────────
  // Extract subdomain (e.g., "pokhara" from "pokhara.butwalhacks.com")
  const parts = hostname.split(".");
  if (parts.length < 3) return NextResponse.next();

  const subdomain = parts[0];

  // ponytail: static map of subdomains → chapter slugs.
  // Source of truth is the chapters table; this is a fast-path cache.
  const SUBDOMAIN_MAP: Record<string, string> = {
    pokhara: "pokhara",
    kathmandu: "kathmandu",
    chitwan: "chitwan",
  };

  const slug = SUBDOMAIN_MAP[subdomain];

  // Unknown subdomain — pass through
  if (!slug) return NextResponse.next();

  // Don't rewrite API routes and auth callbacks on subdomains
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/"
    ? `/orgs/${slug}/dashboard`
    : `/orgs/${slug}${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
