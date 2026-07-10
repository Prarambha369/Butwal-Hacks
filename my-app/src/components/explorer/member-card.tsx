"use client"

import Link from "next/link"
import type { ExplorerMember } from "@/lib/members"

// ponytail: Shared between explore/page.tsx (server) and explore/explorer-client.tsx (client).
// Marked "use client" because it renders via the client component. Server page imports it fine.

export const roleColors: Record<string, string> = {
  Builder: "text-status-blue border-status-blue/20 bg-status-blue/10",
  Mentor: "text-status-green border-status-green/20 bg-status-green/10",
  Organizer: "text-status-orange border-status-orange/20 bg-status-orange/10",
  Sponsor: "text-bh-red-500 border-bh-red-500/20 bg-bh-red-500/10",
}

export function MemberCard({
  member,
  isHighlighted,
}: {
  member: ExplorerMember
  isHighlighted?: boolean
}) {
  const colorSet = roleColors[member.role] || ""

  return (
    <Link
      href={`/p/${member.bhId}`}
      className={`lg-surface rounded-2xl border p-5 transition-all hover:shadow-md hover:scale-[1.02] group ${
        isHighlighted ? "ring-2 ring-bh-red-500/30" : "border-glass"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            colorSet || "bg-surface/10 text-secondary"
          }`}
        >
          {member.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-primary truncate group-hover:text-bh-red-500 transition-colors">
              {member.name}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                colorSet || "border-border/40 text-secondary"
              }`}
            >
              {member.role}
            </span>
          </div>
          <p className="text-xs text-secondary/70 mt-1 leading-relaxed line-clamp-2">
            {member.bio}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-mono text-secondary/50">{member.bhId}</span>
            <span className="text-[10px] text-secondary/50">{member.xp.toLocaleString()} XP</span>
            <span className="text-[10px] text-secondary/50">{member.projects} projects</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {member.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-surface/20 text-secondary/60"
              >
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="text-[9px] text-secondary/40">+{member.skills.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
