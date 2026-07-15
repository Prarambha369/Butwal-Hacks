"use client"

import Link from "next/link"
import type { ExplorerMember } from "@/lib/members"
import { usePresence } from "@/hooks/use-presence"
import { LiveDot } from "@/components/hacker-id/live-dot"

// ponytail: Shared between explore/page.tsx (server) and explore/explorer-client.tsx (client).
// Marked "use client" because it renders via the client component. Server page imports it fine.

export const roleColors: Record<string, string> = {
  Builder: "text-status-blue border-status-blue/20 bg-status-blue/10",
  Mentor: "text-status-green border-status-green/20 bg-status-green/10",
  Organizer: "text-status-orange border-status-orange/20 bg-status-orange/10",
  Sponsor: "text-primary-red border-primary-red/20 bg-primary-red/10",
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
      className={`bh-card border p-5 transition-all hover:shadow-md hover:scale-[1.02] group ${
        isHighlighted ? "ring-2 ring-bh-red-500/30" : "border-border"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
              colorSet || "bg-surface-hover text-muted-foreground"
            }`}
          >
            {member.avatar}
          </div>
          {/* Live presence dot on the avatar box */}
          <div className="absolute -top-0.5 -right-0.5">
            <LiveDot online={isOnline} size="sm" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-primary truncate group-hover:text-primary-red transition-colors">
              {member.name}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                colorSet || "border-border text-muted-foreground"
              }`}
            >
              {member.role}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">
            {member.bio}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-mono text-muted-foreground/50">{member.bhId}</span>
            <span className="text-[10px] text-muted-foreground/50">{member.xp.toLocaleString()} XP</span>
            <span className="text-[10px] text-muted-foreground/50">{member.projects} projects</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {member.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-surface-hover text-muted-foreground/60"
              >
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="text-[9px] text-muted-foreground/40">+{member.skills.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
