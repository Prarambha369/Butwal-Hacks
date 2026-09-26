import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";

// ─── Zone 1: Marketing Routes (butwalhacks.com) ──────────────────────────
// Public-facing pages for visitors, SEO, and content discovery.
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

// Prefixes that match marketing routes with sub-paths (e.g., /blog/[slug])
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

// ─── Zones 2-9: App Routes (app.butwalhacks.com) ────────────────────────
// Interactive, authenticated, and API-driven pages.
const APP_PREFIXES = [
  "/dashboard/",
  "/portal/",
  "/p/",
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
/**
 * Whether a hostname serves the public marketing site.
 * These paths stay indexable and unauthenticated.
 */
function isMarketingHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "butwalhacks.com" ||
    hostname === "www.butwalhacks.com"
  );
}

/** Whether a hostname serves the authenticated app (dashboards, profiles, APIs). */
function isAppHost(hostname: string): boolean {
  return (
    hostname === "app.localhost" ||
    hostname === "app.butwalhacks.com"
  );
}

/**
 * The calendar subdomain.
 *
 * Without an explicit rule this host matched neither isMarketingHost nor
 * isAppHost and fell through to the final `NextResponse.next()`, serving
 * every path on the subdomain with no authentication at all. Naming it here
 * means the whole host requires a signed-in user.
 */
function isCalendarHost(hostname: string): boolean {
  return (
    hostname === "calendar.localhost" ||
    hostname === "calendar.butwalhacks.com"
  );
}

/**
 * Match a pathname against a list of prefixes, boundary-safe.
 *
 * Compares the full path and then a trailing-slash prefix, so "/dashboard"
 * does not match "/dashboard/" while "/dashboard/hacker" does. Exact roots
 * must be listed without a trailing slash (see the bare "/dashboard"
 * checks in `proxy`).
 */
function isRouteInSet(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p));
}

/** Match a pathname against a set of exact routes, with no prefix semantics. */
function isExactRouteMatch(pathname: string, routeSet: Set<string>): boolean {
  return routeSet.has(pathname);
}

/**
 * Whether an Auth0 middleware failure is a missing-configuration error.
 *
 * The SDK wraps the root cause: `auth0.middleware()` throws
 * `DomainResolutionError { code: "domain_resolution_error" }` whose
 * `cause` is `InvalidConfigurationError { code: "invalid_configuration" }`.
 * Walk the whole cause chain so the wrapper never masks the signature.
 * Anything else (e.g. failed login callbacks) must propagate untouched.
 */
function isAuthConfigError(err: unknown): boolean {
  const seen = new Set<unknown>();
  let cur: unknown = err;
  while (cur && (typeof cur === "object" || typeof cur === "function") && !seen.has(cur)) {
    seen.add(cur);
    const code = (cur as { code?: unknown }).code;
    const message = cur instanceof Error ? cur.message : String(cur);
    if (
      code === "invalid_configuration" ||
      /Set AUTH0_.* env var|Missing: .*env var|InvalidConfiguration/i.test(message)
    ) {
      return true;
    }
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Run the Auth0 middleware, degrading gracefully when Auth0 is not
 * configured (missing env vars). Instead of a 500 on every /auth/* route,
 * visitors are sent to /sign-in with an explanatory flag. Non-config
 * errors (e.g. failed login callbacks) are rethrown to preserve SDK behavior.
 */
async function runAuthMiddleware(request: NextRequest): Promise<NextResponse> {
  try {
    return await auth0.middleware(request);
  } catch (err) {
    if (!isAuthConfigError(err)) throw err;
    logger.warn("[proxy] Auth0 misconfigured, redirecting to sign-in");
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("error", "auth_unavailable");
    return NextResponse.redirect(url);
  }
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
      return runAuthMiddleware(request);
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

  // ── Step 2b: Calendar subdomain ─────────────────────────────────
  // Google Calendar sync is per-user and every route under it touches that
  // user's credentials, so the entire host is authenticated. Checked before
  // the app-host block because calendar.* is not an app host.
  if (isCalendarHost(hostname)) {
    if (pathname.startsWith("/_next/") || pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }
    return requireAnyAuth(request, pathname);
  }

  // ── Step 3: App domain routing ─────────────────────────────
  if (isAppHost(hostname)) {
    // Routes explicitly allowed on app domain
    // (bare /dashboard needs an exact match — APP_PREFIXES only holds "/dashboard/")
    if (pathname === "/dashboard" || isRouteInSet(pathname, APP_PREFIXES)) {
      // Protect dashboard routes with role-based access
      // (bare /dashboard included — it renders the hub, not a redirect)
      if (pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname.startsWith("/portal/")) {
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
    // (bare /dashboard included — it lives on the app subdomain)
    if (pathname === "/dashboard" || isRouteInSet(pathname, APP_PREFIXES)) {
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
    logger.warn("[proxy] Role query failed", { auth0_user_id: session.user.sub });
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
  // Sponsor funnel interstitial — allow sponsors + maintainers.
  if (pathname.startsWith("/dashboard/sponsor-onboarding")) {
    return requireRole(request, pathname, ["sponsor", "maintainer"]);
  }
  // /dashboard/hacker and /dashboard/* — require any authenticated user
  // (bare /dashboard hub included)
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
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
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  // Auth0 middleware for auth routes
  if (pathname.startsWith("/auth/")) {
    return await runAuthMiddleware(request);
  }

  // Protect dashboard routes with role-based access (even in dev)
  // (bare /dashboard included — it renders the hub, not a redirect)
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
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

  // calendar.localhost: require auth for everything except Next internals,
  // mirroring the production calendar-host rule.
  if (isCalendarHost(hostname)) {
    if (pathname.startsWith("/_next/")) {
      return NextResponse.next();
    }
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
