import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Should an ISR page render its empty fallback when a data read fails, or
 * throw?
 *
 * Throw only at production runtime. There, a throw during regeneration keeps
 * serving the last good page and retries on the next request, instead of
 * caching an empty list or a 404 for the whole revalidate window.
 *
 * Degrade everywhere else:
 *  - during `next build` (CI, a local build without real keys, a database
 *    blip mid-deploy), so the build still succeeds and the page regenerates
 *    on the first request after its window;
 *  - in `next dev` / tests, where nothing is cached, so a partial local or CI
 *    database shows the empty state rather than an error page.
 */
export function degradeOnReadError(): boolean {
  return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD || process.env.NODE_ENV !== "production";
}
