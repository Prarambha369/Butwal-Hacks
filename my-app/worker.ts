// Cloudflare Worker entry point.
//
// Wraps the OpenNext-generated handler so the Worker can also answer cron
// triggers, which replace the `crons` block of vercel.json. Each schedule
// calls the same route Vercel Cron called, with the same `Bearer CRON_SECRET`
// header, through the self-referencing service binding (no public hop).
//
// .open-next/worker.js only exists after `npm run cf:build`, so this file is
// excluded from tsc and bundled by wrangler instead.
import { default as openNextHandler } from "./.open-next/worker.js";

interface Env {
  CRON_SECRET?: string;
  WORKER_SELF_REFERENCE: { fetch: (input: Request) => Promise<Response> };
}

// Cron expression (wrangler.jsonc `triggers.crons`) → route it runs.
const CRON_ROUTES: Record<string, string> = {
  "0 6 * * *": "/api/health",
  "17 7 * * *": "/api/calendar/google/cron",
};

const worker = {
  fetch: openNextHandler.fetch,

  async scheduled(
    controller: { cron: string },
    env: Env,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ): Promise<void> {
    const path = CRON_ROUTES[controller.cron];
    if (!path || !env.CRON_SECRET) return;
    const request = new Request(`https://cron.internal${path}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(env.WORKER_SELF_REFERENCE.fetch(request));
  },
};

export default worker;
