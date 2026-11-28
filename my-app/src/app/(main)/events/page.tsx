import type { Metadata } from "next"
import Link from "next/link"
import { createServiceClient } from "@/utils/supabase"

// ISR: the list is the same for every visitor. Publishing, editing or
// deleting an event calls revalidatePath("/events") (lib/actions/events.ts),
// so changes show immediately; the 5-minute timer keeps the upcoming/past
// split current as dates pass. The signed-in CTA is a client component.
export const revalidate = 300;
import { buildPageMetadata } from "@/lib/seo"
import { SITE_URL } from "@/lib/constants"
import { initiatives } from "@/lib/content"
import { logger } from "@/lib/logger"
import { degradeOnReadError } from "@/lib/build-phase"
import { partitionEvents } from "@/lib/event-status"
import { resolveEventBanner } from "@/lib/event-share-banners"
import Breadcrumbs from "@/components/breadcrumbs"
import { EventCard, FeaturedEventCard } from "@/components/events/event-card"
import { PastEvents } from "@/components/events/past-events"
import { EventsHeaderCta } from "@/components/events/events-header-cta"
import type { PublicEvent } from "@/components/events/event-types"
import { Ballu } from "@/components/mascot/ballu"
import { ArrowRight, CalendarPlus, FlaskConical } from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "Upcoming Hackathons in Butwal, Nepal",
  description:
    "Looking for the next upcoming hackathon in Butwal? Butwal Hacks lists free hackathons for students in Nepal — beginner-friendly events across Lumbini Province with no registration fee.",
  path: "/events",
})

// A webcal:// link makes calendar apps subscribe (and poll for new events)
// instead of saving a one-time snapshot of the feed.
const CALENDAR_SUBSCRIBE_URL = `${SITE_URL.replace(/^https?:\/\//, "webcal://")}/api/events/ical`

export default async function EventsPage() {
  const supabase = createServiceClient()

  // Published events only, filtered in the query. The list used to fetch
  // drafts too and hide them in the browser, which shipped unpublished
  // titles and descriptions to every visitor.
  const { data: dbEvents, error } = await supabase
    .from("events")
    .select("id, title, slug, description, start_date, end_date, location, banner_url")
    .eq("is_published", true)
    .order("start_date", { ascending: false })
  if (error) {
    logger.error("Error fetching events:", error)
    // At runtime a failed read must not be cached as "no events": throwing
    // keeps the last good ISR page and retries on the next request. During
    // the build and in dev, render the empty list (see degradeOnReadError).
    if (!degradeOnReadError()) throw new Error("Events could not be loaded")
  }

  const events: PublicEvent[] = (dbEvents || [])
    .filter((e) => Boolean(e.slug))
    .map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug as string,
      description: e.description,
      start_date: e.start_date,
      end_date: e.end_date,
      location: e.location,
      banner_url: resolveEventBanner(e.slug, e.banner_url),
    }))

  // The server's clock decides upcoming vs past at render time, and `now` is
  // passed down so the client renders the same split (no hydration flash).
  // With ISR the render is at most `revalidate` seconds old.
  // eslint-disable-next-line react-hooks/purity -- server render, revalidated every 5 min
  const now = Date.now()
  const { featured, upcoming, past } = partitionEvents(events, now)

  return (
    <div className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:pt-14 sm:pb-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events" }]} />

        <header className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h1 className="text-5xl font-extrabold tracking-[-0.035em] text-text-primary sm:text-6xl">
              Events
            </h1>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-text-body sm:text-lg">
              Butwal Hacks runs upcoming free student hackathons, workshops, and meetups in Butwal,
              Lumbini Province, Nepal — each open to beginners with no registration fee. Every
              published event, with its date, venue, and registration link, is listed below; open
              one to see the full schedule and sign up.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <EventsHeaderCta />
            <a href={CALENDAR_SUBSCRIBE_URL} className="bh-btn-ghost text-sm">
              <CalendarPlus aria-hidden="true" className="h-4 w-4" /> Subscribe to calendar
            </a>
          </div>
        </header>

        <section aria-labelledby="upcoming-heading" className="mt-12">
          <h2 id="upcoming-heading" className="sr-only">Upcoming events</h2>
          {featured ? (
            <div className="space-y-10">
              <FeaturedEventCard event={featured} now={now} />
              {upcoming.length > 0 && (
                <div>
                  <h3 className="mb-5 text-xl font-bold tracking-[-0.015em] text-text-primary">
                    Also coming up
                  </h3>
                  <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((event) => (
                      <li key={event.id} className="flex">
                        <EventCard event={event} now={now} headingLevel={4} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <Ballu emotion="question" size={64} />
              <p className="text-xl font-bold text-text-primary">No upcoming events right now</p>
              <p className="max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                The next hackathon is being planned. Subscribe to the calendar and it will appear
                there the moment it is published.
              </p>
              <a href={CALENDAR_SUBSCRIBE_URL} className="bh-btn-primary text-sm">
                <CalendarPlus aria-hidden="true" className="h-4 w-4" /> Subscribe to calendar
              </a>
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section aria-labelledby="past-heading" className="mt-16 border-t border-border pt-12">
            <div className="mb-6 flex items-baseline justify-between gap-3">
              <h2 id="past-heading" className="text-2xl font-extrabold tracking-[-0.02em] text-text-primary">
                Past events
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                {past.length} {past.length === 1 ? "event" : "events"}
              </p>
            </div>
            <PastEvents events={past} now={now} />
          </section>
        )}

        {/* Ongoing initiatives — a secondary section, deliberately placed
            after the event list so the calendar leads. Detail pages live at
            /initiatives/[slug]; the old list route was retired. */}
        <div id="initiatives" className="mt-20 scroll-mt-24 border-t border-border pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-status-blue">
                <FlaskConical className="h-3 w-3" aria-hidden="true" />
                Programs
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-primary">
                Ongoing Initiatives
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                The recurring formats we run. Each is labelled with its real status.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {initiatives.map((initiative) => (
              <Link
                key={initiative.slug}
                href={`/initiatives/${initiative.slug}`}
                prefetch={false}
                className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary-red/40"
              >
                <span className="w-fit rounded-full bg-status-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-status-blue">
                  {initiative.status}
                </span>
                <h3 className="mt-3 text-base font-bold text-primary">{initiative.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-secondary">
                  {initiative.summary}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary-red">
                  Initiative page
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
