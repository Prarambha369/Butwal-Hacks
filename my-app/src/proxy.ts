import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

// ─── Zone 1: Marketing Routes (butwalhacks.com) ──────────────────────────
// Public-facing pages for visitors, SEO, and content discovery.
const MARKETING_ROUTES = new Set([
  "/",
  "/about",
  "/blog",
  "/chapters",
  "/community",
  "/contact",
  "/cookie-policy",
  "/docs",
  "/donors",
  "/events",
  "/explore",
  "/faq",
  "/gallery",
  "/governance",
  "/initiatives",
  "/legal",
  "/opportunities",
  "/philosophy",
  "/privacy",
  "/programs",
  "/resources",
  "/support",
  "/terms",
  "/transparency",
  "/offline",
]);

// Prefixes that match marketing routes with sub-paths (e.g., /blog/[slug])
const MARKETING_PREFIXES = [
  "/blog/",
  "/events/",
  "/initiatives/",
  "/programs/",
  "/legal/",
  "/docs/",
  "/explore/",
  "/p/",
  "/verify/",
  "/widget/",
  "/projects/",
];

// ─── Zones 2-9: App Routes (app.butwalhacks.com) ────────────────────────
// Interactive, authenticated, and API-driven pages.
const APP_PREFIXES = [
  "/dashboard/",
  "/portal/",
  "/profile/",
  "/teams/",
  "/orgs/",
  "/api/",
];

// ─── Both: Routes accessible on either domain ─────────────────────────
const SHARED_PREFIXES = [
  "/auth/",
  "/_next/",
];

// ─── Host detection helpers ───────────────────────────────────────────
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

function isRouteInSet(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p));
}

function isExactRouteMatch(pathname: string, routeSet: Set<string>): boolean {
  return routeSet.has(pathname);
}

/**
 * Proxy middleware — runs on every eligible request.
 *
 * Auth0 v4 mounts auth routes (/auth/login, /auth/callback, /auth/logout)
 * automatically via the middleware layer. No separate route handler needed.
 *
 * Subdomain routing (9-Zone Architecture):
 *   butwalhacks.com      → Zone 1 (Public Marketing)
 *   app.butwalhacks.com  → Zones 2-9 (Dashboards, Profiles, APIs)
 *
 * Users landing on the wrong subdomain get redirected to the correct one.
 * Shared routes (auth, static files) work on both domains.
 */
export async function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // ── Local dev: skip subdomain enforcement ─────────────────
  // On localhost, all routes are accessible from one origin.
  // app.localhost is also treated as local dev for subdomain testing.
  if (hostname === "localhost" || hostname === "app.localhost" || hostname === "127.0.0.1") {
    return handleLocalDev(request);
  }

  // ── Step 1: Shared routes (auth, static files) ← pass through on either domain ──
  if (isRouteInSet(pathname, SHARED_PREFIXES)) {
    // Auth0 middleware handles auth routes
    if (pathname.startsWith("/auth/")) {
      return auth0.middleware(request);
    }
    return NextResponse.next();
  }

  // ── Step 2: Protect /portal/* routes (Sponsor/Recruiter access) ────
  // Requires authentication + app subdomain
  if (pathname.startsWith("/portal/")) {
    if (!isAppHost(hostname)) {
      return redirectToDomain(request, "app");
    }
    return requireRole(request, pathname, ["sponsor", "recruiter", "organizer", "maintainer"]);
  }

  // ── Step 3: App domain routing ─────────────────────────────
  if (isAppHost(hostname)) {
    // Routes explicitly allowed on app domain
    if (isRouteInSet(pathname, APP_PREFIXES)) {
      // Protect dashboard routes with role-based access
      if (pathname.startsWith("/dashboard/") || pathname.startsWith("/portal/")) {
        return requireRoleByPath(request, pathname);
      }

      // Protect /orgs/* routes (require any authenticated user)
      if (pathname.startsWith("/orgs/")) {
        return requireAnyAuth(request, pathname);
      }
      return NextResponse.next();
    }

    // Check if this is a marketing route hitting the app domain → redirect to main
    if (isExactRouteMatch(pathname, MARKETING_ROUTES) || isRouteInSet(pathname, MARKETING_PREFIXES)) {
      return redirectToDomain(request, "main");
    }

    // Fallback: pass through (handles unknown routes gracefully)
    return NextResponse.next();
  }

  // ── Step 4: Marketing domain routing ───────────────────────
  if (isMarketingHost(hostname)) {
    // Routes explicitly allowed on marketing domain
    if (isExactRouteMatch(pathname, MARKETING_ROUTES) || isRouteInSet(pathname, MARKETING_PREFIXES)) {
      // Auth0 for sign-in/sign-up on main domain
      if (pathname.startsWith("/auth/")) {
        return auth0.middleware(request);
      }
      return NextResponse.next();
    }

    // Check if this is an app route hitting the marketing domain → redirect to app
    if (isRouteInSet(pathname, APP_PREFIXES)) {
      return redirectToDomain(request, "app");
    }

    // Fallback: pass through
    return NextResponse.next();
  }

  // ── Step 5: White-label chapter subdomain routing ──────────
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
      // Passthrough for API and auth
      if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
        return NextResponse.next();
      }

      // Rewrite chapter subdomain to org route
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/"
        ? `/orgs/${slug}/dashboard`
        : `/orgs/${slug}${pathname}`;

      return NextResponse.rewrite(url);
    }
  }

  // ── Step 6: Catch-all — pass through for everything else ──
  return NextResponse.next();
}

// ─── RBAC helpers ───────────────────────────────────────────────────────

/**
 * Check Auth0 session and verify the user has one of the allowed roles.
 * Queries Supabase profiles table for the user's role.
 */
export async function requireRole(
  request: NextRequest,
  pathname: string,
  allowedRoles: string[]
): Promise<NextResponse> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth0_user_id", session.user.sub)
      .single();

    if (!profile) {
      // No profile yet — let the request through so the dashboard layout
      // can create one. Don't default to "hacker" which would cause a
      // redirect loop for newly-signed-up maintainers.
      return NextResponse.next();
    }

    const userRole = profile.role as string;

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard/hacker", request.url));
    }

    return NextResponse.next();
  } catch {
    // If Supabase query fails, let the request through — the server-side
    // dashboard layouts have role guards as a secondary layer of defense.
    console.warn("[proxy] Role query failed for", session.user.sub);
    return NextResponse.next();
  }
}

/** Route-specific role requirements for dashboard paths. */
export async function requireRoleByPath(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
  if (pathname.startsWith("/dashboard/maintainer")) {
    return requireRole(request, pathname, ["maintainer"]);
  }
  if (pathname.startsWith("/dashboard/organizer")) {
    return requireRole(request, pathname, ["organizer", "maintainer"]);
  }
  if (pathname.startsWith("/portal/")) {
    return requireRole(request, pathname, ["sponsor", "recruiter", "organizer", "maintainer"]);
  }
  // /dashboard/hacker and /dashboard/* — require any authenticated user
  if (pathname.startsWith("/dashboard/")) {
    return requireAnyAuth(request, pathname);
  }
  return NextResponse.next();
}

/**
 * Require any authenticated user (no role restriction).
 * Redirects to /auth/login if no valid session exists.
 */
export async function requireAnyAuth(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

// ─── Redirect helper ────────────────────────────────────────────────────

/** Redirect the request to the marketing or app domain. */
export function redirectToDomain(request: NextRequest, target: "main" | "app"): NextResponse {
  const { pathname, search, protocol } = request.nextUrl;

  const targetHost =
    target === "app"
      ? "app.butwalhacks.com"
      : "butwalhacks.com";

  const url = `${protocol}//${targetHost}${pathname}${search}`;
  return NextResponse.redirect(new URL(url), 308);
}

// ─── Local dev handler ──────────────────────────────────────────────────

/** In local development, let all routes pass through without subdomain enforcement. */
export async function handleLocalDev(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Auth0 middleware for auth routes
  if (pathname.startsWith("/auth/")) {
    return await auth0.middleware(request);
  }

  // Protect dashboard routes with role-based access (even in dev)
  if (pathname.startsWith("/dashboard/")) {
    return requireRoleByPath(request, pathname);
  }

  // Protect /portal/* routes (requires auth in dev too)
  if (pathname.startsWith("/portal/")) {
    return requireRole(request, pathname, ["sponsor", "recruiter", "organizer", "maintainer"]);
  }

  // Protect /orgs/* routes (requires any authenticated user in dev too)
  if (pathname.startsWith("/orgs/")) {
    return requireAnyAuth(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
