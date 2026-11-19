import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// ponytail: 3 files merged into 1. All exports (client, server, service) in one place.

const CLIENT_KEY = "__supabaseClient__";

/** Delays before each retry of a PGRST303 rejection. */
const CLOCK_SKEW_RETRY_DELAYS_MS = [750, 1500];

function sleep(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });
}

async function isClockSkewRejection(res: Response) {
  if (res.status !== 401) return false;
  try {
    const body: unknown = await res.clone().json();
    return typeof body === "object" && body !== null &&
      (body as { code?: unknown }).code === "PGRST303";
  } catch {
    return false;
  }
}

/**
 * fetch that retries PostgREST's `PGRST303 JWT issued at future`.
 *
 * Our keys are static, so the short-lived JWT PostgREST checks is minted
 * by Supabase's API gateway; when that node's clock runs ahead of
 * PostgREST's, a request is rejected before it executes. The skew is
 * sub-second to a few seconds, so waiting briefly and resending succeeds.
 * Safe for every method: a rejected request never reached the database.
 * Streamed bodies cannot be replayed, so those are returned as-is.
 */
export const skewTolerantFetch: typeof fetch = async (input, init) => {
  let res = await fetch(input, init);
  const replayable = init?.body == null || typeof init.body === "string";
  for (const delay of CLOCK_SKEW_RETRY_DELAYS_MS) {
    if (!replayable || !(await isClockSkewRejection(res))) return res;
    await sleep(delay, init?.signal);
    res = await fetch(input, init);
  }
  return res;
};

declare global {
  interface Window {
    [CLIENT_KEY]: ReturnType<typeof createSupabaseClient>;
  }
}

/**
 * Browser-side Supabase client.
 * Uses a module-level singleton so multiple calls return the same instance.
 */
export function createClient() {
  if (typeof window === "undefined") {
    // During SSR, just return a fresh client (singleton not needed server-side)
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: skewTolerantFetch } }
    )
  }

  if (!window[CLIENT_KEY]) {
    window[CLIENT_KEY] = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: skewTolerantFetch } }
    )
  }
  return window[CLIENT_KEY];
}

/**
 * Inert query builder returned when Supabase is not configured.
 *
 * Any method call returns itself, and awaiting it resolves immediately to
 * `{ data: null, error }` — so unconfigured environments (local dev without
 * .env.local, CI builds without secrets) render honest empty states
 * instantly instead of burning seconds per query on unreachable-network
 * timeouts. Never used when real credentials are present.
 */
function createUnconfiguredClient() {
  const result = {
    data: null,
    error: { message: "Supabase not configured", code: "SUPABASE_NOT_CONFIGURED" },
  };
  const proxy = new Proxy(
    {},
    {
      get(_target, prop) {
        // Thenable protocol: `await query` resolves immediately.
        if (prop === "then") return (resolve: (v: unknown) => void) => resolve(result);
        if (typeof prop === "symbol") return undefined;
        return (..._args: unknown[]) => proxy;
      },
    },
  );
  return proxy as unknown as ReturnType<typeof createSupabaseClient>;
}

/**
 * Service role Supabase client (bypasses RLS).
 * Use only in trusted server contexts.
 *
 * Never throws on missing config: CI/preview builds prerender pages
 * without secrets, and every data path already handles query errors
 * with honest empty states. Without config, returns an inert client
 * that fails fast (no network round-trips); a loud warning marks the
 * fallback so a misconfigured production is visible in logs, not as 500s.
 */
/**
 * Supabase project URL, for server-side code only.
 *
 * Falls back to `SUPABASE_URL` because Vercel's Supabase integration
 * provisions that name, not the `NEXT_PUBLIC_` one. Never use this in
 * browser code: `NEXT_PUBLIC_*` is inlined at build time, `SUPABASE_URL`
 * is not, so a client bundle would ship a literal `undefined`.
 */
export function supabaseServerUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

/**
 * Service-role key, for server-side code only. Prefers the explicit
 * `SUPABASE_SERVICE_ROLE_KEY`; falls back to `SUPABASE_SECRET_KEY`, which
 * is what Vercel's Supabase integration keeps in sync when the key rotates.
 */
export function serviceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function createServiceClient() {
  const url = supabaseServerUrl();
  const key = serviceRoleKey();
  if (!url || !key) {
    console.warn(
      "[supabase] Service-role config missing — using inert client. " +
      "Reads will fail fast (empty states). Set NEXT_PUBLIC_SUPABASE_URL " +
      "and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_URL and " +
      "SUPABASE_SECRET_KEY) to fix.",
    );
    return createUnconfiguredClient();
  }
  return createSupabaseClient(url, key, { global: { fetch: skewTolerantFetch } });
}
