"use client"

import { useEffect, useState } from "react"
import { Users, Code2, Zap, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Animated Counter ──────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 1200
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
  totalXp: number
}

// ─── Stat Items ────────────────────────────────────────────────────

const statItems = [
  { key: "members", icon: Users, label: "Members", color: "text-primary-red", bg: "bg-primary-red/10" },
  { key: "builders", icon: Code2, label: "Builders", color: "text-status-blue", bg: "bg-status-blue/10" },
  { key: "projects", icon: Trophy, label: "Projects", color: "text-status-green", bg: "bg-status-green/10" },
  { key: "xp", icon: Zap, label: "Total XP", color: "text-status-yellow", bg: "bg-status-yellow/10", format: true },
]

// ─── Main Component ────────────────────────────────────────────────

export function ExploreHero({ totalMembers, totalBuilders, totalProjects, totalXp }: ExploreHeroProps) {
  const stats = { members: totalMembers, builders: totalBuilders, projects: totalProjects, xp: totalXp }

  return (
    <section className="relative overflow-hidden border-b border-border/20" aria-label="Explore Hero">
      {/* ── Ambient Glows ── */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-red/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-status-blue/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-status-green/[0.03] blur-[160px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
        {/* ── Eyebrow ── */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/8 text-[10px] font-bold text-primary-red tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-red animate-pulse" />
            Live Directory
          </span>
        </div>

        {/* ── Headline ── */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-primary leading-[1.05]">
            Discover the{" "}
            <span className="text-primary-red relative">
              Community
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary-red/30 rounded-full" />
            </span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
            Browse profiles, explore projects, and find your next collaborator in Butwal&apos;s tech community.
          </p>
        </div>

        {/* ── Animated Stats Grid ── */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {statItems.map(({ key, icon: Icon, label, color, bg, format }) => {
            const value = stats[key as keyof typeof stats]
            return (
              <div
                key={key}
                className="bh-card rounded-xl p-4 text-center hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className={cn("flex justify-center mb-2 p-1.5 rounded-lg mx-auto w-fit", bg, color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className={cn("text-xl md:text-2xl font-black font-mono tabular-nums", color)}>
                  {format ? (
                    `${(value / 1000).toFixed(1)}K`
                  ) : (
                    <AnimatedCounter value={value} />
                  )}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/60 mt-0.5 uppercase tracking-wider">
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
