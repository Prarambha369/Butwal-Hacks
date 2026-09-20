import type { Metadata } from "next"

import Breadcrumbs from "@/components/breadcrumbs"
import LiveStatsCounter from "@/components/home/live-stats-counter"
import { buildPageMetadata } from "@/lib/seo"

export const dynamic = "force-static";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description:
    "Learn about Butwal Hacks, a nonprofit initiative focused on practical technology learning and community mentorship.",
  path: "/about",
})

function CrispUnderline() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-1.5 left-0 h-[3px] w-full rounded-full bg-primary-red"
    />
  )
}

const beliefs = [
  {
    title: "We are not building a corporate brand.",
    body: "We are building a home for young builders in Butwal and across Nepal who want to learn by doing, ship with friends, and solve local problems with technology that feels human.",
  },
  {
    title: "Youth-led innovation",
    body: "Not as a slogan, but as an operating rule. Young people are not \u201Cfuture contributors.\u201D They are contributors now. They deserve responsibility, ownership, and room to build in public.",
    underline: true,
    prefix: "We believe in",
  },
  {
    title: "Radical transparency",
    body: "We clearly label what is active, what is planned, and what is still a proposal. We do not inflate impact claims. We do not pretend roadmaps are reality. Trust is earned by saying what is true, even when it is not impressive.",
    underline: true,
    prefix: "We commit to",
  },
  {
    title: "Simplicity is a discipline.",
    body: "We choose clarity over noise. We write plainly. We document what we do. We keep our systems understandable so new community members can participate without needing permission from gatekeepers.",
  },
  {
    title: "If this feels raw, that is intentional.",
    body: "Butwal Hacks is a living community effort. We are learning in public. We are building carefully. We are accountable to the people we serve in Butwal, Rupandehi, and beyond. Honest work, open process, community-first technology.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-background">

      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">About Butwal Hacks</h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground">
          We run free hackathons, workshops, and project-based learning programs for students across Lumbini Province, Nepal.
          No fees. No experience required. Just people who show up to build.
        </p>
        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-primary">Mission</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Give every young technologist in Nepal a way to prove what they can build: a verified identity, a portfolio they own, and a community that shows up.
        </p>
        <h2 className="mt-8 text-2xl sm:text-3xl font-bold font-heading text-primary">How we work</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span><strong className="text-primary">Student-run.</strong> We organize events, not the other way around. Students lead, build, and teach.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span><strong className="text-primary">Community-funded.</strong> Every rupee is tracked on Open Collective. No administrative salaries. All funds go to programs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span><strong className="text-primary">Build-first.</strong> We ship projects, not slide decks. Every event ends with something real you can show.</span>
          </li>
        </ul>
        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-primary">Transparency</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Our finances are public on Open Collective. Our code is open-source on GitHub.
          How we think about honesty is written down in our <a href="#philosophy" className="font-semibold text-primary underline underline-offset-4 hover:text-primary-red">philosophy</a> below.
        </p>
      </section>

      {/* Philosophy — merged from /philosophy: the definition of us.
          Airier than the old manifesto wall: numbered beliefs, one
          underline motif, no arrows. */}
      <section id="philosophy" aria-labelledby="philosophy-heading" className="border-y border-border bg-surface scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary-red">Our philosophy</p>
          <h2 id="philosophy-heading" className="mt-4 text-3xl sm:text-4xl font-bold font-heading tracking-tight text-primary">
            The definition of us
          </h2>
          <ol className="mt-10 space-y-10">
            {beliefs.map((b, i) => (
              <li key={b.title} className="flex gap-4 sm:gap-5">
                <span aria-hidden="true" className="font-mono text-sm font-bold text-primary-red/60 pt-1.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold font-heading leading-tight text-primary">
                    {b.prefix ? (
                      <>{b.prefix}{" "}
                        <span className="relative inline-block">
                          {b.title}
                          <CrispUnderline />
                        </span>
                      </>
                    ) : (
                      b.title
                    )}
                  </h3>
                  <p className="mt-3 leading-relaxed text-secondary">
                    {b.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Live platform metrics from the database */}
      <LiveStatsCounter />

    </main>
  )
}
