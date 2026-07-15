"use client"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const CLIENT_KEY = "__supabaseClient__";

declare global {
  interface Window {
    [CLIENT_KEY]: ReturnType<typeof createSupabaseClient>;
  }
}

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
