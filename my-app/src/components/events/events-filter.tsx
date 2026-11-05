"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { formatDualDate } from "@/lib/nepali-date"
import { Ballu } from "@/components/mascot/ballu"
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

  // `new Date()` at render time differs between the server (UTC) and the
  // client (Asia/Kathmandu). Compute "now" only after mount so the
  // upcoming/past split matches between SSR and hydration.
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
  }, [])

  const upcoming: EventItem[] = []
  const past: EventItem[] = []
  for (const e of events) {
    if (!e.is_published) continue
    if (now === null || new Date(e.start_date).getTime() >= now) upcoming.push(e)
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
              ? "bg-bh-red-action text-white"
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
              ? "bg-bh-red-action text-white"
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
          <div className="flex justify-center">
            <Ballu emotion="question" size={64} />
          </div>
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
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
  }, [])
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const isLive =
    filter === "upcoming" &&
    now !== null &&
    startDate.getTime() <= now &&
    endDate.getTime() >= now

  const formatDate = (d: Date) => formatDualDate(d)
  const durationDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  const hasBanner = Boolean(event.banner_url && event.banner_url.trim().length > 0)

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-primary-red/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-red/5">
      {/* Banner strip — Devpost-style visual lead */}
      {hasBanner ? (
        <div className="relative overflow-hidden aspect-[16/9]">
          <Image
            src={event.banner_url!}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-background/10" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-xl font-black leading-tight text-primary group-hover:text-primary-red transition-colors">
              {event.title}
            </h2>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden aspect-[16/9] flex items-center justify-center bg-primary-red/5 p-4">
          <h2 className="text-xl font-black leading-tight text-primary text-center group-hover:text-primary-red transition-colors">
            {event.title}
          </h2>
        </div>
      )}

      {/* Body */}
      <div className="p-5 space-y-3">
        {/* Badge + countdown row */}
        <div className="flex items-center gap-2 flex-wrap">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/10 text-primary-red text-[10px] font-bold border border-primary-red/20">
              <span className="inline-flex rounded-full h-1.5 w-1.5 bg-bh-red-500" />
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

          {filter === "upcoming" && !isLive && (
            <CountdownTimer targetDate={event.start_date} />
          )}

          {durationDays > 0 && (
            <span className="px-3 py-1 rounded-full bg-surface-hover text-muted-foreground text-[10px] font-bold">
              {durationDays}d
            </span>
          )}
        </div>

        {/* Plain-text meta facts. Kept as real text so answer engines can quote
            Free / location / date directly off the card. */}
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <span>Free</span>
          <span aria-hidden="true">·</span>
          {event.location && (
            <>
              <span>{event.location}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={event.start_date}>{formatDate(startDate)}</time>
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {event.description}
        </p>

        <div className="mt-2 flex justify-start">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-5 py-2 text-sm font-bold text-white hover:bg-deep-red transition-all group/link"
          >
            View details
            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}
