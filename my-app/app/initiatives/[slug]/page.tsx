import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, ArrowRight } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { getInitiativeBySlug, initiatives, events } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"

type InitiativeDetailPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return initiatives.map((initiative) => ({ slug: initiative.slug }))
}

export async function generateMetadata({ params }: InitiativeDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const initiative = getInitiativeBySlug(slug)

  if (!initiative) {
    return buildPageMetadata({
      title: "Initiative Not Found",
      description: "The requested initiative page could not be found.",
      path: `/initiatives/${slug}`,
    })
  }

  return buildPageMetadata({
    title: initiative.name,
    description: `${initiative.summary} Status: ${initiative.status}.`,
    path: `/initiatives/${initiative.slug}`,
  })
}

export default async function InitiativeDetailPage({ params }: InitiativeDetailPageProps) {
  const { slug } = await params
  const initiative = getInitiativeBySlug(slug)

  if (!initiative) {
    notFound()
  }

  const relatedEvents = events.filter((event) => event.initiativeSlug === slug)

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Initiatives", href: "/initiatives" },
            { label: initiative.name },
          ]}
        />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Status: {initiative.status}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Tier {initiative.tier}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">{initiative.name}</h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">{initiative.summary}</p>

        {initiative.status !== "active" ? (
          <p className="mt-5 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            This initiative is currently {initiative.status} and presented for transparency as part of the public roadmap.
          </p>
        ) : null}

        <div className="mt-8 space-y-4 text-muted-foreground leading-relaxed">
          {initiative.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>

        {/* Related Events Section */}
        {relatedEvents.length > 0 && (
          <section className="mt-12 pt-12 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold font-heading text-foreground">Related Events</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedEvents.map((event) => (
                <article 
                  key={event.slug} 
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {event.status === "completed" ? "Completed" : "Planned"}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{event.dateLabel}</p>
                  <p className="text-sm text-muted-foreground mb-4">{event.summary}</p>
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    View event details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
      <Footer />
    </main>
  )
}
