/**
 * In-memory deduplication for CSP violation reports (/api/csp-violation).
 *
 * Per function instance, so it is best-effort: a cold start or a second
 * instance logs a key again. That is the point — it costs nothing (no Redis,
 * no network) and still collapses the bursts one broken page or one browser
 * extension produces.
 */

export const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
export const DEDUPE_MAX_KEYS = 500;

const recentlyLogged = new Map<string, number>();

/** True the first time `key` is seen in the window; false for repeats. */
export function shouldLogCspReport(key: string, now: number = Date.now()): boolean {
  const last = recentlyLogged.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;

  if (recentlyLogged.size >= DEDUPE_MAX_KEYS) {
    for (const [k, t] of recentlyLogged) {
      if (now - t >= DEDUPE_WINDOW_MS) recentlyLogged.delete(k);
    }
    // Still full of live keys: evict the oldest insertion.
    if (recentlyLogged.size >= DEDUPE_MAX_KEYS) {
      const oldest = recentlyLogged.keys().next().value;
      if (oldest !== undefined) recentlyLogged.delete(oldest);
    }
  }

  recentlyLogged.delete(key);
  recentlyLogged.set(key, now);
  return true;
}

/** Number of keys currently tracked (tests and diagnostics). */
export function cspDedupeSize(): number {
  return recentlyLogged.size;
}

/** Forget every key (tests). */
export function resetCspDedupe(): void {
  recentlyLogged.clear();
}
