"use client"

import { Users, GraduationCap, CalendarCheck, Handshake } from "lucide-react"
import { FadeIn } from "@/components/home/shared-primitives"
import { communityMembers } from "@/lib/content"

const roleIcons: Record<string, React.ReactNode> = {
  Builder: <Users className="w-5 h-5" />,
  Mentor: <GraduationCap className="w-5 h-5" />,
  Organizer: <CalendarCheck className="w-5 h-5" />,
  Sponsor: <Handshake className="w-5 h-5" />,
}

const roleColors: Record<string, {
  icon: string
  card: string
}> = {
  Builder: { icon: "text-status-blue bg-status-blue/10", card: "border-status-blue/20 hover:border-status-blue/40" },
  Mentor: { icon: "text-status-green bg-status-green/10", card: "border-status-green/20 hover:border-status-green/40" },
  Organizer: { icon: "text-status-orange bg-status-orange/10", card: "border-status-orange/20 hover:border-status-orange/40" },
  Sponsor: { icon: "text-primary-red bg-primary-red/10", card: "border-bh-red-500/20 hover:border-primary-red/40" },
}

export function MemberDirectory() {
  const totalMembers = communityMembers.reduce((sum, m) => sum + m.count, 0)

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" aria-label="Community Members">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/5 to-transparent pointer-events-none" />
      <div
        className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary-red/5 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-status-blue/5 blur-[80px] pointer-events-none"
        aria-hidden="true"
      />

      <FadeIn className="relative mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red mb-4">
            Our Community
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
            Built by <span className="text-primary-red">{totalMembers.toLocaleString()}</span> Members
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-base md:text-lg leading-relaxed">
            From first-time hackers to experienced mentors — every role matters in building what&apos;s next.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {communityMembers.map((member) => (
            <article
              key={member.role}
              className={`bh-card border p-6 flex flex-col items-center text-center transition-all hover:shadow-md hover:scale-[1.02] group ${
                roleColors[member.role]?.card || "border-border"
              }`}
            >
              <div                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                  roleColors[member.role]?.icon || "bg-surface/10"
                }`}
              >
                {roleIcons[member.role] || <Users className="w-5 h-5" />}
              </div>
              <p className="text-3xl md:text-4xl font-black text-primary tracking-tight">
                {member.count.toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-bold text-primary/80">{member.role}s</p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/70 max-w-[160px]">
                {member.description}
              </p>
            </article>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}
