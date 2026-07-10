import { auth0 } from "@/lib/auth0"
import { redirect } from "next/navigation"
import { createServiceClient } from "@/utils/supabase/service"
import { logger } from "@/lib/logger"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth0.getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const userId = session.user.sub

  // Ensure a profile exists — webhook may not have fired (local dev, first signup)
  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single()

  if (!profile) {
    // Generate a sequential BH-ID: BH-YY-NNN
    const yearSuffix = new Date().getFullYear().toString().slice(-2)
    const { data: maxRow } = await db
      .from('profiles')
      .select('slug_id')
      .like('slug_id', `BH-${yearSuffix}-%`)
      .order('slug_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextNum = 1
    if (maxRow?.slug_id) {
      const parts = maxRow.slug_id.split('-')
      const lastNum = parseInt(parts[2], 10)
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1
      }
    }
    const bhId = `BH-${yearSuffix}-${String(nextNum).padStart(3, '0')}`

    await db.from('profiles').insert({
      id: crypto.randomUUID(),
      auth0_user_id: userId,
      slug_id: bhId,
      bh_id: bhId,
      email: session.user.email || `${userId}@placeholder.butwalhacks.com`,
      full_name: session.user.name || 'New Hacker',
      role: 'hacker',
      is_claimed: true,
    })
  }

  return <>{children}</>
}
