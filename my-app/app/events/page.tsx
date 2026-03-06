import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { events } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Events",
  description: "Explore completed and planned Butwal Hacks events with clear status and route-stable slugs.",
  path: "/events",
})

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events" }]} />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">Events</h1>
        <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted-foreground">
          Event entries are maintained on stable URLs and marked clearly as completed or planned.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <article key={event.slug} className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status: {event.status}</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{event.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{event.dateLabel}</p>
              <p className="mt-3 text-sm text-muted-foreground">{event.summary}</p>
              <Link href={`/events/${event.slug}`} className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
                View details
              </Link>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
