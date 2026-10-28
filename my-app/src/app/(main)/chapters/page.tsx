import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import Breadcrumbs from "@/components/breadcrumbs"
import { ComingSoon } from "@/components/ui/coming-soon"

// Kept at 300s so the route stays ISR-cacheable; the page has no data yet.
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Chapters — Butwal Hacks",
  description:
    "Butwal Hacks school chapters are being set up across Lumbini Province. The chapter directory and application flow are still being built.",
  path: "/chapters",
  keywords: [
    "Butwal Hacks school chapters",
    "school coding clubs Nepal",
    "student tech clubs Lumbini",
  ],
})

export default function ChaptersPage() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Chapters" }]} />
        <div className="mt-8">
          <ComingSoon
            eyebrow="Programs"
            title="Chapters are being set up"
            description="School chapters are the local arm of Butwal Hacks: a student club, a faculty advisor, and a shared calendar. We are still writing the structure, so there is no directory to browse yet."
            planned={[
              "A public chapter directory with each school, city, and club lead.",
              "A chapter application flow that a teacher or student can start.",
              "Per-chapter event calendars and shared resources.",
              "A governing agreement covering safeguarding and school approval.",
            ]}
            status="Directory and application flow: not open yet."
            mascot="reading"
            primary={{ label: "See upcoming events", href: "/events" }}
            secondary={{ label: "Get involved", href: "/support#opportunities" }}
          />
        </div>
      </section>
    </main>
  )
}
