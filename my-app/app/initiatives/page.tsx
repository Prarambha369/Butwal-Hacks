import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { initiatives } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Initiatives",
  description: "Browse active, planned, and proposed Butwal Hacks initiatives with clear program status labels.",
  path: "/initiatives",
})

export default function InitiativesPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Initiatives" }]} />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">Initiatives</h1>
        <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted-foreground">
          Each initiative is labeled by status to maintain transparent communication with the community.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {initiatives.map((initiative) => (
            <article key={initiative.slug} className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status: {initiative.status}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Tier {initiative.tier}</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{initiative.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{initiative.summary}</p>
              <Link href={`/initiatives/${initiative.slug}`} className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
                View initiative page
              </Link>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
