"use client"

import CountdownTimer from "./countdown-timer"
import EventRegisterButton from "./event-register-button"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Clock, Users, Code2, Trophy } from "lucide-react"

interface EventData {
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

interface Props {
  event: EventData
}

const timeline = [
  { time: "09:00 AM", title: "Check-in Opens", note: "Participants arrive, get badges, and settle in." },
  { time: "10:00 AM", title: "Opening Session", note: "Kickoff, rules, and orientation for all teams." },
  { time: "11:00 AM", title: "Build Session", note: "Hands-on collaboration, mentoring, and project execution." },
  { time: "04:00 PM", title: "Demo Showcase", note: "Teams present outputs and reflect on learnings." },
]

const faqs = [
  { q: "Who can join this event?", a: "Students and youth participants are welcome unless otherwise stated on registration notes." },
  { q: "Is prior experience required?", a: "No. Events are designed for mixed skill levels with mentoring support." },
  { q: "What should I bring?", a: "Bring your laptop, charger, and basic essentials for a full-day build session." },
]

export default function EventDetailContent({ event }: Props) {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const now = new Date()

  const isUpcoming = startDate >= now
  const isLive = startDate <= now && endDate >= now
  const isPast = endDate < now

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })

  return (
    <main className="min-h-dvh bg-background text-primary">
      {/* ─── Hero Section ─── */}
      <section className="relative px-6 py-24 md:py-32 border-b border-border overflow-hidden">
        {/* Red radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary-red/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-4xl text-center space-y-8 relative">
          {/* Status badge */}
          <div className="flex items-center justify-center gap-3">
            {isLive ? (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-red/10 text-primary-red text-xs font-bold border border-primary-red/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bh-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-bh-red-500" />
                </span>
                Live Now
              </span>
            ) : isUpcoming ? (
              <span className="px-4 py-1.5 rounded-full bg-primary-red/5 text-primary-red/70 text-xs font-bold border border-primary-red/10">
                Upcoming
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-surface-hover text-muted-foreground text-xs font-bold">
                Completed
              </span>
            )}
            {isUpcoming && !isLive && (
              <div className="px-4 py-1.5 rounded-full bg-surface-hover border border-border text-xs font-mono text-primary-red">
                Starts in <CountdownTimer targetDate={event.start_date} />
              </div>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">{event.title}</h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {event.description}
          </p>

          {/* Date/location row */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-mono text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-red" />
              {formatDate(startDate)}
              {!endDate.toDateString().startsWith(startDate.toDateString()) && (
                <> — {formatDate(endDate)}</>
              )}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-red" />
              {formatTime(startDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-red" />
                {event.location}
              </span>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {isUpcoming && !isPast && (
              <EventRegisterButton eventId={event.id} eventSlug={event.slug} />
            )}
            {isPast && (
              <Link
                href={`/events/${event.slug}/projects`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-bh-red-600 hover:bg-primary-red text-white font-bold text-sm transition-all group"
              >
                <Code2 className="w-5 h-5" />
                View Projects
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {/* Past events: link to projects */}
          {!isUpcoming && (
            <div className="pt-2">
              <Link
                href={`/events/${event.slug}/projects`}
                className="inline-flex items-center gap-2 text-sm text-primary-red hover:text-primary-red font-bold transition-colors"
              >
                Browse submitted projects
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Quick Stats ─── */}
      <section className="px-6 py-16 border-b border-border">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: "Date", value: formatDate(startDate) },
              { icon: MapPin, label: "Location", value: event.location || "Virtual / TBD" },
              { icon: Users, label: "Capacity", value: "Open to all" },
              { icon: Trophy, label: "Status", value: isLive ? "Live" : isUpcoming ? "Upcoming" : "Completed" },
            ].map((item) => (
              <div key={item.label} className="bh-card p-4 text-center space-y-1">
                <item.icon className="w-4 h-4 mx-auto text-primary-red" />
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{item.label}</div>
                <div className="text-sm font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Timeline ─── */}
      <section className="px-6 py-16 border-b border-border">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary-red" />
            Timeline
          </h2>
          <div className="space-y-6">
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-24 shrink-0 pt-1">
                  <span className="text-sm font-mono text-primary-red">{item.time}</span>
                </div>
                <div className="flex-1 pb-6 border-l border-border pl-6 relative">
                  <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-bh-red-500" />
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bh-card p-6">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
