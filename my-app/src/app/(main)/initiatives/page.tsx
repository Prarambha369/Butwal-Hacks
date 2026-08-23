import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
import { initiatives } from "@/lib/content"
import { auth0 } from "@/lib/auth0"
import { APP_URL } from "@/lib/constants"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Initiatives",
  description: "Browse active, planned, and proposed Butwal Hacks initiatives with clear program status labels.",
  path: "/initiatives",
})

export default async function InitiativesPage() {
  const session = await auth0.getSession();
  const isSignedIn = !!session?.user;

  return (
    <main className="min-h-dvh bg-background">
      
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Initiatives" }]} />
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">Initiatives</h1>
          <p className="mt-4 max-w-3xl text-base sm:text-lg text-secondary">
            Each initiative is labeled by status to maintain transparent communication with the community.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isSignedIn ? (
              <Link
                href={`${APP_URL}/dashboard/hacker`}
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
              >
                Your Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`${APP_URL}/auth/login?screen_hint=signup`}
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
              >
                Get Involved <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {initiatives.map((initiative) => (
            <article key={initiative.slug} className="rounded-xl border border-border bg-surface p-6">
              <p className="text-xs uppercase tracking-wide text-secondary">Status: {initiative.status}</p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">{initiative.name}</h2>
              <p className="mt-3 text-sm text-secondary">{initiative.summary}</p>
              <Link href={`/initiatives/${initiative.slug}`} className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
                View initiative page
              </Link>
            </article>
          ))}
        </div>
      </section>
      
    </main>
  )
}
