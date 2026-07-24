export const dynamic = "force-static";
export const revalidate = 3600;

import type { Metadata } from "next"
import { BlogContent } from "@/components/blog/blog-content"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description: "Updates from Butwal Hacks on community events, project building, and tech learning in Nepal.",
  path: "/blog",
})

export default function BlogPage() {
  return (
    <main className="min-h-dvh bg-background text-primary">
      
      <section className="px-4 py-10">
        <BlogContent />
      </section>
      
    </main>
  )
}
