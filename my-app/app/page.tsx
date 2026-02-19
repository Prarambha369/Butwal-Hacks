import Hero from "@/components/hero"
import EventsGrid from "@/components/events-grid"
import Mission from "@/components/mission"
import TrustedBy from "@/components/trusted-by"
import Footer from "@/components/footer"

export default function Home() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: "Butwal Hacks",
    url: "https://butwalhacks.com",
    logo: "https://butwalhacks.com/logo.png",
    description:
      "A non-profit initiative empowering youth in Butwal and Rupandehi to foster a thriving regional hub for technology and collaboration.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Butwal",
      addressRegion: "Lumbini Province",
      addressCountry: "NP",
    },
    sameAs: ["https://butwalhacks.com"],
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Hero />
      <Mission />
      <TrustedBy />
      <EventsGrid />
      <Footer />
    </main>
  )
}
