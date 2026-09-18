export const dynamic = "force-static";

import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import { MemberDirectory } from "@/components/member-directory"
import { TestimonialsSection } from "@/components/testimonials"
import TestimonialForm from "@/components/community/testimonial-form"
import { CommunityHero } from "@/components/community/community-hero"
import { CommunityPlatforms } from "@/components/community/community-platforms"
import { ActiveInitiatives } from "@/components/community/active-initiatives"
import { LatestUpdates } from "@/components/community/latest-updates"
import SafeJsonLd from "@/lib/json-ld"
import { CommunityCTA } from "@/components/community/community-cta"

export const metadata: Metadata = buildPageMetadata({
  title: "Community — Butwal Hacks",
  description:
    "Meet Butwal's student builders, mentors, and organizers. Join a hackathon, ship a project, and get signed proof of your work.",
  path: "/community",
})

export default function CommunityPage() {
  return (
    <>
      <SafeJsonLd data={{
        "@context": "https://schema.org",
        "@type": "NGO",
        name: "Butwal Hacks",
        url: "https://butwalhacks.com",
        description:
          "A nonprofit youth technology initiative in Butwal, Nepal, running free hackathons, mentorship, and student programs.",
        foundingDate: "2024",
        areaServed: { "@type": "Place", name: "Lumbini Province, Nepal" },
        knowsAbout: ["Technology Education", "Hackathons", "Youth Mentorship"],
        member: {
          "@type": "Organization",
          name: "Butwal Hacks Community",
            description: "Builders, mentors, and organizers running free tech events in Nepal",
        },
      }} />

      <main className="min-h-dvh bg-background">
        <CommunityHero />
        <MemberDirectory />

        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        <CommunityPlatforms />

        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        <ActiveInitiatives />

        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        <LatestUpdates />
        <TestimonialsSection />
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <TestimonialForm />
        </div>
        <CommunityCTA />
      </main>
    </>
  )
}
