"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin } from "lucide-react"
import CountdownTimer from "./countdown-timer"

export interface EventItem {
  id: string
  title: string
  slug: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  banner_url: string | null
  is_published: boolean
}

type FilterMode = "upcoming" | "past"

export default function EventsFilter({ events }: { events: EventItem[] }) {
  const [filter, setFilter] = useState<FilterMode>("upcoming")

  const now = new Date()

  const upcoming: EventItem[] = []
  const past: EventItem[] = []
  for (const e of events) {
    if (!e.is_published) continue
    if (new Date(e.start_date) >= now) upcoming.push(e)
    else past.push(e)
  }
  upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  past.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  const displayed = filter === "upcoming" ? upcoming : past

  return (
    <div className="space-y-8">
      {/* Filter Toggle */}
      <div className="inline-flex rounded-lg border border-border bg-surface-hover p-1">
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            filter === "upcoming"
              ? "bg-bh-red-500 text-white"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          Upcoming
          {upcoming.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary-red/10 text-[10px]">
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("past")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            filter === "past"
              ? "bg-bh-red-500 text-white"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          Past
          {past.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary-red/10 text-[10px]">
              {past.length}
            </span>
          )}
        </button>
      </div>

      {/* Grid */}
      {displayed.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {displayed.map((event) => (
            <EventCard key={event.id} event={event} filter={filter} />
          ))}
        </div>
      ) : (
        <div className="bh-card p-16 text-center space-y-4">
          <Calendar size={48} className="mx-auto opacity-20" />
          <p className="text-xl font-bold text-primary">No {filter} events</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            {filter === "upcoming"
              ? "Check back soon for upcoming events and hackathons."
              : "No past events yet — we're just getting started!"}
          </p>
        </div>
      )}
    </div>
  )
}

function EventCard({ event, filter }: { event: EventItem; filter: FilterMode }) {
  const [now] = useState(() => Date.now())
  const startDate = new Date(event.start_date)
  const isLive =
    filter === "upcoming" &&
    startDate.getTime() <= now &&
    new Date(event.end_date).getTime() >= now

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  return (
    <article className="group bh-card p-7 transition-all hover:border-primary-red/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-red/5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          {/* Badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/10 text-primary-red text-[10px] font-bold border border-primary-red/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bh-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-bh-red-500" />
                </span>
                Live
              </span>
            ) : filter === "upcoming" ? (
              <span className="px-3 py-1 rounded-full bg-primary-red/5 text-primary-red/70 text-[10px] font-bold border border-primary-red/10">
                Upcoming
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-surface-hover text-muted-foreground text-[10px] font-bold">
                Completed
              </span>
            )}

            {/* Countdown for upcoming */}
            {filter === "upcoming" && !isLive && (
              <CountdownTimer targetDate={event.start_date} />
            )}
          </div>

          <h2 className="text-2xl font-bold text-primary group-hover:text-primary-red transition-colors">
            {event.title}
          </h2>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatDate(startDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {event.description}
          </p>
        </div>
      </div>

      <Link
        href={`/events/${event.slug}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-red hover:text-primary-red transition-colors group/link"
      >
        View details
        <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
      </Link>
    </article>
  )
}
