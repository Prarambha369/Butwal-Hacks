import type { Metadata } from "next"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description:
    "Learn about Butwal Hacks, a nonprofit initiative focused on practical technology learning and community mentorship.",
  path: "/about",
})

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">About Butwal Hacks</h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground">
          Butwal Hacks is a nonprofit community initiative in Butwal and Rupandehi that supports practical technology education through collaboration, mentorship, and project-based learning.
        </p>
        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-foreground">Mission</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Build inclusive access to technology learning opportunities and strengthen local innovation culture with transparent, community-driven programs.
        </p>
        <h2 className="mt-8 text-2xl sm:text-3xl font-bold font-heading text-foreground">Transparency</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          This website clearly labels active, planned, and proposed initiatives so the community can track progress without overstating delivery status.
        </p>
      </section>
      <Footer />
    </main>
  )
}
