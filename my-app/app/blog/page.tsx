import type { Metadata } from "next"


import { BlogContent } from "@/components/blog/blog-content"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description: "Read Butwal Hacks updates, reflections, and community notes on technology learning and mentorship.",
  path: "/blog",
})

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      
      <section className="px-4 py-10">
        <BlogContent />
      </section>
      
    </main>
  )
}
