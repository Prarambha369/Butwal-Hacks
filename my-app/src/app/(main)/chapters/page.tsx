import type { Metadata } from "next"
import Link from "next/link"
import {
  MapPin,
  Users,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  MessageSquare,
} from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"
import { chapters, type Chapter } from "@/lib/content"
import Breadcrumbs from "@/components/breadcrumbs"
import { FadeIn } from "@/components/home/shared-primitives"

export const metadata: Metadata = buildPageMetadata({
  title: "Chapters — Butwal Hacks",
  description:
    "Discover Butwal Hacks chapters across Nepal — Pokhara, Kathmandu, and Chitwan. Join your local community of builders, mentors, and innovators.",
  path: "/chapters",
  keywords: [
    "Butwal Hacks chapters",
    "Pokhara tech community",
    "Kathmandu hackathons",
    "Chitwan youth tech",
    "Nepal coding clubs",
  ],
})

const statusConfig: Record<string, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-status-green" },
  forming: { label: "Forming", dot: "bg-accent-yellow" },
  inactive: { label: "Inactive", dot: "bg-secondary/40" },
}

const gradientPairs: Record<string, string> = {
  pokhara: "from-sky-500/20 to-blue-600/10 border-sky-500/30",
  kathmandu: "from-bh-red-500/15 to-red-700/10 border-bh-red-500/25",
  chitwan: "from-emerald-500/20 to-teal-600/10 border-emerald-500/30",
}

function ChapterCard({ chapter, index }: { chapter: Chapter; index: number }) {
  const status = statusConfig[chapter.status] ?? statusConfig.inactive
  const gradient = gradientPairs[chapter.slug] ?? "from-surface to-surface/50 border-glass"

  return (
    <FadeIn delay={index * 100}>
      <article className="lg-surface rounded-2xl border border-glass overflow-hidden hover:shadow-md transition-all group">
        {/* Card header with gradient accent */}
        <div className={`h-2 bg-gradient-to-r ${gradient.split(" ")[0]} ${gradient.split(" ")[1]}`} />

        <div className="p-6 md:p-8">
          {/* Status + Established */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className="text-[10px] font-medium text-secondary/50">
              Est. {chapter.established}
            </span>
          </div>

          {/* Name + Location */}
          <h2 className="text-2xl font-black tracking-tight text-primary group-hover:text-bh-red-500 transition-colors">
            {chapter.name}
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-secondary/70">
            <MapPin className="w-3.5 h-3.5" />
            {chapter.city}, {chapter.district} — {chapter.province}
          </p>

          {/* Description */}
          <p className="mt-4 text-sm text-secondary/80 leading-relaxed">
            {chapter.description}
          </p>

          {/* Stats row */}
          <div className="mt-5 flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-bh-red-500" />
              <span className="text-sm font-bold text-primary">{chapter.memberCount}</span>
              <span className="text-xs text-secondary/50">members</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-bh-red-500" />
              <span className="text-xs text-secondary/50">{chapter.established}</span>
            </div>
          </div>

          {/* Highlights */}
          <ul className="mt-5 space-y-2">
            {chapter.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-secondary/70">
                <span className="mt-0.5 w-1 h-1 rounded-full bg-status-green shrink-0" />
                {h}
              </li>
            ))}
          </ul>

          {/* Join CTA */}
          <div className="mt-6 pt-5 border-t border-border/20 flex items-center gap-3">
            {chapter.socialLinks?.whatsapp && (
              <a
                href={chapter.socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-deep-red transition-all active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Join Chapter <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Link
              href={`/orgs/${chapter.slug}/dashboard`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors"
            >
              Chapter dashboard <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </article>
    </FadeIn>
  )
}

export default function ChaptersPage() {
  const activeChapters = chapters.filter((c) => c.status === "active")
  const totalMembers = chapters.reduce((sum, c) => sum + c.memberCount, 0)

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Butwal Hacks Chapters",
            description: "Active local chapters of Butwal Hacks across Nepal",
            itemListElement: chapters.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Organization",
                name: c.name,
                url: `https://butwalhacks.com/chapters#${c.slug}`,
                description: c.description,
                areaServed: {
                  "@type": "City",
                  name: c.city,
                },
              },
            })),
          }),
        }}
      />

      <main className="min-h-screen bg-background">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/20" aria-label="Chapters Hero">
          {/* Decorative blobs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-bh-red-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-60 h-60 rounded-full bg-sky-500/10 blur-[80px] pointer-events-none" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Community", href: "/community" },
                { label: "Chapters" },
              ]}
            />

            <div className="mt-8 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-bh-red-500" />
                Chapters
              </p>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-primary leading-[1.05]">
                Find Your
                <br />
                <span className="text-bh-red-500">Local Chapter</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-secondary leading-relaxed max-w-2xl">
                Butwal Hacks chapters bring together builders, mentors, and organizers in cities across Nepal.
                Join the chapter nearest to you and start building with your local community.
              </p>

              {/* Stats row */}
              <div className="mt-8 flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-black text-bh-red-500">{activeChapters.length}</p>
                  <p className="text-xs text-secondary/60 mt-0.5">Active Chapters</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-bh-red-500">{totalMembers}+</p>
                  <p className="text-xs text-secondary/60 mt-0.5">Community Members</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-bh-red-500">12+</p>
                  <p className="text-xs text-secondary/60 mt-0.5">Events Hosted</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CHAPTERS GRID ──────────────────────────────────── */}
        <section className="py-16 md:py-24" aria-label="Chapter Listings">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeChapters.map((chapter, index) => (
                <ChapterCard key={chapter.slug} chapter={chapter} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        {/* ── WHY JOIN A CHAPTER ──────────────────────────────── */}
        <section className="py-20 md:py-28" aria-label="Why Join a Chapter">
          <FadeIn className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-4">
                Why Join
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
                What You Get as a Chapter Member
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: Users,
                  title: "Local Community",
                  desc: "Connect with builders and mentors in your city. Attend in-person meetups, hackathons, and workshops.",
                },
                {
                  icon: Sparkles,
                  title: "Hands-on Experience",
                  desc: "Ship real projects, earn verifiable trust markers, and build a portfolio that stands out.",
                },
                {
                  icon: MessageSquare,
                  title: "Direct Mentorship",
                  desc: "Get guidance from experienced developers and industry professionals in your chapter.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="lg-surface rounded-2xl border border-glass p-6 text-center hover:shadow-md transition-all"
                >
                  <div className="inline-flex p-3 rounded-xl bg-bh-red-500/10 border border-bh-red-500/20 mb-4">
                    <item.icon className="w-5 h-5 text-bh-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm text-secondary/80 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        {/* ── START A CHAPTER ─────────────────────────────────── */}
        <section className="relative py-24 md:py-32 overflow-hidden" aria-label="Start a Chapter">
          <div className="absolute inset-0 bg-gradient-to-b from-bh-red-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-bh-red-500/10 blur-[120px] pointer-events-none" />

          <FadeIn className="relative mx-auto max-w-3xl px-4 text-center">
            <Sparkles className="w-10 h-10 text-bh-red-500 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
              Don&apos;t See Your City?
            </h2>
            <p className="mt-4 text-lg text-secondary max-w-xl mx-auto leading-relaxed">
              We&apos;re expanding across Nepal. If you&apos;d like to start a Butwal Hacks chapter in
              your city, reach out — we&apos;ll help you set it up.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
              >
                Start a Chapter <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/30 px-8 py-3.5 text-sm font-bold text-primary hover:bg-surface/50 transition-all"
              >
                Explore Community <Users className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
    </>
  )
}
