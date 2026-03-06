import type { Metadata } from "next"
import EventExperiencePage from "@/components/event-experience-page"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Daydream Butwal - September 2024",
  description: "A 24-hour game jam for high school students in Butwal, Nepal. Part of Hack Club's global Daydream event across 100 cities.",
  path: "/events/daydream-butwal-september-2024",
})

export default function DaydreamButwalEventPage() {
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Daydream Butwal - September 2024",
    description: "A 24-hour game jam for high school students organized by Butwal Hacks in partnership with Hack Club.",
    startDate: "2024-09-27T11:00:00+05:45",
    endDate: "2024-09-28T12:00:00+05:45",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Synth Bit Group Pvt Ltd",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Butwal",
        addressCountry: "NP",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Butwal Hacks",
      url: "https://butwalhacks.com",
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <EventExperiencePage
        title="Daydream Butwal - September 2024"
        status="completed"
        dateLabel="September 27-28, 2024"
        summary="A 24-hour game jam for high school students organized by Butwal Hacks in partnership with Hack Club. Participants built games, attended workshops, and showcased their creations."
        initiativeLabel="GameJam"
        initiativeHref="/initiatives/gamejam"
        venue="Synth Bit Group Pvt Ltd"
        locationLabel="Butwal, Nepal"
        prizeLabel="$1,000+ in gear and community awards"
        heroTag="Live Jam Format · Youth-Led"
        timeline={[
          { time: "11:00 AM", title: "Doors Open", note: "Registration, onboarding, and team alignment." },
          { time: "12:00 PM", title: "Opening Ceremony", note: "Kickoff, expectations, and challenge framing." },
          { time: "01:00 PM", title: "Hacking Starts", note: "Build window with mentor checkpoints." },
          { time: "10:30 AM (Day 2)", title: "Demo Showcase", note: "Teams present games and learning outcomes." },
        ]}
        team={[
          { name: "Nitesh S.", role: "Program Lead" },
          { name: "Aarati K.", role: "Design Mentor" },
          { name: "Binod T.", role: "Operations" },
          { name: "Sushmita M.", role: "Community" },
        ]}
        faqs={[
          { q: "Who can join this event?", a: "High-school and upper-middle-school aged students were welcome." },
          { q: "Is this event free?", a: "Yes, event participation and basic support were provided without fees." },
          { q: "Do I need a team beforehand?", a: "No. Team formation support was available during kickoff." },
        ]}
      />
    </>
  )
}
