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
 * Service role Supabase client (bypasses RLS).
 * Use only in trusted server contexts.
 */
export function createServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
