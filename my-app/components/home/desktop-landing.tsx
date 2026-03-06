/**
 * DesktopLanding
 *
 * The primary landing page component for Butwal Hacks.
 * Implements all 10 sections per the High-Impact Landing Page spec:
 *
 *  1. Hero               — movement energy, animejs entrance
 *  2. Momentum Strip     — count-up social proof
 *  3. Who We Are         — mission + 3 pillars
 *  4. What We Do         — 4 ecosystem capability cards
 *  5. Active Initiatives — live programs with pulse badge
 *  6. Roadmap            — planned initiatives timeline
 *  7. Community          — emotional CTA section
 *  8. Latest Updates     — editorial 3-card grid
 *  9. Governance         — trust/transparency teaser
 * 10. Footer             — structured links + social
 *
 * Animation strategy:
 *  - Hero uses animejs (fade + translateY, stagger) on mount.
 *  - Sections below hero use IntersectionObserver via useInViewOnce hook.
 *  - Fully respects prefers-reduced-motion.
 *
 * Performance:
 *  - "use client" required for IntersectionObserver + animejs.
 *  - CountUp only starts when element enters viewport.
 *  - No external images — pure CSS backgrounds with dot-grid texture.
 */
"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Code2,
  Compass,
  ExternalLink,
  Flag,
  Github,
  Handshake,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react"
import { blogPosts, initiatives } from "@/lib/content"
import { useInViewOnce } from "@/hooks/useInViewOnce"

// ─── Shared primitives ────────────────────────────────────────────────────────

/**
 * FadeIn — wraps children in a scroll-triggered fade+slide-up reveal.
 * Disconnects observer after first trigger to avoid unnecessary reflows.
 */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>(0.12)

  return (
    <div
      ref={ref}
      className={`section-fade ${isVisible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * CountUp — animates from 0 → value on first scroll into view.
 * Uses easeOutCubic over ~1100ms. Skips animation on reduced-motion.
 */
function CountUp({
  value,
  label,
  suffix = "",
}: {
  value: number
  label: string
  suffix?: string
}) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) {
      setCount(value)
      return
    }

    const duration = 1100
    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [isVisible, value])

  return (
    <div
      ref={ref}
      className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-8 py-8 text-center backdrop-blur-sm"
    >
      <p className="text-5xl font-extrabold tracking-tight text-white">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">{label}</p>
    </div>
  )
}

// ─── Static data ──────────────────────────────────────────────────────────────

/** Phase 4 — What We Do capability cards */
const capabilityCards = [
  {
    title: "Hackathons",
    description: "Structured 24–48 hour build cycles where teams ship working prototypes from scratch.",
    cta: "Explore Events",
    href: "/events",
    icon: Rocket,
  },
  {
    title: "Mentorship",
    description: "Domain experts guide learners through real problem-solving and hands-on execution.",
    cta: "Meet Community",
    href: "/community",
    icon: Handshake,
  },
  {
    title: "Open Projects",
    description: "Collaborative initiatives that stay active beyond events and invite ongoing contribution.",
    cta: "View Initiatives",
    href: "/initiatives",
    icon: Code2,
  },
  {
    title: "Learning Programs",
    description: "Structured workshops and tracks built for consistent, real-world skill development.",
    cta: "Read Docs",
    href: "/docs",
    icon: BookOpen,
  },
]

/** Phase 6 — Roadmap planned initiatives */
const roadmapItems = [
  {
    name: "Regional Mentor Network",
    quarter: "Q3 2026",
    description:
      "A formal mentor pool connecting builders across campuses and local communities in Lumbini Province.",
  },
  {
    name: "Builder Fellowship",
    quarter: "Q4 2026",
    description:
      "A cohort model for youth shipping real projects with milestone-based mentorship and accountability.",
  },
  {
    name: "Open Labs Partnership",
    quarter: "Q1 2027",
    description:
      "Institutional collaboration with schools and colleges for recurring hands-on innovation labs.",
  },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function DesktopLanding() {
  /** Hero container — animejs targets all .hero-animate children */
  const heroRef = useRef<HTMLDivElement>(null)

  /**
   * Phase 4 — animejs hero entrance.
   * Staggered fade + translateY on each .hero-animate child.
   * Silently skips if animejs unavailable or reduced-motion preferred.
   */
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced || !heroRef.current) return

    import("animejs").then(({ animate, stagger }) => {
      // animejs v4 named exports: animate() + stagger()
      // ease values use short form: "outQuad" (not "easeOutQuad")
      animate(heroRef.current!.querySelectorAll(".hero-animate"), {
        opacity: [0, 1],
        translateY: [28, 0],
        duration: 800,
        ease: "outQuad",
        delay: stagger(120, { start: 60 }),
      })
    })
  }, [])

  /** Active initiatives (max 3) */
  const activeInitiatives = initiatives.filter((i) => i.status === "active").slice(0, 3)

  /** Latest updates: 2 from blog + 1 static volunteer call */
  const latestUpdates = [
    ...blogPosts.slice(0, 2).map((post, idx) => ({
      title: post.title,
      summary: post.excerpt,
      href: `/blog/${post.slug}`,
      category: ["Community", "Mentorship"][idx] ?? "Community",
    })),
    {
      title: "Open Call: Program Volunteers for 2026 Build Cycles",
      summary:
        "Applications are open for volunteers supporting facilitation, mentoring, and operations across our 2026 programs.",
      href: "/support",
      category: "Opportunity",
    },
  ]

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO — movement energy
          Deep red → near-black gradient + animated dot-grid texture.
          animejs orchestrates entrance of badge, h1, subtext, CTAs.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="hero-bg relative overflow-hidden px-6 pb-32 pt-28"
        aria-labelledby="hero-heading"
      >
        <div className="relative z-10 mx-auto w-full max-w-5xl" ref={heroRef}>
          {/* Eyebrow */}
          <p className="hero-animate inline-flex items-center gap-2 rounded-full border border-red-700/60 bg-red-900/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden="true" />
            The Pulse of Innovation · Western Nepal
          </p>

          {/* H1 */}
          <h1
            id="hero-heading"
            className="hero-animate mt-8 max-w-4xl text-balance text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-7xl"
          >
            Powering Western Nepal&apos;s Next Generation of Builders.
          </h1>

          {/* Subtext */}
          <p className="hero-animate mt-7 max-w-2xl text-lg leading-relaxed text-white/65 md:text-xl">
            Butwal Hacks is a youth-led nonprofit building structured pathways from learning
            to building to launching real-world technology initiatives.
          </p>

          {/* CTAs */}
          <div className="hero-animate mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/community"
              className="rounded-lg bg-red-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-red-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Join the Movement
            </Link>
            <Link
              href="/initiatives"
              className="rounded-lg border border-white/20 px-8 py-3.5 text-sm font-bold text-white/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(220,20,60,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. MOMENTUM STRIP — social proof
          4 count-up metrics, starts animation on scroll into view.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-y border-white/8 bg-[#0a0a0a] px-6 py-12"
        aria-label="Community statistics"
      >
        <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 md:grid-cols-4">
          <CountUp value={500} suffix="+" label="Members" />
          <CountUp value={20} suffix="+" label="Events Hosted" />
          <CountUp value={5} label="Active Programs" />
          <CountUp value={10} suffix="+" label="Partner Institutions" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. WHO WE ARE — mission + 3 pillars
          Crimson left-border accent on intro. Scannable in under 5 seconds.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-b border-white/8 bg-[#0f0f0f] px-6 py-24"
        aria-labelledby="who-heading"
      >
        <div className="mx-auto w-full max-w-6xl">
          <FadeIn>
            <div className="border-l-2 border-red-700 pl-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Who We Are</p>
              <h2
                id="who-heading"
                className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-5xl"
              >
                Building a disciplined and inclusive technology movement from Western Nepal.
              </h2>
            </div>
            <p className="mt-6 max-w-[68ch] text-lg font-semibold leading-relaxed text-white/70">
              Butwal Hacks exists to turn curiosity into contribution — through practical systems,
              community accountability, and long-term execution.
            </p>
          </FadeIn>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Integrity",
                description:
                  "We operate with clear governance, public documentation, and consistent standards that build lasting trust.",
              },
              {
                icon: Users,
                title: "Community",
                description:
                  "We grow by creating supportive pathways where every person can learn, contribute, and belong.",
              },
              {
                icon: Target,
                title: "Practical Learning",
                description:
                  "We prioritise real projects, mentorship, and build-first experiences over theory alone.",
              },
            ].map((pillar, i) => (
              <FadeIn
                key={pillar.title}
                delay={i * 110}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-300 hover:border-red-700/40"
              >
                <pillar.icon className="h-8 w-8 text-red-500" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-bold text-white">{pillar.title}</h3>
                <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-white/55">
                  {pillar.description}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. WHAT WE DO — 4 ecosystem capability cards
          Subtle bg variation (#0d) separates from §3 (#0f).
          Hover: scale(1.02) + soft glow border.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-b border-white/8 bg-[#0d0d0d] px-6 py-24"
        aria-labelledby="what-heading"
      >
        <div className="mx-auto w-full max-w-6xl">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">What We Do</p>
            <h2
              id="what-heading"
              className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            >
              Execution-Focused Ecosystem
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/50">
              We create structured pathways from curiosity to contribution.
            </p>
          </FadeIn>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {capabilityCards.map((card, i) => (
              <FadeIn
                key={card.title}
                delay={i * 100}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-300 hover:scale-[1.02] hover:border-red-700/50 hover:shadow-[0_0_28px_rgba(139,0,0,0.2)]"
              >
                <card.icon className="h-9 w-9 text-red-500" aria-hidden="true" />
                <h3 className="mt-6 text-xl font-bold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{card.description}</p>
                <Link
                  href={card.href}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-red-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]"
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. ACTIVE INITIATIVES — most important section
          LIVE pulse badge, next date, status chip, hover shimmer.
          Green accent = "this org is active right now."
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-b border-white/8 bg-[#0f0f0f] px-6 py-24"
        aria-labelledby="initiatives-heading"
      >
        <div className="mx-auto w-full max-w-6xl">
          <FadeIn className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                Active Initiatives
              </p>
              <h2
                id="initiatives-heading"
                className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
              >
                Programs Running Right Now
              </h2>
            </div>
            <Link
              href="/initiatives"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
            >
              View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </FadeIn>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {activeInitiatives.map((initiative, i) => (
              <FadeIn
                key={initiative.slug}
                delay={i * 110}
                className="hover-shimmer rounded-2xl border border-green-500/30 bg-white/[0.03] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-green-400/55"
              >
                {/* LIVE badge + next date */}
                <div className="flex items-center justify-between gap-2">
                  <span className="live-pulse inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
                    Live
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/40">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Next: Apr 2026
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-white">{initiative.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{initiative.summary}</p>

                {/* Status + CTA */}
                <div className="mt-7 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/8 px-3 py-1 text-xs font-semibold text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Ongoing
                  </span>
                  <Link
                    href={`/initiatives/${initiative.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. ROADMAP — planned initiatives timeline
          Vertical left-line + dot markers. Feels strategic, not empty.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-b border-white/8 bg-[#0a0a0a] px-6 py-24"
        aria-labelledby="roadmap-heading"
      >
        <div className="mx-auto w-full max-w-6xl">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Roadmap</p>
            <h2
              id="roadmap-heading"
              className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            >
              Planned Initiatives
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/45">Where we are building next.</p>
          </FadeIn>

          <div className="relative mt-14 space-y-8 border-l border-white/10 pl-10">
            {roadmapItems.map((item, i) => (
              <FadeIn
                key={item.name}
                delay={i * 130}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8"
              >
                {/* Timeline dot */}
                <span
                  className="absolute -left-[47px] top-9 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-800/60 bg-[#0a0a0a]"
                  aria-hidden="true"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-red-700" />
                </span>

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-white">{item.name}</h3>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/35">
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    In Development
                  </span>
                </div>

                <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-white/50">
                  {item.description}
                </p>

                <p className="mt-5 inline-flex items-center gap-2 rounded-md border border-red-800/40 bg-red-900/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-red-400">
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  Expected {item.quarter}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. COMMUNITY INVITATION — emotional core
          Slightly warmer bg (#130808). Maximum breathing space.
          Social proof line beneath CTAs.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-b border-white/8 bg-[#130808] px-6 py-32"
        aria-labelledby="community-heading"
      >
        <FadeIn className="mx-auto w-full max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
            Community Invitation
          </p>
          <h2
            id="community-heading"
            className="mt-6 text-5xl font-extrabold leading-tight text-white md:text-6xl"
          >
            Don&apos;t Just Attend.<br />Belong.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/58">
            Build with people who care about impact, integrity, and long-term progress.
            This is where learners, mentors, and builders create meaningful technology
            together — rooted in Western Nepal.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/community"
              className="rounded-lg bg-red-700 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-red-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#130808]"
            >
              Join Community
            </Link>
            <a
              href="https://github.com/Prarambha369/Butwal-Hacks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-8 py-4 text-sm font-bold text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#130808]"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Contribute on GitHub
            </a>
          </div>

          <p className="mt-8 text-sm font-semibold text-white/30">
            200+ builders already part of the network.
          </p>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. LATEST UPDATES — editorial 3-card grid
          Crimson accent line below each card title. Minimal borders.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-b border-white/8 bg-[#0f0f0f] px-6 py-24"
        aria-labelledby="updates-heading"
      >
        <div className="mx-auto w-full max-w-6xl">
          <FadeIn className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Latest Updates</p>
              <h2
                id="updates-heading"
                className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
              >
                From the Community Desk
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
            >
              All Insights <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </FadeIn>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {latestUpdates.map((update, i) => (
              <FadeIn
                key={update.title}
                delay={i * 100}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-white/16"
              >
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
                  {update.category}
                </span>
                <h3 className="mt-5 text-xl font-bold leading-snug text-white">{update.title}</h3>
                {/* Crimson accent underline */}
                <span className="mt-4 block h-px w-10 bg-red-700" aria-hidden="true" />
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-white/50">{update.summary}</p>
                <Link
                  href={update.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
                >
                  Read More <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. GOVERNANCE & TRANSPARENCY — trust teaser
          Nonprofit governance, public docs, transparency reports.
          Three quick-access links + scale icon for institutional feel.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-b border-white/8 bg-[#0d0d0d] px-6 py-20"
        aria-labelledby="governance-heading"
      >
        <FadeIn className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 md:p-12">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-red-500" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                Governance &amp; Transparency
              </p>
            </div>
            <h2
              id="governance-heading"
              className="mt-5 text-3xl font-extrabold leading-tight text-white md:text-4xl"
            >
              Institutionally grounded.<br />Publicly accountable.
            </h2>
            <p className="mt-5 max-w-[64ch] text-sm leading-relaxed text-white/50">
              Butwal Hacks operates with nonprofit governance principles, open documentation, and
              transparent reporting — so members, partners, and supporters can trust how programs
              are designed and delivered.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {[
                { href: "/docs", label: "Constitution", icon: Workflow },
                { href: "/governance", label: "Governance", icon: Scale },
                { href: "/resources", label: "Public Reports", icon: ExternalLink },
              ].map((linkItem) => (
                <Link
                  key={linkItem.label}
                  href={linkItem.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-semibold text-white/60 transition-all duration-300 hover:border-red-700/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]"
                >
                  <linkItem.icon className="h-4 w-4 text-red-500" aria-hidden="true" />
                  {linkItem.label}
                </Link>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          10. FOOTER — clean & structured
          Gradient top divider. 4 nav columns. Attribution line.
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#080808] px-6 pb-10 pt-16" role="contentinfo">
        {/* Gradient divider */}
        <div
          className="mx-auto h-px w-full max-w-6xl"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(139,0,0,0.55) 40%, rgba(220,20,60,0.35) 60%, transparent)",
          }}
          aria-hidden="true"
        />

        <div className="mx-auto mt-12 grid w-full max-w-6xl gap-10 md:grid-cols-5">
          {/* Brand block */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
              aria-label="Butwal Hacks home"
            >
              <Sparkles className="h-5 w-5 text-red-500" aria-hidden="true" />
              Butwal Hacks
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/35">
              A structured, youth-led nonprofit technology movement creating practical pathways for
              builders in Western Nepal.
            </p>
          </div>

          {/* About */}
          <nav aria-label="About navigation">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/30">About</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/about", label: "Who We Are" },
                { href: "/philosophy", label: "Philosophy" },
                { href: "/community", label: "Community" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Programs */}
          <nav aria-label="Programs navigation">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/30">Programs</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/initiatives", label: "Initiatives" },
                { href: "/events", label: "Events" },
                { href: "/docs", label: "Learning Docs" },
                { href: "/support", label: "Volunteer" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Governance */}
          <nav aria-label="Governance navigation">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/30">Governance</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/governance", label: "Governance" },
                { href: "/docs", label: "Constitution" },
                { href: "/resources", label: "Public Reports" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-12 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-xs text-white/25">
          <p>© {new Date().getFullYear()} Butwal Hacks. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/Prarambha369/Butwal-Hacks"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
            >
              GitHub
            </a>
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
            >
              Terms
            </Link>
          </div>
        </div>

        {/* Attribution */}
        <p className="mx-auto mt-4 w-full max-w-6xl text-xs text-white/18">
          A youth-led nonprofit initiative under Nepal Hacks Foundation.
        </p>
      </footer>
    </>
  )
}
