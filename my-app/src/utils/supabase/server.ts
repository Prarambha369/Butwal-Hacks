import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Base Supabase client for server-side use.
 * Uses the ANON key so that RLS policies are enforced for public data reads.
 *
 * ponytail: supabase-js communicates via PostgREST HTTP API, NOT direct DB
 * connections. PgBouncer connection pooling is irrelevant here — PostgREST
 * manages its own pool.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}


