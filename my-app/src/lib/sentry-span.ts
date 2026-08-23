/**
 * Sentry performance span wrapper for API routes.
 *
 * Wraps route handlers with Sentry transaction/span tracking so every API
 * call is measured in the Sentry performance dashboard. Captures:
 *   - Route name and HTTP method
 *   - Duration and status code
 *   - External downstream calls (already instrumented by httpIntegration)
 *
 * Usage:
 *   import { withSentrySpan } from "@/lib/sentry-span";
 *
 *   export const GET = withSentrySpan("GET /api/events", async () => { ... });
 *   export const POST = withSentrySpan("POST /api/auth/link/initiate", withRateLimit(async (req) => { ... }, "sensitive"));
 *
 * The wrapper is lightweight — when Sentry is not configured (no DSN),
 * it simply passes through to the handler with zero overhead.
 */

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

const isSentryConfigured = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Wrap an API route handler with Sentry performance tracking.
 *
 * @param name - Human-readable route name (e.g., "GET /api/events")
 * @param handler - The route handler function
 * @returns A wrapped handler that creates a Sentry span around each invocation
 */
export function withSentrySpan<T extends (...args: any[]) => Promise<NextResponse>>(
  name: string,
  handler: T,
): T {
  if (!isSentryConfigured) {
    // No-op passthrough when Sentry isn't configured — zero overhead
    return handler;
  }

  return (async (request: Request, ...rest: unknown[]) => {
    try {
      // Start a Sentry transaction for this route
      return await Sentry.startSpan(
        {
          op: "api.route",
          name,
          attributes: {
            "http.method": request.method,
            "http.url": request.url.slice(0, 200),
            "route.name": name,
          },
        },
        async (span) => {
          const start = performance.now();
          const response = await handler(request, ...rest);
          const durationMs = performance.now() - start;

          // Set status and duration on the span
          span.setAttribute("http.status_code", response.status);
          span.setAttribute("duration_ms", Math.round(durationMs));

          // If the response is an error, tag the span
          if (response.status >= 400) {
            span.setAttribute("error", true);
          }

          return response;
        },
      );
    } catch (err) {
      // Capture exceptions that escape the handler (shouldn't happen with
      // well-formed routes, but catches uncaught throws)
      Sentry.captureException(err, {
        tags: { route: name, method: request.method },
      });
      throw err;
    }
  }) as T;
}
