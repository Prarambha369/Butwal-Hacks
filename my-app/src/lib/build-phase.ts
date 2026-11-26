import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * True while `next build` prerenders pages.
 *
 * ISR pages use this to decide what to do with a failed data read. At build
 * time (CI, a local build without real keys, a database blip during deploy)
 * they render an empty fallback so the build still succeeds; the page then
 * regenerates on the first request after its revalidate window. At runtime
 * they throw instead: a failed regeneration keeps serving the last good page
 * and retries on the next request, instead of caching an empty or 404 page
 * for the whole window.
 */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
}
