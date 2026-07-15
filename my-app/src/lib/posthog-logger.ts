/**
 * posthog-logger — Standalone structured logging helper
 *
 * ponytail: Previously wrapped an OTel logger from instrumentation.ts.
 * instrumentation.ts removed (YAGNI — OTel pipeline was dead config).
 * The posthogLog.info/warn/error calls remain as structured log stubs
 * that can be wired to any backend later (PostHog, Axiom, console, etc.).
 */

function emit(level: string, body: string, attributes?: Record<string, unknown>) {
  // ponytail: Log to console for now. Swap in a real transport later.
  // To enable, set LOGGER_BACKEND=axiom|posthog in env and add the
  // corresponding SDK + transport here.
  if (process.env.NODE_ENV === "development") {
    const prefix = `[posthogLog:${level}]`;
    if (level === "ERROR") {
      console.error(prefix, body, attributes ?? "");
    } else if (level === "WARN") {
      console.warn(prefix, body, attributes ?? "");
    } else {
      console.log(prefix, body, attributes ?? "");
    }
  }
}

export const posthogLog = {
  info: (body: string, attributes?: Record<string, unknown>) => {
    emit("INFO", body, attributes);
  },

  warn: (body: string, attributes?: Record<string, unknown>) => {
    emit("WARN", body, attributes);
  },

  error: (body: string, attributes?: Record<string, unknown>) => {
    emit("ERROR", body, attributes);
  },
};
