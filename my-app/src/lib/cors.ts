import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS for the handful of app routes the static marketing site calls from the
 * browser (docs/CLOUDFLARE.md). The marketing pages are served from
 * www.butwalhacks.com on Cloudflare Pages; the app stays on app.butwalhacks.com.
 *
 * Exact-origin allowlist only, never a wildcard with credentials. The session
 * cookie is shared across butwalhacks.com subdomains, so an allowlisted
 * origin may send it (`Access-Control-Allow-Credentials: true`). Any other
 * origin gets no CORS headers and the browser blocks the read, exactly as
 * before this module existed.
 *
 * CORS_EXTRA_ORIGINS (comma-separated) adds origins such as a pages.dev
 * preview of the static site. It is a server env var, never exposed.
 */
const MARKETING_ORIGINS = ["https://butwalhacks.com", "https://www.butwalhacks.com"];

export function allowedOrigins(): string[] {
  const extra = (process.env.CORS_EXTRA_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter((o) => /^https:\/\/[a-z0-9.-]+$/i.test(o));
  return [...MARKETING_ORIGINS, ...extra];
}

/** CORS response headers for `origin`, or null when it is not allowed. */
export function corsHeaders(origin: string | null): Record<string, string> | null {
  if (!origin || !allowedOrigins().includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
  };
}

/** Adds `Vary: Origin` and, for an allowed origin, the CORS headers. */
export function applyCors(request: Request, response: Response): Response {
  response.headers.append("Vary", "Origin");
  const headers = corsHeaders(request.headers.get("origin"));
  if (headers) for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}

/**
 * Wraps a route handler so its responses (including 429s and errors from
 * inner wrappers) carry CORS headers for allowlisted origins. Outermost.
 */
// ponytail: `any[]` rest args mirror withRateLimit's handler shape, so the
// wrappers compose in either order without restating each route's params.
export function withCors<
  T extends (request: NextRequest, ...rest: any[]) => Promise<NextResponse>
>(handler: T): T {
  return (async (request: NextRequest, ...rest: any[]) => {
    const response = await handler(request, ...rest);
    applyCors(request, response);
    return response;
  }) as T;
}

/** `export const OPTIONS = corsPreflight` on a CORS-enabled route. */
export async function corsPreflight(request: NextRequest): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 204 });
  applyCors(request, response);
  return response;
}

/**
 * For public, uncredentialed, cacheable data (e.g. /api/metrics): any origin
 * may read it, and the request is never inspected, so the route stays static.
 */
export function withPublicCors<T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T {
  return (async (...args: any[]) => {
    const response = await handler(...args);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }) as T;
}
