import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Proxy middleware — runs on every eligible request.
 *
 * Auth0 v4 mounts auth routes (/auth/login, /auth/callback, /auth/logout)
 * automatically via the middleware layer. No separate route handler needed.
 */
export async function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // ── Step 1: Auth0 auth handling ──────────────────────────
  // Auth0 SDK v4 mounts auth routes at /auth/* via middleware.
  // Apply for main domain only. Subdomains use main domain auth.
  const isMainDomain =
    hostname === "localhost" ||
    hostname === "butwalhacks.com" ||
    hostname === "www.butwalhacks.com";

  if (isMainDomain && pathname.startsWith("/auth/")) {
    return auth0.middleware(request);
  }

  // ── Step 2: White-label subdomain routing ─────────────────
  const parts = hostname.split(".");
  if (parts.length < 3) return NextResponse.next();

  const subdomain = parts[0];

  const SUBDOMAIN_MAP: Record<string, string> = {
    pokhara: "pokhara",
    kathmandu: "kathmandu",
    chitwan: "chitwan",
  };

  const slug = SUBDOMAIN_MAP[subdomain];

  if (!slug) return NextResponse.next();

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
