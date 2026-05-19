import Hero from "@/components/hero"
import EventsGrid from "@/components/events-grid"
import Mission from "@/components/mission"
import TrustedBy from "@/components/trusted-by"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Hero />
      <Mission />
      <TrustedBy />
      <EventsGrid />
      <Footer />
    </main>
  )
}
