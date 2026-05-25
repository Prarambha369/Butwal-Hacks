import type { Metadata } from "next"
import { notFound } from "next/navigation"

import EventExperiencePage from "@/components/event-experience-page"
import { events, getEventBySlug, getInitiativeBySlug } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"

type EventDetailPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }))
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = getEventBySlug(slug)

  if (!event) {
    return buildPageMetadata({
      title: "Event Not Found",
      description: "The requested event page could not be found.",
      path: `/events/${slug}`,
    })
  }

  return buildPageMetadata({
    title: event.title,
    description: `${event.summary} Status: ${event.status}.`,
    path: `/events/${event.slug}`,
  })
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const event = getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const initiative = getInitiativeBySlug(event.initiativeSlug)
  const initiativeName = initiative?.name ?? "Initiative"

  const timeline = [
    { time: "09:00 AM", title: "Check-in Opens", note: "Participants arrive, get badges, and settle in." },
    { time: "10:00 AM", title: "Opening Session", note: "Kickoff, rules, and orientation for all teams." },
    { time: "11:00 AM", title: "Build Session", note: "Hands-on collaboration, mentoring, and project execution." },
    { time: "04:00 PM", title: "Demo Showcase", note: "Teams present outputs and reflect on learnings." },
  ]

  const team = [
    { name: "Program Lead", role: "Coordination" },
    { name: "Tech Mentor", role: "Engineering" },
    { name: "Design Mentor", role: "Product & UX" },
    { name: "Volunteer Crew", role: "Operations" },
  ]

  const faqs = [
    { q: "Who can join this event?", a: "Students and youth participants are welcome unless otherwise stated on registration notes." },
    { q: "Is prior experience required?", a: "No. Events are designed for mixed skill levels with mentoring support." },
    { q: "What should I bring?", a: "Bring your laptop, charger, and basic essentials for a full-day build session." },
  ]

  return (
    <EventExperiencePage
      title={event.title}
      status={event.status}
      dateLabel={event.dateLabel}
      summary={event.summary}
      initiativeLabel={initiativeName}
      initiativeHref={`/initiatives/${event.initiativeSlug}`}
      venue="Community Venue"
      locationLabel="Butwal, Nepal"
      prizeLabel="Community awards and partner recognition"
      heroTag={`${statusLabel(event.status)} · ${initiativeName}`}
      timeline={timeline}
      team={team}
      faqs={faqs}
    />
  )
}

function statusLabel(status: "completed" | "planned") {
  return status === "completed" ? "Completed" : "Planned"
}
