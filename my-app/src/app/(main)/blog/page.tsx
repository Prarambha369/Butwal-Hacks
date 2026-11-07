export const dynamic = "force-static";
export const revalidate = 3600;

import type { Metadata } from "next"
import Link from "next/link"
import { PenLine } from "lucide-react"
import { BlogContent } from "@/components/blog/blog-content"
import { getPublishedPosts } from "@/lib/actions/blog"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description: "Stories from Butwal Hacks: events, student builds, and learning to code in Nepal.",
  path: "/blog",
})

export default async function BlogPage() {
  // DB-first (maintainer-authored), static fallback inside the action.
  const posts = await getPublishedPosts();
  return (
    <main className="min-h-dvh bg-background text-primary">

      <section className="px-4 py-10">
        <div className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">
            Stories from the community
          </p>
          <Link
            href="/dashboard/blog"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold text-primary transition-colors hover:border-primary-red/40"
          >
            <PenLine className="h-3.5 w-3.5 text-primary-red" aria-hidden="true" />
            Write a post
          </Link>
        </div>
        <BlogContent posts={posts} />
      </section>

    </main>
  )
}
