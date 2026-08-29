"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ExternalLink,
  Calendar,
  Users,
  MessageSquare,
  Search,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Filter,
  ArrowUpDown,
} from "lucide-react"
import { cn, getAvatarUrl } from "@/lib/utils"

interface MentorProfile {
  bh_id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  skills: string[] | null
  xp: number
  cal_com_url: string | null
  socials: Record<string, string> | null
}

interface MentorDirectoryClientProps {
  mentors: MentorProfile[]
}

const SOCIAL_ICONS: Record<string, typeof Github> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  website: Globe,
  x: Twitter,
}

function getSocialUrl(platform: string, value: string): string {
  if (value.startsWith("http")) return value
  switch (platform) {
    case "github":
      return `https://github.com/${value}`
    case "linkedin":
      return `https://linkedin.com/in/${value}`
    case "twitter":
    case "x":
      return `https://x.com/${value}`
    default:
      return value
  }
}

type SortKey = "activity" | "name" | "skills"

export function MentorDirectoryClient({ mentors }: MentorDirectoryClientProps) {
  const [search, setSearch] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortKey>("activity")
  const [showAllSkills, setShowAllSkills] = useState(false)

  // Extract all unique skills
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>()
    mentors.forEach((m) => m.skills?.forEach((s) => skillSet.add(s)))
    return Array.from(skillSet).sort()
  }, [mentors])

  // Filter + sort mentors
  const filtered = useMemo(() => {
    const result = mentors.filter((mentor) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase()
        const matchName = mentor.full_name?.toLowerCase().includes(q)
        const matchBio = mentor.bio?.toLowerCase().includes(q)
        const matchSkills = mentor.skills?.some((s) => s.toLowerCase().includes(q))
        if (!matchName && !matchBio && !matchSkills) return false
      }

      // Skill filter
      if (selectedSkills.length > 0) {
        const hasAll = selectedSkills.every((s) => mentor.skills?.includes(s))
        if (!hasAll) return false
      }

      return true
    })

    result.sort((a, b) => {
      if (sortBy === "activity") return (b.skills?.length ?? 0) - (a.skills?.length ?? 0)
      if (sortBy === "name") return (a.full_name ?? "").localeCompare(b.full_name ?? "")
      if (sortBy === "skills") return (b.skills?.length ?? 0) - (a.skills?.length ?? 0)
      return 0
    })

    return result
  }, [mentors, search, selectedSkills, sortBy])

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  return (
    <div className="space-y-8">
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, bio, or skill..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-primary placeholder:text-muted-foreground/40 outline-none focus:border-primary-red/50 focus:ring-2 focus:ring-primary-red/20 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="pl-9 pr-8 py-2.5 rounded-lg bg-surface border border-border text-xs font-medium text-primary appearance-none cursor-pointer outline-none focus:border-primary-red/50 focus:ring-2 focus:ring-primary-red/20 transition-all"
          >
            <option value="activity">Sort by Activity</option>
            <option value="name">Sort by Name</option>
            <option value="skills">Sort by Skills</option>
          </select>
        </div>

        {/* Result count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono self-center">
          <Users className="w-3.5 h-3.5" />
          {filtered.length} mentor{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Skill filters */}
      {allSkills.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            <Filter className="w-3 h-3" />
            Filter by skill
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(showAllSkills ? allSkills : allSkills.slice(0, 20)).map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "text-[10px] font-medium px-2 py-1 rounded-md border transition-all min-h-[28px]",
                  selectedSkills.includes(skill)
                    ? "bg-primary-red/10 text-primary-red border-primary-red/30"
                    : "bg-surface text-muted-foreground/60 border-border/50 hover:border-muted-foreground/30"
                )}
              >
                {skill}
              </button>
            ))}
            {allSkills.length > 20 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="text-[10px] text-primary-red font-medium px-2 py-1 hover:underline min-h-[28px]"
              >
                {showAllSkills ? "Show less" : "+" + (allSkills.length - 20) + " more"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mentor grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
            <Users className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-bold text-primary">
            {mentors.length === 0 ? "No mentors available yet" : "No mentors match your search"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            {mentors.length === 0
              ? "Mentors who mark themselves as available in their profile settings will appear here."
              : "Try adjusting your search or filter criteria."}
          </p>
          {mentors.length === 0 && (
            <Link
              href="/dashboard/hacker/profile"
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-red/10 text-primary-red text-xs font-bold hover:bg-primary-red/20 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Set up your mentor profile
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mentor) => {
            const socialEntries = mentor.socials
              ? Object.entries(mentor.socials).filter(([, v]) => v)
              : []

            return (
              <div
                key={mentor.bh_id}
                className="bh-card border border-border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group"
              >
                {/* Mentor badge */}
                <div className="absolute top-0 right-0 flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-status-green/10 text-status-green text-[9px] font-bold px-2 py-1 rounded-bl-xl border-b border-l border-status-green/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
                    AVAILABLE
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden ring-2 ring-primary-red/20">
                    <Image
                      src={getAvatarUrl(mentor.avatar_url, mentor.full_name ?? mentor.bh_id)}
                      alt={mentor.full_name ?? "Mentor"}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Name + Skills */}
                    <div>
                      <h3 className="text-sm font-bold text-primary truncate group-hover:text-primary-red transition-colors">
                        {mentor.full_name ?? "Unnamed"}
                      </h3>
                      <p className="text-[10px] font-mono text-muted-foreground/50">
                        {mentor.skills?.length ?? 0} skill{(mentor.skills?.length ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Bio */}
                    {mentor.bio && (
                      <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
                        {mentor.bio}
                      </p>
                    )}

                    {/* Skills */}
                    {mentor.skills && mentor.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className={cn(
                              "text-[9px] font-medium px-1.5 py-0.5 rounded-md border",
                              selectedSkills.includes(skill)
                                ? "bg-primary-red/10 text-primary-red border-primary-red/30"
                                : "bg-surface-hover text-muted-foreground/60 border-border/50"
                            )}
                          >
                            {skill}
                          </span>
                        ))}
                        {mentor.skills.length > 4 && (
                          <span className="text-[9px] text-muted-foreground/40 px-1.5 py-0.5">
                            +{mentor.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Social links */}
                    {socialEntries.length > 0 && (
                      <div className="flex items-center gap-1">
                        {socialEntries.slice(0, 4).map(([platform, value]) => {
                          const Icon = SOCIAL_ICONS[platform] || Globe
                          return (
                            <a
                              key={platform}
                              href={getSocialUrl(platform, value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-primary hover:bg-surface-hover transition-colors"
                              title={platform}
                            >
                              <Icon className="w-4 h-4" />
                            </a>
                          )
                        })}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/p/${mentor.bh_id}`}
                        className="text-[10px] font-bold text-accent-teal hover:underline flex items-center gap-1"
                      >
                        View Profile <ExternalLink className="w-3 h-3" />
                      </Link>
                      {mentor.cal_com_url && (
                        <a
                          href={mentor.cal_com_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-red text-white text-[10px] font-bold hover:bg-deep-red transition-all shadow-[var(--bh-glow-red-soft)] hover:shadow-[var(--bh-glow-red)]"
                        >
                          <Calendar className="w-3 h-3" />
                          Book 15-min Chat
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
