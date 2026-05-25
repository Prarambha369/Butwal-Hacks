import EventsGrid from "@/components/events-grid"
import Hero from "@/components/hero"
import Mission from "@/components/mission"
import TrustedBy from "@/components/trusted-by"

export default function ComingSoonSection() {
  return (
    <section className="bg-background">
      <Hero />
      <Mission />

      <section className="border-y border-border px-4 py-12 sm:py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TrustedBy />
          <EventsGrid />
        </div>
      </section>
    </section>
  )
}
