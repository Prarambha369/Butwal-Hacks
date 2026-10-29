"use client"

import Link from "next/link"
import { ExternalLink, Github, Globe, Linkedin } from "lucide-react"
import type { ExplorerMember } from "@/lib/members"
import { cn } from "@/lib/utils"

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
  const isAvailable = member.openToMentor || member.role === "Mentor" || member.lookingForTeam
  const githubUrl = member.githubUrl
  const websiteUrl = member.websiteUrl
  const linkedinUrl = member.linkedinUrl

  return (
    <div className={cn(
      "bh-card border border-border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group",
      isHighlighted && "ring-2 ring-primary-red/30",
    )}
    >
      {isAvailable && (
        <div className="absolute top-0 right-0 flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-status-green/10 text-status-green text-[9px] font-bold px-2 py-1 rounded-bl-xl border-b border-l border-status-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            AVAILABLE
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/p/${member.bhId}`} className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden ring-2 ring-primary-red/20">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-primary-red/10 text-primary-red">
              {member.avatar}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <Link href={`/p/${member.bhId}`}>
              <h3 className="text-sm font-bold text-primary truncate group-hover:text-primary-red transition-colors">
                {member.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span className="text-primary/70">{member.bhId}</span>
              <span>•</span>
              <span>{member.skills.length} skill{member.skills.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {member.bio && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {member.bio}
            </p>
          )}

          <div className="flex items-center gap-1">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors"
                title="github"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors"
                title="linkedin"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors"
                title="website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/p/${member.bhId}`}
              className="text-[10px] font-bold text-primary-red hover:underline flex items-center gap-1"
            >
              View Profile
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
