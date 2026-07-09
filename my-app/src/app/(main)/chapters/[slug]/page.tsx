import { notFound } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, Calendar, ArrowLeft, MessageSquare, ExternalLink, GraduationCap, User } from "lucide-react"

import { chapters, blogPosts, getRelatedByTags } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"
import Breadcrumbs from "@/components/breadcrumbs"
import RelatedLinks from "@/components/home/related-links"

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return chapters.map((chapter) => ({ slug: chapter.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const chapter = chapters.find((c) => c.slug === slug)

  if (!chapter) {
    return buildPageMetadata({
      title: "Chapter Not Found",
      description: "The requested chapter page could not be found.",
      path: `/chapters/${slug}`,
    })
  }

  return buildPageMetadata({
    title: `${chapter.name} — Butwal Hacks`,
    description: chapter.description.slice(0, 160),
    path: `/chapters/${chapter.slug}`,
  })
}

export default async function ChapterDetailPage({ params }: Props) {
  const { slug } = await params
  const chapter = chapters.find((c) => c.slug === slug)

  if (!chapter) {
    notFound()
  }

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
            <span className="text-[10px] font-medium text-muted-foreground/50">
              Est. {chapter.established}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            {chapter.name}
          </h1>

          {/* School + Location */}
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5 text-primary-red" />
              {chapter.school}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {chapter.city}, {chapter.district} — {chapter.province}
            </p>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {chapter.description}
          </p>

          {/* Stats + Lead */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-red" />
              <span className="text-sm font-bold text-primary">{chapter.memberCount}</span>
              <span className="text-xs text-muted-foreground">members</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-red" />
              <span className="text-xs text-muted-foreground/50">Est. {chapter.established}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
              <User className="w-3 h-3 text-primary-red" />
              <span className="text-xs font-medium text-muted-foreground">
                Lead: <span className="text-primary font-semibold">{chapter.leadName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Highlights */}
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

        {/* WhatsApp CTA */}
        {chapter.socialLinks?.whatsapp && (
          <div className="mt-8">
            <a
              href={chapter.socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary-red px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Join {chapter.name} on WhatsApp <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Continue Reading: blog posts + other school chapters, matched by tags */}
        <RelatedLinks
          title="Other School Chapters"
          links={[
            ...getRelatedByTags(blogPosts, chapter.tags).map((p) => ({
              title: p.title,
              description: p.excerpt,
              href: `/blog/${p.slug}`,
              image: p.cover_image,
              meta: p.publishedAt,
            })),
            ...getRelatedByTags(chapters, chapter.tags, { excludeSlug: chapter.slug, max: 2 }).map((c) => ({
              title: c.name,
              description: c.school,
              href: `/chapters/${c.slug}`,
              meta: `${c.memberCount} members`,
            })),
          ]}
        />
      </section>
    </main>
  )
}
