import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, ArrowRight } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
import { getInitiativeBySlug, initiatives, events, blogPosts, getRelatedByTags } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"
import RelatedLinks from "@/components/home/related-links"

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
    <main className="min-h-dvh bg-background">
      
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Initiatives", href: "/initiatives" },
            { label: initiative.name },
          ]}
        />
        <p className="text-xs uppercase tracking-wide text-secondary">Status: {initiative.status}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">{initiative.name}</h1>
        <p className="mt-5 text-base sm:text-lg text-secondary leading-relaxed">{initiative.summary}</p>

        {initiative.status !== "active" ? (
          <p className="mt-5 rounded-md border border-border bg-surface p-4 text-sm text-secondary">
            This initiative is currently {initiative.status} and presented for transparency as part of the public roadmap.
          </p>
        ) : null}

        <div className="mt-8 space-y-4 text-secondary leading-relaxed">
          {initiative.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>

        {/* Related Events Section */}
        {relatedEvents.length > 0 && (
          <section className="mt-12 pt-12 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold font-heading text-primary">Related Events</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedEvents.map((event) => (
                <article 
                  key={event.slug} 
                  className="rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-shadow"
                >
                  <p className="text-xs uppercase tracking-wide text-secondary mb-2">
                    {event.status === "completed" ? "Completed" : "Planned"}
                  </p>
                  <h3 className="text-lg font-semibold text-primary mb-2">{event.title}</h3>
                  <p className="text-sm text-secondary mb-1">{event.dateLabel}</p>
                  <p className="text-sm text-secondary mb-4">{event.summary}</p>
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

        {/* Continue Reading: blog posts for deeper context, matched by tags */}
        <RelatedLinks
          title="Continue Reading"
          links={getRelatedByTags(blogPosts, initiative.tags).map((p) => ({
            title: p.title,
            description: p.excerpt,
            href: `/blog/${p.slug}`,
            image: p.cover_image,
            meta: p.publishedAt,
          }))}
        />
      </section>
      
    </main>
  )
}
