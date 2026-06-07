/**
 * Instrumentation — No-op placeholder
 *
 * The OTel-based PostHog logger was removed (YAGNI per ponytail audit).
 * If a real instrumentation hook (Sentry, OpenTelemetry, DataDog, etc.)
 * is needed later, add it here.
 *
 * ponytail: Next.js loads this file automatically when present.
 * An empty export is the cleanest no-op — no imports, no runtime cost.
 */
export function register() {
  // Intentionally empty — see comment above.
}
