import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// ponytail: 3 files merged into 1. All exports (client, server, service) in one place.

const CLIENT_KEY = "__supabaseClient__";

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
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
  }

  if (!window[CLIENT_KEY]) {
    window[CLIENT_KEY] = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
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
  return createSupabaseClient(url, key);
}
