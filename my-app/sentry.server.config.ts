/**
 * sentry.server.config.ts — Server-side Sentry initialization.
 *
 * Captures unhandled exceptions and errors in the proxy, API routes,
 * server components, and server actions. Reports them to the Sentry
 * project dashboard.
 *
 * This is the only Sentry runtime config: the app has no Edge routes, and
 * the proxy runs on Node, so there is nothing left for sentry.edge.config.ts
 * to instrument.
 *
 * Performance monitoring:
 *   - Automatic HTTP client instrumentation (fetch, NextResponse, etc.),
 *     which now also covers the proxy's Supabase and Auth0 calls
 *   - Manual API route spans via withSentrySpan() wrapper
 *   - Vercel Cron Monitor integration for /api/health
 *
 * This file is automatically loaded by @sentry/nextjs at build time.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Performance tracing for server-side operations
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 0.0,

  // Instrument outgoing HTTP requests (fetch, etc.) for downstream span visibility.
  // Captures calls to Supabase, Groq, Cloudinary, Auth0, GitHub, Resend, etc.
  integrations: [
    Sentry.httpIntegration(),
  ],

  environment: process.env.NODE_ENV ?? "development",
});
