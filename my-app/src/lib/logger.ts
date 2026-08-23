/**
 * logger.ts -- structured logging for Butwal Hacks.
 *
 * Development: logs to console.
 * Production: logs to console; server-side errors are captured by Sentry.
 *
 * Full-stack traceability:
 *   Use logger.withErrorId(bhErrorId) in request handlers to thread a unique
 *   error ID through all server-side log entries, matching the client-side
 *   error report from error.tsx. Example:
 *
 *     const log = logger.withErrorId("BH-ERR-a1b2c3-d4e5");
 *     log.error("[api/route]", err);
 *
 * Usage:
 *   logger.error("[api/route]", err)       // Error level
 *   logger.warn("[api/route]", { key })    // Warning level
 *   logger.info("User action", { userId }) // Info level
 */

function log(level: string, args: unknown[], errorId?: string) {
  const prefix = errorId ? `[${errorId}]` : '';
  if (level === 'error') console.error(prefix, ...args);
  else if (level === 'warn') console.warn(prefix, ...args);
  else console.log(prefix, ...args);
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
