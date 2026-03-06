import type { Metadata } from "next"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Philosophy",
  description:
    "A manifesto-style document of Butwal Hacks beliefs: youth-led innovation, radical transparency, and community-first technology practice.",
  path: "/philosophy",
})

function HandDrawnUnderline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 18"
      className="pointer-events-none absolute -bottom-2 left-0 h-4 w-full text-primary"
      preserveAspectRatio="none"
    >
      <path
        d="M4 12 C 40 6, 92 17, 176 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HandDrawnArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 140 42"
      className="pointer-events-none mt-2 h-7 w-28 -rotate-3 text-primary"
    >
      <path
        d="M5 24 C 46 8, 90 8, 124 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M118 12 L132 20 L117 27"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PhilosophyPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Philosophy" }]} />

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Butwal Hacks Foundation</p>
        <h1 className="mt-4 text-5xl font-bold font-heading leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Philosophy
        </h1>

        <article className="mt-12 space-y-12">
          <section>
            <h2 className="text-3xl font-bold font-heading leading-tight text-foreground sm:text-4xl">
              We are not building a corporate brand.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              We are building a home for young builders in Butwal and across Nepal who want to learn by doing, ship with friends,
              and solve local problems with technology that feels human.
            </p>
          </section>

          <section>
            <h2 className="text-4xl font-bold font-heading leading-tight text-foreground sm:text-5xl">
              We believe in{" "}
              <span className="relative inline-block text-foreground">
                Youth-led innovation
                <HandDrawnUnderline />
              </span>
            </h2>
            <HandDrawnArrow />
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Not as a slogan, but as an operating rule. Young people are not &ldquo;future contributors.&rdquo; They are contributors now. They deserve
              responsibility, ownership, and room to build in public.
            </p>
          </section>

          <section>
            <h2 className="text-4xl font-bold font-heading leading-tight text-foreground sm:text-5xl">
              We commit to{" "}
              <span className="relative inline-block text-foreground">
                Radical transparency
                <HandDrawnUnderline />
              </span>
            </h2>
            <HandDrawnArrow />
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              We clearly label what is active, what is planned, and what is still a proposal. We do not inflate impact claims. We do not pretend
              roadmaps are reality. Trust is earned by saying what is true, even when it is not impressive.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold font-heading leading-tight text-foreground sm:text-4xl">
              Simplicity is a discipline.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              We choose clarity over noise. We write plainly. We document what we do. We keep our systems understandable so new community members
              can participate without needing permission from gatekeepers.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold font-heading leading-tight text-foreground sm:text-4xl">
              If this page feels raw, that is intentional.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Butwal Hacks is a living community effort. We are learning in public. We are building carefully. We are accountable to the people we
              serve in Butwal, Rupandehi, and beyond.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              This is our manifesto: honest work, open process, and community-first technology.
            </p>
          </section>
        </article>
      </section>
      <Footer />
    </main>
  )
}