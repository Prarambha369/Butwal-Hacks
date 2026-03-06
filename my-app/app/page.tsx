import type { Metadata } from "next"
import SiteHeader from "@/components/site-header"
import DesktopLanding from "@/components/home/desktop-landing"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Home",
  description:
    "Butwal Hacks is a nonprofit tech community in Butwal, Nepal focused on hackathons, learning, mentorship, and youth innovation support.",
  path: "/",
})

export default function Home() {
  /**
   * JSON-LD structured data — Phase 5 SEO.
   * Uses NGO + Organization types for maximum Google Rich Result eligibility.
   * Includes sameAs social profiles for entity disambiguation.
   */
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["NGO", "Organization"],
        "@id": "https://butwalhacks.com/#organization",
        name: "Butwal Hacks",
        alternateName: "Butwal Hacks Foundation",
        url: "https://butwalhacks.com",
        logo: "https://butwalhacks.com/logo.png",
        description:
          "A nonprofit technology community focused on practical learning, mentorship, hackathons, and collaborative innovation in Butwal, Rupandehi and Western Nepal.",
        foundingDate: "2023",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Butwal",
          addressRegion: "Lumbini Province",
          addressCountry: "NP",
        },
        email: "hello@butwalhacks.com",
        sameAs: [
          "https://github.com/Prarambha369/Butwal-Hacks",
        ],
        knowsAbout: [
          "hackathons",
          "youth technology education",
          "mentorship",
          "open source",
          "innovation",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://butwalhacks.com/#website",
        url: "https://butwalhacks.com",
        name: "Butwal Hacks",
        publisher: { "@id": "https://butwalhacks.com/#organization" },
        inLanguage: "en",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <SiteHeader />
      <DesktopLanding />
    </main>
  )
}
