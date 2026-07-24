import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/utils/supabase/server"
import { buildPageMetadata } from "@/lib/seo"
import { initiatives, events as contentEvents, blogPosts, getRelatedByTags } from "@/lib/content"
import RelatedLinks from "@/components/home/related-links"
import EventDetailContent from "@/components/events/event-detail-content"
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient()
  const { data: event } = await supabase
    .from("events")
    .select("title, description, location")
    .eq("slug", slug)
    .single()

  if (!event) {
    return buildPageMetadata({
      title: "Event Not Found",
      description: "The requested event page could not be found.",
      path: `/events/${slug}`,
    })
  }

  const fallbackDescription = event.location
    ? `Register for ${event.title} in ${event.location}. Join the hackathon, meet fellow builders, and ship something great.`
    : `Register for ${event.title} — join the hackathon and build with fellow students in Nepal.`

  return buildPageMetadata({
    title: event.title,
    description: event.description?.slice(0, 160) || fallbackDescription,
    path: `/events/${slug}`,
  })
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = createClient()

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!event) {
    notFound()
  }

  const eventData = {
    id: event.id,
    title: event.title,
    slug: event.slug || slug,
    description: event.description,
    start_date: event.start_date,
    end_date: event.end_date,
    location: event.location,
    banner_url: event.banner_url,
    is_published: event.is_published,
  }

  const locale = 'en' as Locale;

  return (
    <>
      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
          {t('action.view_all_events', locale)}
        </Link>
      </div>

      <EventDetailContent event={eventData} />

      {/* Related links: initiatives + blog posts tagged to this event */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <RelatedLinks
          title={t('action.related_initiatives', locale)}
          links={getRelatedByTags(
            initiatives.filter((i) => i.status === "active"),
            // Derive source tags from content.ts event matching this DB event's slug
            contentEvents.find((e) => e.slug === slug)?.tags ?? [slug],
            { max: 2 },
          ).map((i) => ({
            title: i.name,
            description: i.summary,
            href: `/initiatives/${i.slug}`,
            meta: "Active Initiative",
          }))}
        />

        {/* Continue Reading: blog posts for deeper context */}
        <RelatedLinks
          title={t('action.continue_reading', locale)}
          links={getRelatedByTags(blogPosts, contentEvents.find((e) => e.slug === slug)?.tags ?? []).map((p) => ({
            title: p.title,
            description: p.excerpt,
            href: `/blog/${p.slug}`,
            image: p.cover_image,
            meta: p.publishedAt,
          }))}
        />
      </div>
    </>
  )
}
