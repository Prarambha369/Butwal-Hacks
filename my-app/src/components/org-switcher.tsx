"use client";

// ponytail: auth routes use <a> tags (not <Link>) because Auth0 handles
// them via proxy middleware — <Link> triggers RSC fetch which fails.
import Link from "next/link"
import { useUser } from "@auth0/nextjs-auth0/client"
import { LogOut, User } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase"

/**
 * OrgSwitcher — Chapter selector + user menu combo.
 * Simple dropdown that links to dashboard and sign-out (replaces
 * the legacy organization switcher + user button).
 */
export function OrgSwitcher() {
  const { user } = useUser()
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
  }, [user?.sub])

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
        className="flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full border-2 border-border bg-surface/30 hover:bg-surface/50 transition-all"
        aria-label="Dashboard"
      >
        <User className="h-4 w-4 text-primary" />
      </Link>
      <a
        href="/auth/logout"
        className="flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full border-2 border-border bg-surface/30 hover:bg-surface/50 transition-all"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4 text-primary" />
      </a>
    </div>
  )
}
