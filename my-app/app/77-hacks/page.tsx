import type { Metadata } from "next"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "77 Hacks",
  description:
    "77 Hacks is a planned and proposed initiative in the Butwal Hacks roadmap, presented transparently as a future vision.",
  path: "/77-hacks",
})

export default function SevenSevenHacksPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Initiatives", href: "/initiatives" },
            { label: "77 Hacks" },
          ]}
        />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Status: Planned / Proposed</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">77 Hacks</h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
          77 Hacks is currently a planned initiative and long-term vision. This page documents the concept transparently and does not represent a launched program.
        </p>

        <h2 className="mt-10 text-2xl sm:text-3xl font-bold font-heading text-foreground">Current Scope</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Concept exploration with community input</li>
          <li>Roadmap alignment with local capacity and partnerships</li>
          <li>Future documentation updates as planning progresses</li>
        </ul>
      </section>
      <Footer />
    </main>
  )
}
