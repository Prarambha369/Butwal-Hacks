/**
 * logger.ts -- structured logging for Butwal Hacks.
 *
 * Always logs to the console (so Vercel function logs stay useful), and
 * additionally reports `error`-level entries to Sentry. Handled errors used to
 * be console-only, which meant real failures (Auth0 400s, PostgREST errors)
 * were invisible outside the deploying developer's terminal.
 *
 * Full-stack traceability:
 *   Use logger.withErrorId(bhErrorId) in request handlers to thread a unique
 *   error ID through all server-side log entries, matching the client-side
 *   error report from error.tsx. The ID is attached to the Sentry event as a
 *   searchable tag. Example:
 *
 *     const log = logger.withErrorId("BH-ERR-a1b2c3-d4e5");
 *     log.error("[api/route]", err);
 *
 * Usage:
 *   logger.error("[api/route]", err)       // Error level -> console + Sentry
 *   logger.warn("[api/route]", { key })    // Warning level -> console
 *   logger.info("User action", { userId }) // Info level -> console
 */

import * as Sentry from "@sentry/nextjs";

type Level = "error" | "warn" | "info";

/**
 * Split logger arguments into the first `Error` (handed to Sentry, which
 * needs the instance to keep the stack trace) and the remaining context.
 * The error is not passed twice -- callers routinely pass both a label
 * string and the error.
 */
function partition(args: unknown[]): { error: Error | undefined; context: unknown[] } {
  const index = args.findIndex((arg) => arg instanceof Error);
  if (index === -1) return { error: undefined, context: args };
  const error = args[index] as Error;
  return {
    error,
    context: [...args.slice(0, index), ...args.slice(index + 1)],
  };
}

/**
 * Make arbitrary values safe for Sentry's `extra` payload. Sentry stringifies
 * with a limited serializer, so hand it plain data instead of live objects
 * (Supabase clients, Response bodies, Proxies) that would be dropped anyway.
 */
function serializable(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (depth >= 4) return "[depth limit]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => serializable(item, depth + 1));

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      out[key] = serializable(item, depth + 1);
    }
    return out;
  }
  return String(value);
}

function log(level: Level, args: unknown[], errorId?: string) {
  const prefix = errorId ? `[${errorId}]` : "";
  if (level === "error") console.error(prefix, ...args);
  else if (level === "warn") console.warn(prefix, ...args);
  else console.log(prefix, ...args);

  // Only errors are reported. Warnings and info are high-volume and would
  // bury real failures in the Sentry issue stream.
  if (level !== "error") return;

  const { error, context } = partition(args);
  const label = typeof context[0] === "string" ? context[0] : undefined;

  try {
    if (error) {
      Sentry.captureException(error, {
        tags: {
          ...(errorId ? { errorId } : {}),
          ...(label ? { scope: label } : {}),
        },
        extra: { context: serializable(context) },
      });
    } else {
      // logger.error("something went wrong") with no Error instance -- still
      // worth an issue, just without a stack.
      Sentry.captureMessage(`${prefix} ${context.map((c) => String(c)).join(" ")}`.trim(), {
        level: "error",
        tags: label ? { scope: label } : undefined,
      });
    }
  } catch {
    // Never let telemetry break the request it is describing.
  }
}

/** Base logger -- every call is independent with no correlation context. */
export const logger = {
  error: (...args: unknown[]) => log("error", args),
  warn: (...args: unknown[]) => log("warn", args),
  info: (...args: unknown[]) => log("info", args),

  /**
   * Create a child logger that auto-attaches `errorId` to every entry.
   *
   * Use in request handlers that have received or generated a BH-ERR-* ID
   * to enable full-stack traceability from client error to server log.
   * The ID is also a Sentry tag, so searching it finds every server-side
   * entry for one user-reported failure.
   *
   * Example:
   *   const log = logger.withErrorId("BH-ERR-a1b2c3-d4e5");
   *   log.error("[api/route]", someError);
   */
  withErrorId: (errorId: string) => ({
    error: (...args: unknown[]) => log("error", args, errorId),
    warn: (...args: unknown[]) => log("warn", args, errorId),
    info: (...args: unknown[]) => log("info", args, errorId),
  }),
};
