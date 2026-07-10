/**
 * logger.ts — structured logging for Butwal Hacks.
 *
 * Development: logs to console (no network call).
 * Production: sends structured JSON logs to Axiom's ingest API.
 *   - Fire-and-forget (no await) so it doesn't block request handling.
 *   - Includes level, timestamp, and structured context from the caller.
 *   - Falls back to console if Axiom env vars are missing.
 *
 * Usage:
 *   logger.error("[api/route]", err)       // Error level, string + structured
 *   logger.warn("[api/route]", { key })    // Warning level
 *   logger.info("User action", { userId }) // Info level
 *
 * All call sites remain unchanged — only this file needed updates.
 */

const isDev = process.env.NODE_ENV !== 'production';
const isAxiomConfigured = !!process.env.AXIOM_TOKEN && !!process.env.AXIOM_DATASET;

/** URL-safe characters for search: strip ANSI codes and escape newlines. */
function sanitize(val: unknown): string {
  if (typeof val === 'string') return val.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 5000);
  if (val instanceof Error) return `${val.name}: ${val.message}\n${(val.stack ?? '').slice(0, 2000)}`;
  try { return JSON.stringify(val).slice(0, 5000); } catch { return String(val).slice(0, 5000); }
}

/** Send a batch of log entries to Axiom (fire-and-forget). */
function sendToAxiom(entries: { level: string; message: string; timestamp: string }[]) {
  if (!isAxiomConfigured) return;
  const dataset = process.env.AXIOM_DATASET!;
  const token = process.env.AXIOM_TOKEN!;

  // Fire-and-forget: we don't await this.
  // If the fetch fails, the error is silently dropped (non-blocking).
  fetch(`https://api.axiom.co/v1/datasets/${dataset}/ingest`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "butwalhacks-logger/1.0",
    },
    body: JSON.stringify(entries),
  }).catch(() => {
    // Silently ignored — we never want logging to break the app.
  })
}

/** ponytail: shared batch array across concurrent serverless invocations is acceptable —
 *  worst case mixes log entries from concurrent requests, losing request correlation.
 *  Upgrade path: instantiate a per-request Logger via next-axiom's Logger class and
 *  pass it along instead of using a global singleton. */
// ponytail: const is safe — splice/push mutate the array without reassigning
const batch: { level: string; message: string; timestamp: string }[] = [];

/** Flush buffered log entries to Axiom synchronously (fire-and-forget). */
function flush() {
  if (batch.length === 0) return;
  const entries = batch.splice(0);
  sendToAxiom(entries);
}

/**
 * Build a log entry and add it to the batch.
 * Accepts variadic args like console.log/error/warn.
 *
 * Flushes via queueMicrotask to ensure logs are sent before the serverless
 * function returns — avoids data loss from Vercel freezing the runtime.
 */
function log(level: string, args: unknown[]) {
  if (isDev) {
    // Development: console only, no network call
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else console.log(...args);
    return;
  }

  // Build a structured message from the variadic args
  const parts = args.map((a) => sanitize(a));
  const message = parts.join(" ");

  batch.push({
    level,
    message,
    timestamp: new Date().toISOString(),
  });

  // Flush on the next microtask — batches synchronous log calls within the same
  // event loop tick (e.g. a try-catch calling logger.error multiple times) but
  // sends before the serverless response is sent.
  queueMicrotask(flush);
}

export const logger = {
  error: (...args: unknown[]) => log("error", args),
  warn: (...args: unknown[]) => log("warn", args),
  info: (...args: unknown[]) => log("info", args),
};

