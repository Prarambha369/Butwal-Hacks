import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumbs from "@/components/breadcrumbs"
import { buildPageMetadata } from "@/lib/seo"
import { ComingSoon } from "@/components/ui/coming-soon"

export const metadata: Metadata = buildPageMetadata({
  title: "Partners — Butwal Hacks",
  description:
    "The Butwal Hacks partner programme is still being built. Sponsorship tiers, recognition, and the partner wall will publish here once the terms are final.",
  path: "/partners",
  keywords: ["Butwal Hacks partners", "sponsors Nepal hackathon", "support youth tech Nepal"],
})

export const revalidate = 300;

/**
 * The partner programme is not open yet: there are no signed tiers or
 * agreements to show. This page states that plainly and keeps the honest
 * anchor (`#donors`) that older links rely on.
 */
export default function PartnersPage() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Partners" }]} />
        <div className="mt-8" id="donors">
          <ComingSoon
            eyebrow="Partner programme"
            title="Partnerships are not open yet"
            description="We are writing the sponsorship terms before we publish any tier, logo, or price. When that is done, this page will list the organisations that back Butwal Hacks and exactly what their support pays for."
            planned={[
              "Sponsorship tiers with real prices and what each one funds.",
              "A partner wall of organisations that have signed.",
              "Recognition terms: logo placement, event credits, reporting.",
              "An annual partner report tied to the public budget.",
            ]}
            status="No partner has been announced. Nothing on this page is an offer."
            mascot="pointing"
            primary={{ label: "Support the mission", href: "/support" }}
            secondary={{ label: "Talk to the team", href: "/contact" }}
          />
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Already working with us and need something published?{" "}
          <Link href="/contact" className="font-semibold text-primary-red hover:underline">
            Message the team
          </Link>
          {" "}and we will add it once the paperwork is signed.
        </p>
      </section>
    </main>
  )
}
