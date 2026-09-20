import type { Metadata } from "next"
import Link from "next/link"
import { createServiceClient } from "@/utils/supabase"

// Fetches events from Supabase + checks Auth0 session at request time.
export const dynamic = "force-dynamic";
import { buildPageMetadata } from "@/lib/seo"
import { auth0 } from "@/lib/auth0"
import { APP_URL } from "@/lib/constants"
import { initiatives } from "@/lib/content"
import Breadcrumbs from "@/components/breadcrumbs"
import EventsFilter from "@/components/events/events-filter"
import type { EventItem } from "@/components/events/events-filter"
import { ArrowRight, CalendarDays, FlaskConical } from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "Events",
  description: "Free hackathons, workshops, and meetups in Butwal and across Nepal. Come build something.",
  path: "/events",
})

export default async function EventsPage() {
  const session = await auth0.getSession();
  const isSignedIn = !!session?.user;

  const supabase = createServiceClient()

  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, description, start_date, end_date, location, banner_url, is_published")
    .order("start_date", { ascending: false })

  const events: EventItem[] = (dbEvents || []).map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug || "",
    description: e.description,
    start_date: e.start_date,
    end_date: e.end_date,
    location: e.location,
    banner_url: e.banner_url,
    is_published: e.is_published,
  }))

  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events" }]} />

        <div className="flex items-start gap-4 mb-2">
          <div className="p-3 rounded-lg bg-primary-red/10 shrink-0">
            <CalendarDays className="w-6 h-6 text-primary-red" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight text-primary sm:text-6xl">Events</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Explore our events and programs. Join us for workshops, hackathons, and community gatherings.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {isSignedIn ? (
                <>
                  <Link
                    href={`${APP_URL}/dashboard/hacker`}
                    className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
                  >
                    Your Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="/api/events/ical"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all active:scale-95"
                  >
                    Sync Calendar <CalendarDays className="w-4 h-4" />
                  </a>
                </>
              ) : (
                <>
                  <Link
                    href={`${APP_URL}/auth/login?screen_hint=signup`}
                    className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
                  >
                    Join an Event <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="/api/events/ical"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all active:scale-95"
                  >
                    Sync Calendar <CalendarDays className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <EventsFilter events={events} />
        </div>

        {/* Ongoing initiatives — migrated from /initiatives (list retired,
            detail pages live on at /initiatives/[slug]). */}
        <div id="initiatives" className="mt-16 scroll-mt-24">
          <div className="flex items-start gap-4 mb-2">
            <div className="p-3 rounded-lg bg-status-blue/10 shrink-0">
              <FlaskConical className="w-6 h-6 text-status-blue" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-primary">Ongoing Initiatives</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Programs we run, plan, and dream up — each labeled honestly by status.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {initiatives.map((initiative) => (
              <article key={initiative.slug} className="rounded-xl border border-border bg-surface p-6">
                <p className="text-xs uppercase tracking-wide text-secondary">Status: {initiative.status}</p>
                <h3 className="mt-2 text-xl font-semibold text-primary">{initiative.name}</h3>
                <p className="mt-2 text-sm text-secondary">{initiative.summary}</p>
                <Link href={`/initiatives/${initiative.slug}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                  View initiative page
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
