import { auth0 } from "@/lib/auth0"
import { redirect } from "next/navigation"
import { createServiceClient } from "@/utils/supabase"

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth0.getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const userId = session.user.sub
  const userEmail = session.user.email || `${userId}@placeholder.butwalhacks.com`
  const emailVerified = session.user.email_verified === true

  // Auto-promote @butwalhacks.com verified emails to maintainer
  const initialRole =
    userEmail.endsWith("@butwalhacks.com") && emailVerified
      ? "maintainer"
      : "hacker"

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
      p_full_name: session.user.name || 'New Hacker',
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
        full_name: session.user.name || 'New Hacker',
        role: initialRole,
        is_claimed: true,
      })
    }
  }

  return <>{children}</>
}
