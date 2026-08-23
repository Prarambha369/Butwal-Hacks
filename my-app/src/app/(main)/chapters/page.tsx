import type { Metadata } from "next"
import Link from "next/link"
import { MapPin, Users, Calendar, ArrowUpRight, ExternalLink, Sparkles, MessageSquare, GraduationCap, User } from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"
import { chapters, type Chapter } from "@/lib/content"
import Breadcrumbs from "@/components/breadcrumbs"
import SafeJsonLd from "@/lib/json-ld"
import { FadeIn } from "@/components/home/shared-primitives"

export const dynamic = "force-static";

export const metadata: Metadata = buildPageMetadata({
  title: "Chapters — Butwal Hacks",
  description:
    "Discover Butwal Hacks school chapters across Lumbini Province — partnered with school tech clubs to bring coding, hackathons, and mentorship to students.",
  path: "/chapters",
  keywords: [
    "Butwal Hacks school chapters",
    "school coding clubs Nepal",
    "student tech clubs Lumbini",
    "Bhawani Secondary School tech",
    "Adarsha coding club",
  ],
})

const statusConfig: Record<string, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-status-green" },
  forming: { label: "Forming", dot: "bg-accent-yellow" },
  inactive: { label: "Inactive", dot: "bg-secondary/40" },
}

const gradientPairs: Record<string, string> = {
  "bhawani-secondary-school": "from-status-blue/20 to-status-blue/10 border-status-blue/30",
  "adarsha-secondary-school": "from-status-green/20 to-status-green/10 border-status-green/30",
  "butwal-multiple-campus": "from-primary-red/15 to-primary-red/10 border-primary-red/25",
}

function ChapterCard({ chapter, index }: { chapter: Chapter; index: number }) {
  const status = statusConfig[chapter.status] ?? statusConfig.inactive
  const gradient = gradientPairs[chapter.slug] ?? "from-surface to-surface/50 border-border"

  return (
    <FadeIn delay={index * 100}>
      <article className="bh-card overflow-hidden hover:shadow-md transition-all group">
        {/* Card header with gradient accent */}
        <div className={`h-2 bg-gradient-to-r ${gradient.split(" ")[0]} ${gradient.split(" ")[1]}`} />

        <div className="p-6 md:p-8">
          {/* Status + Established */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground/50">
              Est. {chapter.established}
            </span>
          </div>

          {/* School Name + Location */}
          <h2 className="text-2xl font-black tracking-tight text-primary group-hover:text-primary-red transition-colors">
            {chapter.name}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="w-3.5 h-3.5 text-primary-red shrink-0" />
            {chapter.school}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {chapter.city}, {chapter.district} — {chapter.province}
          </p>

          {/* Description */}
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {chapter.description}
          </p>

          {/* Stats row */}
          <div className="mt-5 flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-red" />
              <span className="text-sm font-bold text-primary">{chapter.memberCount}</span>
              <span className="text-xs text-muted-foreground">members</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-red" />
              <span className="text-xs text-muted-foreground/50">{chapter.established}</span>
            </div>
          </div>

          {/* Highlights */}
          <ul className="mt-5 space-y-2">
            {chapter.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 w-1 h-1 rounded-full bg-status-green shrink-0" />
                {h}
              </li>
            ))}
          </ul>

          {/* Chapter Lead + Join */}
          <div className="mt-6 pt-5 border-t border-border/20 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3 h-3 text-primary-red" />
              Lead: <span className="font-semibold text-primary">{chapter.leadName}</span>
            </div>
            <span className="text-muted-foreground/30">|</span>
            {chapter.socialLinks?.whatsapp && (
              <a
                href={chapter.socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-red hover:underline"
              >
                <MessageSquare className="w-3 h-3" />
                Join <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
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
      <SafeJsonLd data={{
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
      }} />

      <main className="min-h-dvh bg-background">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/20" aria-label="Chapters Hero">
          {/* Decorative blobs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-red/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-status-green/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-60 h-60 rounded-full bg-status-blue/10 blur-[80px] pointer-events-none" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Community", href: "/community" },
                { label: "Chapters" },
              ]}
            />

            <div className="mt-8 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-bh-red-500" />
                Chapters
              </p>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-primary leading-[1.05]">
                School
                <br />
                <span className="text-primary-red">Chapters</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Butwal Hacks school chapters bring coding, hackathons, and mentorship directly into partner schools across Lumbini Province.
                Each chapter is led by a student lead and coordinated with the school&apos;s existing tech club.
              </p>

              {/* Stats row */}
              <div className="mt-8 flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-black text-primary-red">{activeChapters.length}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Active Chapters</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-primary-red">{totalMembers}+</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Community Members</p>
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
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-bh-red-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary-red/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary-red/30" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
                What Your School Chapter Gets
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[minmax(200px,auto)] max-w-4xl mx-auto">
              {[
                {
                  icon: Users,
                  title: "School-Level Community",
                  desc: "Build alongside classmates with a dedicated student lead and faculty support. Monthly meetups and coding circles right at your school.",
                },
                {
                  icon: Sparkles,
                  title: "Club Partnership",
                  desc: "Partner with your school's existing tech or coding club. Get resources, mentorship, and a direct pipeline to Butwal Hacks events.",
                },
                {
                  icon: MessageSquare,
                  title: "Student Leadership",
                  desc: "Each chapter is led by a student lead who organizes activities, communicates with Butwal Hacks, and grows the local community.",
                },
              ].map((item, i) => {
                const isHero = i === 0
                return (
                  <div
                    key={item.title}
                    className={`bh-card p-6 hover:shadow-md transition-all ${
                      isHero ? "md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary-red/[0.03] to-transparent border-primary-red/10 text-left flex flex-col justify-center" : "text-center"
                    }`}
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-primary-red/10 border border-primary-red/20 mb-4 ${
                      isHero ? "" : "mx-auto"
                    }`}>
                      <item.icon className="w-5 h-5 text-primary-red" />
                    </div>
                    <h3 className={`font-bold text-primary ${
                      isHero ? "text-2xl md:text-3xl" : "text-lg"
                    }`}>{item.title}</h3>
                    <p className={`mt-2 text-muted-foreground leading-relaxed ${
                      isHero ? "text-base max-w-lg" : "text-sm"
                    }`}>{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </FadeIn>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        {/* ── START A CHAPTER ─────────────────────────────────── */}
        <section className="relative py-24 md:py-32 overflow-hidden" aria-label="Start a Chapter">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-red/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-red/10 blur-[120px] pointer-events-none" />

          <FadeIn className="relative mx-auto max-w-3xl px-4 text-center">
            <Sparkles className="w-10 h-10 text-primary-red mx-auto mb-6" />              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
              Don&apos;t See Your School?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              We&apos;re expanding to more schools across Lumbini Province. If you&apos;d like to start a Butwal Hacks chapter
              at your school, reach out — we&apos;ll help you set it up with a student lead and club partnership.
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
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-hover px-8 py-3.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all"
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
