import type { Metadata } from "next"
import { createClient } from "@/utils/supabase/server"
import { buildPageMetadata } from "@/lib/seo"
import Breadcrumbs from "@/components/breadcrumbs"
import EventsFilter from "@/components/events/events-filter"
import type { EventItem } from "@/components/events/events-filter"
import { CalendarDays } from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "Events",
  description: "Explore completed and planned Butwal Hacks events with clear status and route-stable slugs.",
  path: "/events",
})

export default async function EventsPage() {
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

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-lg bg-primary-red/10">
            <CalendarDays className="w-6 h-6 text-primary-red" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight text-primary sm:text-6xl">Events</h1>
            <p className="mt-2 text-muted-foreground">
              Explore our events and programs. Join us for workshops, hackathons, and community gatherings.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <EventsFilter events={events} />
        </div>
      </section>
    </main>
  )
}
