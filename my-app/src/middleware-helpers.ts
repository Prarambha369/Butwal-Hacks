import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";

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
      return NextResponse.next();
    }

    const userRole = profile.role as string;

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard/hacker", request.url));
    }

    return NextResponse.next();
  } catch {
    logger.warn("[proxy] Role query failed", { auth0_user_id: session.user.sub });
    return NextResponse.next();
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
  if (pathname.startsWith("/portal/")) {
    return requireRole(request, pathname, ["sponsor", "recruiter", "organizer", "maintainer"]);
  }
  if (pathname.startsWith("/dashboard/sponsor-onboarding")) {
    return requireRole(request, pathname, ["sponsor", "maintainer"]);
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
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
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

  if (pathname.startsWith("/auth/")) {
    return await runAuthMiddleware(request);
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return requireRoleByPath(request, pathname);
  }

  if (pathname.startsWith("/portal/")) {
    return requireRole(request, pathname, ["sponsor", "recruiter", "organizer", "maintainer"]);
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
