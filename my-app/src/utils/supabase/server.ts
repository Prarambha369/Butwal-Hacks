import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "./service"

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

/**
 * Creates an authenticated Supabase client using the current Auth0 session.
 * Uses the Service Role Key (bypasses RLS) per the architectural decision to
 * use Supabase strictly as a database with Auth0 for auth.
 *
 * Returns `{ supabase, userId }` on success, or `null` if not authenticated.
 */
export async function createAuthenticatedClient() {
  const session = await auth0.getSession()
  if (!session?.user) return null

  return { supabase: createServiceClient(), userId: session.user.sub }
}
