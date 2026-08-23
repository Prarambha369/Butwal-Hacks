/**
 * sentry.client.config.ts — Browser-side Sentry initialization.
 *
 * Sentry captures unhandled exceptions, promise rejections, and console
 * errors in the browser and reports them to the project dashboard.
 *
 * This file is automatically loaded by @sentry/nextjs at build time.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";
import { replayIntegration } from "@sentry/browser";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Performance monitoring (automatic instrumentation via browserTracingIntegration)
  integrations: [
    Sentry.browserTracingIntegration(),
    replayIntegration({
      // Lower sampling for privacy — captures enough for debugging without
      // recording full user sessions in a community setting.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Performance monitoring sampling rate
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 0.0,

  // Session replay sampling rate
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 1.0,

  // Don't send PII in production
  environment: process.env.NODE_ENV ?? "development",
});
