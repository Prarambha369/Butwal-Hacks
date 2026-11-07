import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import { PORTAL_ROLES } from "@/lib/dashboard-access";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass";

function isCalendarHost(hostname: string): boolean {
  return (
    hostname === "calendar.localhost" ||
    hostname === "calendar.butwalhacks.com"
  );
}

export async function requireRole(
  request: NextRequest,
  pathname: string,
  allowedRoles: string[]
): Promise<NextResponse> {
  // Opt-in only. A blanket `NODE_ENV !== "production"` check turned this gate
  // off for `next dev`, which is what Playwright runs, so the RBAC specs
  // stopped seeing redirects. See lib/dev-auth-bypass.ts.
  if (isDevAuthBypassEnabled()) {
    return NextResponse.next();
  }
  // Middleware must pass the request. The no-arg overload reads cookies via
  // the App Router `headers()` dynamic API, which has no request scope here
  // and throws "headers was called outside a request scope" -> 500.
  const session = await auth0.getSession(request);
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
        // No profile row means the user has no role to check, so it cannot
        // satisfy `allowedRoles`. Letting them through would grant access to a
        // gated page they have no claim to. Fail closed.
        //
        // Redirecting rather than blocking keeps the bootstrap intact: the
        // parent dashboard/layout.tsx still runs on /dashboard/hacker and
        // creates the row with initialRole "hacker", which is exactly the
        // path a new user needs. /dashboard/hacker is routed through
        // requireAnyAuth (no role check), so this cannot loop.
        return NextResponse.redirect(new URL("/dashboard/hacker", request.url));
      }

    const userRole = profile.role as string;

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard/hacker", request.url));
    }

    return NextResponse.next();
  } catch {
    // Fail closed. The role query IS the authorization decision for these
    // routes, so an unreachable database cannot be read as "no restriction
    // applies" -- that opened /dashboard/maintainer/*, /dashboard/organizer/*
    // and /portal/* for the duration of any Supabase incident. The layout is a
    // second gate and already fails closed, so this is defence-in-depth rather
    // than the only control, but the middleware should not be the layer that
    // waves the request through.
    logger.error("[proxy] Role query failed; denying rather than allowing", {
      path: pathname,
      auth0_user_id: session.user.sub,
    });
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

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
  // Sponsors reach the portal to see the projects and people behind events they
  // sponsored. Organizers do not -- they run events from /dashboard/organizer.
  // Listing organizer here only made a dead end: middleware waved them through
  // and portal/layout.tsx bounced them, so nobody could use the section. The
  // list is PORTAL_ROLES from dashboard-access.ts, the same source the portal
  // layout imports, so the two gates cannot drift apart again.
  if (pathname.startsWith("/portal/")) {
    return requireRole(request, pathname, [...PORTAL_ROLES]);
  }
  if (pathname.startsWith("/dashboard/sponsor-onboarding")) {
    return requireRole(request, pathname, [...PORTAL_ROLES]);
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return requireAnyAuth(request, pathname);
  }
  return NextResponse.next();
}

export async function requireAnyAuth(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
  // See requireRole: opt-in only, never implied by NODE_ENV alone.
  if (isDevAuthBypassEnabled()) {
    return NextResponse.next();
  }
  // See requireRole: middleware needs the request-scoped overload.
  const session = await auth0.getSession(request);
  if (!session?.user?.sub) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

/**
 * Proxy-level redirect for /sign-in → /auth/login.
 * Handles this at the edge (HTTP redirect) so the sign-in page never renders
 * a <meta http-equiv="refresh"> fallback, which fails axe's meta-refresh rule.
 * Mirrors the logic in app/(auth)/sign-in/page.tsx.
 */
export function redirectSignIn(request: NextRequest): NextResponse {
  const mode = request.nextUrl.searchParams.get("mode");
  const returnTo = request.nextUrl.searchParams.get("returnTo");
  const qs = new URLSearchParams();
  if (mode === "signup") qs.set("screen_hint", "signup");
  qs.set("returnTo", returnTo || "/dashboard/onboarding");
  const url = new URL(`/auth/login?${qs.toString()}`, request.url);
  return NextResponse.redirect(url);
}

export function redirectToDomain(request: NextRequest, target: "main" | "app"): NextResponse {
  const { pathname, search, protocol } = request.nextUrl;

  const targetHost =
    target === "app"
      ? "app.butwalhacks.com"
      : "butwalhacks.com";

  const url = `${protocol}//${targetHost}${pathname}${search}`;
  return NextResponse.redirect(new URL(url), 308);
}

export async function handleLocalDev(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  if (pathname === "/sign-in") {
    return redirectSignIn(request);
  }

  if (pathname.startsWith("/auth/")) {
    return await runAuthMiddleware(request);
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return requireRoleByPath(request, pathname);
  }

  if (pathname.startsWith("/portal/")) {
    return requireRole(request, pathname, [...PORTAL_ROLES]);
  }

  if (pathname.startsWith("/orgs/")) {
    return requireAnyAuth(request, pathname);
  }

  if (isCalendarHost(hostname)) {
    if (pathname.startsWith("/_next/")) {
      return NextResponse.next();
    }
    return requireAnyAuth(request, pathname);
  }

  return NextResponse.next();
}

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

export async function runAuthMiddleware(request: NextRequest): Promise<NextResponse> {
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
