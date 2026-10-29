"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { UsersRound, CodeXml, CalendarDays, FolderGit2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Animated Counter ──────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 900
    const steps = 24
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return <span>{display.toLocaleString()}{suffix}</span>
}

// ─── Props ─────────────────────────────────────────────────────────

interface ExploreHeroProps {
  totalMembers: number
  totalBuilders: number
  totalProjects: number
  totalEvents: number
}

// ─── Stat Items ────────────────────────────────────────────────────

const statItems = [
  { key: "members", icon: UsersRound, label: "Members", one: "Member", color: "text-primary-red", bg: "bg-primary-red/10" },
  { key: "builders", icon: CodeXml, label: "Builders", one: "Builder", color: "text-status-blue", bg: "bg-status-blue/10" },
  { key: "projects", icon: FolderGit2, label: "Projects", one: "Project", color: "text-status-green", bg: "bg-status-green/10" },
  { key: "events", icon: CalendarDays, label: "Events", one: "Event", color: "text-status-yellow", bg: "bg-status-yellow/10" },
] as const

// ─── Main Component ────────────────────────────────────────────────

export function ExploreHero({ totalMembers, totalBuilders, totalProjects, totalEvents }: ExploreHeroProps) {
  const stats = { members: totalMembers, builders: totalBuilders, projects: totalProjects, events: totalEvents }

  // A row of zeros is a worse first impression than no row at all. Only
  // counts with something behind them are shown; the copy below carries the
  // honest "we are early" signal instead.
  const visible = statItems.filter(({ key }) => stats[key] > 0)
  const isEarly = totalMembers < 10

  return (
    <section className="relative overflow-hidden border-b border-border" aria-label="Explore Hero">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-16 md:pb-16 md:pt-20">
        {/* ── Headline ── */}
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-primary md:text-6xl">
            Find the people{" "}
            <span className="text-primary-red">building here</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Every profile is a real member of the Butwal Hacks community — students, mentors, and
            organizers across Lumbini Province. Look someone up by name or BH-ID and start a thread.
          </p>
          {/* One primary action. The mentor strip further down owns /mentors, and
              the closing section owns the "already a member" path, so neither is
              repeated here. */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/login?screen_hint=signup"
              className="bh-btn-primary text-sm"
            >
              Join the directory
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ── Stats ── */}
        {visible.length > 0 ? (
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
            {visible.map(({ key, icon: Icon, label, one, color }) => {
              const value = stats[key]
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4", color)} aria-hidden="true" />
                  <div>
                    <p className="font-mono text-2xl font-black tabular-nums leading-none text-primary">
                      <AnimatedCounter value={value} />
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {value === 1 ? one : label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {isEarly && (
          <p className="mt-8 max-w-xl text-xs leading-relaxed text-muted-foreground">
            The directory is small because it is new. Profiles appear here after a member joins and
            completes onboarding — nothing is seeded or invented.
          </p>
        )}
      </div>
    </section>
  )
}
