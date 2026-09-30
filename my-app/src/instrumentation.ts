import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook.
 *
 * @sentry/nextjs auto-injects `sentry.client.config.ts` at build time, but it
 * does NOT load the server config — that is this file's job. Without it
 * `Sentry.captureException()` is a no-op on the server and `httpIntegration`
 * never instruments outgoing requests.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
}

/**
 * Routes server errors captured by Next.js (server component render errors,
 * server action failures) to Sentry.
 *
 * `withSentryConfig` is a build-time webpack/Turbopack wrapper and does not
 * provide this runtime hook, so it must be exported here.
 */
export const onRequestError = Sentry.captureRequestError;
