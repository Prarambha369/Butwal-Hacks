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
          Give every young technologist in Nepal a way to prove what they can build — a verified identity, a portfolio they own, and a community that shows up.
        </p>
        <h2 className="mt-8 text-2xl sm:text-3xl font-bold font-heading text-primary">How we work</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span><strong className="text-primary">Student-run.</strong> We organize events, not the other way around. Students lead, build, and teach.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span><strong className="text-primary">Community-funded.</strong> Every rupee is tracked on Open Collective. No administrative salaries — all funds go to programs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span><strong className="text-primary">Build-first.</strong> We ship projects, not slide decks. Every event ends with something real you can show.</span>
          </li>
        </ul>
        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-primary">Transparency</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Every initiative on this site is labeled by status — active, planned, or proposed. We don&apos;t inflate claims or pretend roadmaps are reality.
          Our finances are public on Open Collective. Our code is open-source on GitHub. Trust is earned by telling the truth, even when it&apos;s not impressive.
        </p>
      </section>

      {/* Live platform metrics from the database */}
      <LiveStatsCounter />
      
    </main>
  )
}
