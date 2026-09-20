export const dynamic = "force-static";
export const revalidate = 3600;

import type { Metadata } from "next"
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
        <BlogContent posts={posts} />
      </section>

    </main>
  )
}
