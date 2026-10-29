import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumbs from "@/components/breadcrumbs"
import { buildPageMetadata } from "@/lib/seo"

export const dynamic = "force-static";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Join a Hackathon in Nepal",
  description:
    "You can join a hackathon in Nepal in three steps: pick an upcoming free student hackathon in Butwal, register online, and show up. No registration fee and no coding experience required.",
  path: "/join",
})

export default function JoinPage() {
  const lastUpdated = "2026-10-29";

  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Join" }]} />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">How to Join a Hackathon in Nepal</h1>
        <p className="mt-2 text-xs font-mono text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground">
          Yes — beginners are welcome. Butwal Hacks hackathons in Butwal, Lumbini Province, Nepal are free to attend, with no registration fee and no prior coding experience needed. Registering means picking an event on our <Link href="/events" className="font-semibold text-primary underline underline-offset-4 hover:text-primary-red">events page</Link> and following its registration link — mentors are on site to help you through your first build.
        </p>

        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-primary">How to join, step by step</h2>
        <ol className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
          <li>
            <strong className="text-primary">1. Pick an upcoming event.</strong> The <Link href="/events" className="font-semibold text-primary underline underline-offset-4 hover:text-primary-red">events page</Link> lists each announced hackathon with its date, location, and free admission. Open an event for full details.
          </li>
          <li>
            <strong className="text-primary">2. Register.</strong> Follow the registration button on that event page. Registration is free; you&apos;ll get the schedule and venue details there.
          </li>
          <li>
            <strong className="text-primary">3. Show up and build.</strong> Bring what you need (see the list below). You can come alone or with a team — with no experience required, mentors help you get started and find teammates during the event.
          </li>
        </ol>

        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-primary">Is it really free for beginners?</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Yes — free for everyone, not only beginners. There is no registration fee, and the essentials
          are provided: venue, internet, mentorship, and food. No prior experience is required either;
          events are designed for mixed skill levels. Butwal Hacks is community-funded, so the events pay
          for themselves through public donations rather than participant fees.
        </p>

        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-primary">What to bring to your first hackathon</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span>Your laptop, charger, and basic essentials for a full-day build session.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span>Anything else you want to use — some builders bring hardware or boards they know.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            <span>No startup ideas or codebase needed. A blank project on day one is completely fine.</span>
          </li>
        </ul>

        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-primary">How to find a team</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Come solo or with friends — both are normal. Team matching happens when you register and again
          on event day, pairing participants by skills and interests so lone builders find teammates. After
          you register and sign in, your dashboard also includes a team matching tool, so you can connect
          with other registered participants before you arrive.
        </p>

        <p className="mt-10 text-muted-foreground leading-relaxed">
          Want a longer walkthrough? Read the full guide:
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/guides/how-to-join-a-hackathon-in-nepal"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all active:scale-95"
          >
            How to join a hackathon in Nepal — full guide
          </Link>
          <Link
            href="/learn"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all active:scale-95"
          >
            Learn with Butwal Hacks
          </Link>
          <Link
            href="/events"
            className="rounded-full bg-bh-red-action px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
          >
            Browse upcoming events
          </Link>
        </div>
      </section>
    </main>
  )
}
