/**
 * sentry.edge.config.ts — Edge Runtime Sentry initialization.
 *
 * Captures errors in Next.js Edge Runtime (middleware, edge API routes).
 *
 * This file is automatically loaded by @sentry/nextjs at build time.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 0.0,

  environment: process.env.NODE_ENV ?? "development",
});
