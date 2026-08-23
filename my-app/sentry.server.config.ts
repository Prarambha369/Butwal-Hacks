/**
 * sentry.server.config.ts — Server-side Sentry initialization.
 *
 * Captures unhandled exceptions and errors in API routes, server components,
 * and server actions. Reports them to the Sentry project dashboard.
 *
 * Performance monitoring:
 *   - Automatic HTTP client instrumentation (fetch, NextResponse, etc.)
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
