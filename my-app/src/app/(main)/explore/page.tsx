import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Users, Code2, Zap } from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"
import { explorerMembers, getExplorerStats } from "@/lib/members"
import { initiatives } from "@/lib/content"
import { MemberCard } from "@/components/explorer/member-card"
import { ExplorerClient } from "./explorer-client"

export const metadata: Metadata = buildPageMetadata({
  title: "Explore — Butwal Hacks Community",
  description:
    "Discover builders, mentors, and organizers in the Butwal Hacks community. Browse profiles, search by BH-ID, and find your next collaborator.",
  path: "/explore",
  keywords: ["member directory", "BH-ID explorer", "community profiles", "tech talent Nepal"],
})

export default function ExplorePage() {
  const stats = getExplorerStats()
  const activeInitiatives = initiatives.filter((i) => i.status === "active").slice(0, 3)

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Explore — Butwal Hacks Community",
            description:
              "Discover builders, mentors, and organizers in the Butwal Hacks community.",
            url: "https://butwalhacks.com/explore",
            about: {
              "@type": "NGO",
              name: "Butwal Hacks",
              description: "A nonprofit youth technology initiative in Butwal, Nepal.",
            },
          }),
        }}
      />

      <main className="min-h-screen bg-background">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden border-b border-border/20"
          aria-label="Explore Hero"
        >
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-bh-red-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-status-blue/10 blur-[100px] pointer-events-none" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="flex flex-col items-center text-center">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-bh-red-500" />
                Explorer
              </p>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-primary leading-[1.05]">
                Discover the{" "}
                <span className="text-bh-red-500">Community</span>
              </h1>
              <p className="mt-4 max-w-xl text-secondary text-base md:text-lg leading-relaxed">
                Browse profiles, explore projects, and find your next collaborator
                in Butwal&apos;s growing tech ecosystem.
              </p>
            </div>

            {/* Stats Bar */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <StatsCard value={stats.total.toString()} label="Members" icon={<Users className="w-4 h-4" />} />
              <StatsCard value={stats.byRole.Builder.toString()} label="Builders" icon={<Code2 className="w-4 h-4" />} />
              <StatsCard value={stats.totalProjects.toString()} label="Projects" icon={<Zap className="w-4 h-4" />} />
              <StatsCard value={`${(stats.totalXp / 1000).toFixed(1)}K`} label="Total XP" icon={<Zap className="w-4 h-4" />} />
            </div>
          </div>
        </section>

        {/* ── MEMBER DIRECTORY WITH SEARCH ─────────────────────── */}
        <section className="py-16 md:py-20" aria-label="Member Directory">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-primary">
                  Community Members
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  {stats.total} people building the future of tech in Lumbini Province.
                </p>
              </div>
            </div>

            {/* Client-Side Interactive Explorer */}
            <ExplorerClient members={explorerMembers} />

            {/* Static Fallback Grid (visible while JS loads) */}
            <noscript>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {explorerMembers.slice(0, 6).map((member) => (
                  <MemberCard key={member.bhId} member={member} />
                ))}
              </div>
            </noscript>
          </div>
        </section>

        {/* ── FEATURED INITIATIVES ─────────────────────────────── */}
        <section className="bg-surface/5 border-y border-border/20 py-16 md:py-20" aria-label="Explore Initiatives">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-3">
                  Get Involved
                </p>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-primary">
                  Active Initiatives
                </h2>
              </div>
              <Link
                href="/initiatives"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                View all <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activeInitiatives.map((initiative) => (
                <Link
                  key={initiative.slug}
                  href={`/initiatives/${initiative.slug}`}
                  className="lg-surface rounded-2xl border border-glass p-6 hover:shadow-md transition-all group"
                >
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-status-green" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-status-green">
                      {initiative.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-primary group-hover:text-bh-red-500 transition-colors">
                    {initiative.name}
                  </h3>
                  <p className="mt-2 text-sm text-secondary/80 leading-relaxed">
                    {initiative.summary}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-secondary/60 group-hover:text-bh-red-500 transition-colors">
                    Learn more <ArrowUpRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="py-20 md:py-24" aria-label="Join the Community">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
              Don&apos;t See Your Profile?
            </h2>
            <p className="mt-4 text-lg text-secondary max-w-xl mx-auto leading-relaxed">
              Create your BH-ID and join {stats.total}+ members building the future of tech in Lumbini Province.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
              >
                Create Your Profile <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/30 px-8 py-3.5 text-sm font-bold text-primary hover:bg-surface/50 transition-all"
              >
                Visit Community <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

// ─── Server Components ─────────────────────────────────────────────

function StatsCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="lg-surface rounded-xl border border-glass p-4 text-center">
      <div className="flex justify-center mb-1 text-secondary/50">{icon}</div>
      <p className="text-xl md:text-2xl font-black text-bh-red-500">{value}</p>
      <p className="text-[11px] font-bold text-secondary/70 mt-0.5">{label}</p>
    </div>
  )
}
