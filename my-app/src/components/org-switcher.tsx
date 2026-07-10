"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0/client"
import { LogOut, User } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

/**
 * OrgSwitcher — Chapter selector + user menu combo.
 * Replaced Clerk's OrganizationSwitcher + UserButton with a
 * simple dropdown that links to dashboard and sign-out.
 */
export function OrgSwitcher() {
  const { user } = useUser()
  const router = useRouter()
  const [profile, setProfile] = useState<{ bh_id: string; full_name: string } | null>(null)

  useEffect(() => {
    if (!user?.sub) return
    const supabase = createClient()
    supabase
      .from("profiles")
      .select("bh_id, full_name")
      .eq("auth0_user_id", user.sub)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
      })
  }, [user?.id])

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-start text-sm">
        <span className="font-medium text-primary truncate max-w-[140px]">
          {profile?.full_name || "Hacker"}
        </span>
        {profile?.bh_id && (
          <span className="text-[10px] font-mono text-secondary">{profile.bh_id}</span>
        )}
      </div>
      <Link
        href="/dashboard"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-glass bg-surface/30 hover:bg-surface/50 transition-all"
      >
        <User className="h-4 w-4 text-primary" />
      </Link>
      <Link
        href="/sign-out"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-glass bg-surface/30 hover:bg-surface/50 transition-all"
      >
        <LogOut className="h-4 w-4 text-primary" />
      </Link>
    </div>
  )
}
