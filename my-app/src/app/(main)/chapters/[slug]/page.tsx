import { notFound } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, Calendar, ArrowLeft, MessageSquare, ExternalLink, GraduationCap, User } from "lucide-react"

import { getActiveChapters, getChapterBySlug } from "@/lib/actions/chapters"
import { buildPageMetadata } from "@/lib/seo"
import Breadcrumbs from "@/components/breadcrumbs"
import RelatedLinks from "@/components/home/related-links"

type Props = {
  params: Promise<{ slug: string }>
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const chapter = await getChapterBySlug(slug)

  // The public chapter directory is a coming-soon page, so these legacy
  // detail pages stay reachable for old links but must not be indexed.
  const noindex = { robots: { index: false, follow: false } }

  if (!chapter) {
    return {
      ...buildPageMetadata({
        title: "Chapter Not Found",
        description: "We could not find that chapter. See all chapters instead.",
        path: `/chapters/${slug}`,
      }),
      ...noindex,
    }
  }

  return {
    ...buildPageMetadata({
      title: `${chapter.name} — Butwal Hacks`,
      description: chapter.description.slice(0, 160),
      path: `/chapters/${chapter.slug}`,
    }),
    ...noindex,
  }
}

export default async function ChapterDetailPage({ params }: Props) {
  const { slug } = await params
  const chapter = await getChapterBySlug(slug)

  if (!chapter) {
    notFound()
  }

  const otherChapters = (await getActiveChapters())
    .filter((c) => c.slug !== chapter.slug)
    .slice(0, 2)
    .map((c) => ({
      title: c.name,
      description: c.school || c.city,
      href: `/chapters/${c.slug}`,
      meta: c.established ? `Est. ${c.established}` : undefined,
    }))

  const location = [chapter.city, chapter.district].filter(Boolean).join(", ")

  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        {/* Back link */}
        <Link
          href="/chapters"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors group mb-6"
        >
          <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
          All Chapters
        </Link>

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Chapters", href: "/chapters" },
            { label: chapter.name },
          ]}
        />

        {/* Chapter header */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${
                chapter.status === "active" ? "bg-status-green" :
                chapter.status === "forming" ? "bg-accent-yellow" : "bg-secondary/40"
              }`} />
              {chapter.status === "active" ? "Active" : chapter.status === "forming" ? "Forming" : "Inactive"}
            </span>
            {chapter.established && (
              <span className="text-[10px] font-medium text-muted-foreground">
                Est. {chapter.established}
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            {chapter.name}
          </h1>

          {/* School + Location */}
          <div className="space-y-3">
            {chapter.school && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <GraduationCap className="w-3.5 h-3.5 text-primary-red" />
                {chapter.school}
              </p>
            )}
            {location && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </p>
            )}
          </div>

          {chapter.description && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {chapter.description}
            </p>
          )}

          {/* Stats + Lead */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-red" />
              <span className="text-sm font-bold text-primary">{chapter.member_count}</span>
              <span className="text-xs text-muted-foreground">members</span>
            </div>
            {chapter.established && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-red" />
                <span className="text-xs text-muted-foreground">Est. {chapter.established}</span>
              </div>
            )}
            {chapter.lead_name && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
                <User className="w-3 h-3 text-primary-red" />
                <span className="text-xs font-medium text-muted-foreground">
                  Lead: <span className="text-primary font-semibold">{chapter.lead_name}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Highlights */}
        {chapter.highlights.length > 0 && (
          <div className="mt-12 pt-10 border-t border-border">
            <h2 className="text-xl font-bold text-primary mb-5">Highlights</h2>
            <ul className="space-y-3">
              {chapter.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-status-green shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* WhatsApp CTA */}
        {chapter.whatsapp && (
          <div className="mt-8">
            <a
              href={chapter.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Join {chapter.name} on WhatsApp <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Other chapters, read from the same table */}
        <RelatedLinks title="Other School Chapters" links={otherChapters} />
      </section>
    </main>
  )
}
