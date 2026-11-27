import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { eventSlugParams } from "@/lib/static-params"

import { createServiceClient } from "@/utils/supabase"
import { logger } from "@/lib/logger"
import { degradeOnReadError } from "@/lib/build-phase"
import { buildPageMetadata } from "@/lib/seo"
import { initiatives, events as contentEvents, blogPosts, getRelatedByTags } from "@/lib/content"
import RelatedLinks from "@/components/home/related-links"
import EventDetailContent from "@/components/events/event-detail-content";
import { EVENT_FAQS } from "@/lib/event-faq";
import SafeJsonLd from "@/lib/json-ld";
import { eventJsonLd, faqPageJsonLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/constants";
import { socialCardUrl } from "@/lib/cloudinary-url";
import { isOnlineLocation } from "@/lib/event-status";
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: event } = await supabase
    .from("events")
    .select("title, description, location, banner_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!event) {
    return buildPageMetadata({
      title: "Event Not Found",
      description: "We could not find that event. Check upcoming events instead.",
      path: `/events/${slug}`,
    })
  }

  const fallbackDescription = event.location
    ? `Register for ${event.title} in ${event.location}. Join the hackathon, meet fellow builders, and ship something real.`
    : `Register for ${event.title}. Join the hackathon and build with fellow students in Nepal.`

  // The banner becomes the share card, cropped by Cloudinary to the 1200×630
  // Open Graph / Twitter size. Without a banner, the site default applies.
  const card = event.banner_url ? socialCardUrl(event.banner_url) : null

  return buildPageMetadata({
    title: event.title,
    description: event.description?.slice(0, 160) || fallbackDescription,
    path: `/events/${slug}`,
    ...(card
      ? { image: { url: card.url, alt: `${event.title} banner`, width: card.width, height: card.height } }
      : {}),
  })
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  // A failed read is not a missing event: throwing keeps the last good ISR
  // page instead of caching a 404 for the revalidate window.
  if (eventError) {
    logger.error("Error fetching event:", eventError)
    if (!degradeOnReadError()) throw new Error("Event could not be loaded")
  }
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
    banner_url: event.banner_url?.trim() ? event.banner_url : null,
  }

  // Approved photos for this event (powers the gallery preview on the page).
  const { data: photoRows, error: photoError } = await supabase
    .from("photos")
    .select("id, url, media_type")
    .eq("event_id", event.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(8)
  if (photoError) {
    logger.error("Error fetching event photos:", photoError)
  }
  type PhotoRow = { id: string | null; url: string | null; media_type: string | null }
  // `id` is what makes each tile link to its canonical /gallery/<id> page
  // instead of dumping every visitor on the gallery index.
  const photos = ((photoRows ?? []) as PhotoRow[]).map((r) => ({
    id: r.id ?? "",
    url: (r.url ?? "") as string,
    media_type: r.media_type ?? "image",
  }))

  const locale = 'en' as Locale;

  const eventUrl = `${SITE_URL}/events/${eventData.slug}`;

  return (
    <>
      <SafeJsonLd
        data={eventJsonLd({
          title: eventData.title,
          description: eventData.description,
          startDate: eventData.start_date,
          endDate: eventData.end_date,
          url: eventUrl,
          image: eventData.banner_url,
          locationName: eventData.location,
          attendanceMode: isOnlineLocation(eventData.location)
            ? "OnlineEventAttendanceMode"
            : "OfflineEventAttendanceMode",
          // DB events are free by default (no registration fee, PRODUCT.md), so
          // the offer is priced explicitly rather than left for Google to infer.
          price: "0",
          priceCurrency: "NPR",
        })}
      />
      {/* The visible FAQ section on this page renders EVENT_FAQS, so the markup
          below is the same three questions rather than a parallel copy. */}
      <SafeJsonLd data={faqPageJsonLd(EVENT_FAQS, eventUrl)} />

      <EventDetailContent event={eventData} photos={photos} />

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

// ISR: rendered on first request, then served from the CDN and refreshed
// in the background at most every 300 seconds. Nothing here depends on the
// visitor, so a per-request render was pure server CPU.
export const revalidate = 300;
// An empty list makes this dynamic segment ISR instead of per-request:
// pages are rendered on demand, never at build time.
// [] on Vercel (rendered on demand); every published event in the static
// marketing export (lib/static-params.ts).
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return eventSlugParams();
}
