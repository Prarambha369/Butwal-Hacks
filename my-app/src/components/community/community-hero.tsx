import Link from "next/link"
import { ArrowUpRight, Users } from "lucide-react"
import { communityStats } from "@/lib/content"

export function CommunityHero() {
  return (
    <section
      className="relative overflow-hidden border-b border-border/20"
      aria-label="Community Hero"
    >
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-red/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-status-blue/10 blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bh-red-500" />
              Community
            </p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-primary leading-[1.05]">
              Where Builders
              <br />
              <span className="text-primary-red">Meet Opportunity</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-secondary leading-relaxed max-w-xl">
              Butwal Hacks is more than events — it&apos;s a growing community of students, developers,
              designers, and mentors building the future of tech in Lumbini Province, Nepal.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
              >
                Join the Community <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/30 px-6 py-3 text-sm font-bold text-primary hover:bg-surface/50 transition-all"
              >
                Explore Members <Users className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right: Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {communityStats.map((stat) => (
              <div
                key={stat.label}
                className="bh-card p-5 md:p-6 hover:shadow-md transition-all"
              >
                <p className="text-3xl md:text-4xl font-black text-primary-red tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-bold text-primary">{stat.label}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-secondary/70">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
