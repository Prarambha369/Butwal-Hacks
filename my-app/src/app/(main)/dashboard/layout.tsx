import { auth0 } from "@/lib/auth0"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createServiceClient } from "@/utils/supabase"
import { DEV_USER_ID, isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass"

export const dynamic = "force-dynamic";

/**
 * Noindex once for the whole /dashboard segment, instead of repeating
 * `robots: { index: false, follow: false }` at the top of every page file.
 * Child metadata merges with this, so titles and descriptions keep working;
 * any page that sets its own robots still overrides it. None should.
 */
export const metadata: Metadata = {
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth0.getSession()

  // Without a session this used to permit the request only outside production,
  // while `dashboard/hacker/layout.tsx` resolved the same request to the
  // identity `none`. The parent created a profile for `dev-user` and the child
  // looked up a different one, so the role guard bounced development traffic
  // back to /dashboard/hacker. Both layouts now share one identity and one
  // gate, from lib/dev-auth-bypass.ts.
  if (!session?.user && !isDevAuthBypassEnabled()) {
    redirect("/auth/login")
  }

  const userId = session?.user?.sub || DEV_USER_ID
  const userEmail = session?.user?.email || `${userId}@placeholder.butwalhacks.com`

  // Bootstrap role for new profiles; privileged roles must be assigned
  // via Auth0 role sync (webhook) or admin tooling — never auto-promoted.
  const initialRole = "hacker"

  // Ensure a profile exists — webhook may not have fired (local dev, first signup)
  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single()

  if (!profile) {
    // Atomic BH-ID generation via Postgres RPC — prevents race conditions
    // on concurrent signups (migration 086_atomic_bh_id_generation).
    const { error: rpcError } = await db.rpc('create_profile_with_bh_id', {
      p_auth0_user_id: userId,
      p_email: userEmail,
      p_full_name: session?.user?.name || 'New Hacker',
      p_role: initialRole,
    })

    if (rpcError) {
      // Fallback: generate a unique BH-ID client-side to avoid crashing the dashboard
      const fallbackSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
      const bhId = `BH-${new Date().getFullYear().toString().slice(2)}-${fallbackSuffix}`;
      await db.from('profiles').insert({
        id: crypto.randomUUID(),
        auth0_user_id: userId,
        slug_id: bhId,
        bh_id: bhId,
        email: userEmail,
        full_name: session?.user?.name || 'New Hacker',
        role: initialRole,
        is_claimed: true,
      })
    }
  }

  return <>{children}</>
}
