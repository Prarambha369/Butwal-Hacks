export const dynamic = "force-static";

import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import { DonorsHero } from "@/components/donors/donors-hero"
import { DonorSpotlight } from "@/components/donors/donor-spotlight"
import { RecognitionTiers } from "@/components/donors/recognition-tiers"
import { CommunitySupportWall } from "@/components/donors/community-support-wall"
import { SupporterBenefits } from "@/components/donors/supporter-benefits"
import { DonorsCTA } from "@/components/donors/donors-cta"

export const metadata: Metadata = buildPageMetadata({
  title: "Donor Recognition",
  description:
    "Honoring the individuals and organizations whose generous support makes Butwal Hacks Foundation's mission possible.",
  path: "/donors",
})

export default function DonorsPage() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <DonorsHero />
        <DonorSpotlight />
        <RecognitionTiers />
        <CommunitySupportWall />
        <SupporterBenefits />
        <DonorsCTA />
      </section>
    </main>
  )
}
