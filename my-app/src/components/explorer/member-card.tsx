"use client"

import Link from "next/link"
import type { ExplorerMember } from "@/lib/members"
import { usePresence } from "@/hooks/use-presence"
import { LiveDot } from "@/components/hacker-id/live-dot"
import { cn } from "@/lib/utils"

// ponytail: Shared between explore/page.tsx (server) and explore/explorer-client.tsx (client).
// Marked "use client" because it renders via the client component. Server page imports it fine.

export const roleColors: Record<string, string> = {
  Builder: "text-status-blue border-status-blue/20 bg-status-blue/10",
  Mentor: "text-status-green border-status-green/20 bg-status-green/10",
  Organizer: "text-status-orange border-status-orange/20 bg-status-orange/10",
  Sponsor: "text-primary-red border-primary-red/20 bg-primary-red/10",
}

function XpBar({ xp, maxXp = 10000 }: { xp: number; maxXp?: number }) {
  const pct = Math.min((xp / maxXp) * 100, 100)
  return (
    <div className="w-full h-1 rounded-full bg-surface-hover overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary-red/60 to-primary-red transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function MemberCard({
  member,
  isHighlighted,
}: {
  member: ExplorerMember
  isHighlighted?: boolean
}) {
  const onlineIds = usePresence()
  const colorSet = roleColors[member.role] || ""
  const isOnline = !!(member.auth0_user_id && onlineIds.has(member.auth0_user_id))

  return (
    <Link
      href={`/p/${member.bhId}`}
      className={cn(
        "bh-card border p-5 transition-all duration-300 group relative overflow-hidden",
        "hover:shadow-md hover:-translate-y-1",
        isHighlighted ? "ring-2 ring-primary-red/30" : "border-border",
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-red/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-transform duration-300 group-hover:scale-105",
              colorSet || "bg-surface-hover text-muted-foreground",
            )}
          >
            {member.avatar}
          </div>
          {/* Live presence dot */}
          <div className="absolute -top-0.5 -right-0.5">
            <LiveDot online={isOnline} size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Name + Role */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-primary truncate group-hover:text-primary-red transition-colors">
              {member.name}
            </h3>
            <span
              className={cn(
                "shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border",
                colorSet || "border-border text-muted-foreground",
              )}
            >
              {member.role}
            </span>
          </div>

          {/* Bio */}
          {member.bio && (
            <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
              {member.bio}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/50">
            <span>{member.bhId}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
            <span>{member.xp.toLocaleString()} XP</span>
            {member.projects > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                <span>{member.projects} project{member.projects !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>

          {/* XP Progress Bar */}
          <XpBar xp={member.xp} />

          {/* Skills */}
          {member.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {member.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-surface-hover text-muted-foreground/60 border border-border/50"
                >
                  {skill}
                </span>
              ))}
              {member.skills.length > 4 && (
                <span className="text-[9px] text-muted-foreground/40 px-1.5 py-0.5">
                  +{member.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
