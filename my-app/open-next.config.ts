import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * OpenNext adapter config for Cloudflare Workers (Free plan).
 *
 * Every choice here stays inside the Workers Free allowances, with no paid
 * add-on and no card on file:
 *
 * - Incremental cache (ISR/SSG pages, fetch cache): Workers KV, wrapped in the
 *   Cache API regional cache. KV Free is 100k reads and 1k writes per day; the
 *   regional cache answers repeat hits from the colo without a KV read, and a
 *   write only happens when a page actually regenerates. R2 would need the R2
 *   subscription, so it is deliberately not used.
 * - Tag cache (revalidatePath/revalidateTag from server actions): D1. Free is
 *   5M reads and 100k writes per day.
 * - Revalidation queue: in-memory (no Durable Objects or Queues needed).
 *
 * Bindings are declared in wrangler.jsonc. See docs/CLOUDFLARE.md.
 */
const config = defineCloudflareConfig({
  incrementalCache: withRegionalCache(kvIncrementalCache, { mode: "long-lived" }),
  tagCache: d1NextTagCache,
  queue: memoryQueue,
  // Serve cached ISR/SSG responses before the Next.js server is even loaded,
  // which is what keeps cached page hits well under the 10 ms CPU limit.
  enableCacheInterception: true,
});

const openNextConfig = {
  ...config,
  // webpack instead of Turbopack for the Worker build: Turbopack copies shared
  // modules into many server chunks (3.83 vs 4.02 MiB gzipped after minify).
  // `next dev` and Vercel builds still use Turbopack.
  buildCommand: "npx next build --webpack",
};

export default openNextConfig;
