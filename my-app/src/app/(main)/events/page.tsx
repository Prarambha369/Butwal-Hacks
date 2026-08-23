import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/utils/supabase"

// Fetches events from Supabase + checks Auth0 session at request time.
export const dynamic = "force-dynamic";
import { buildPageMetadata } from "@/lib/seo"
import { auth0 } from "@/lib/auth0"
import { APP_URL } from "@/lib/constants"
import Breadcrumbs from "@/components/breadcrumbs"
import EventsFilter from "@/components/events/events-filter"
import type { EventItem } from "@/components/events/events-filter"
import { ArrowRight, CalendarDays } from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "Events",
  description: "Browse upcoming and past hackathons, workshops, and community gatherings at Butwal Hacks.",
  path: "/events",
})

export default async function EventsPage() {
  const session = await auth0.getSession();
  const isSignedIn = !!session?.user;

  const supabase = createClient()

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
                  <Link
                    href="/events/list"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all active:scale-95"
                  >
                    Browse All Events
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
                  <Link
                    href="/events/list"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all active:scale-95"
                  >
                    Browse All Events
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
      </section>
    </main>
  )
}
