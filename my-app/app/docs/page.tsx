import type { Metadata } from "next"
import Link from "next/link"

import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Docs",
  description: "Technical documentation for Butwal Hacks engineering setup, contribution, and standards.",
  path: "/docs",
})

export default function DocsIndexPage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <h1 className="text-4xl font-bold font-heading tracking-tight sm:text-5xl">Technical Documentation</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
          Engineering-first documentation for setup, workflows, and contributor guidance.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl font-bold font-heading text-foreground">Environment Setup</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure your local development environment to match production standards.
            </p>
            <Link href="/docs/engineering/environment-setup" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              Open guide
            </Link>
          </article>

          <article className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl font-bold font-heading text-foreground">Community Contribution</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with contribution basics, code standards, and maintainers workflow.
            </p>
            <Link href="/resources" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              Open resources
            </Link>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  )
}
