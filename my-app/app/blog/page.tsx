import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, Clock3 } from "lucide-react"

import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { blogPosts } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description: "Read Butwal Hacks updates, reflections, and community notes on technology learning and mentorship.",
  path: "/blog",
})

export default function BlogPage() {
  const categories = ["All Posts", "Development", "Community", "Events"]
  const tags = ["#react", "#opensource", "#hackathon", "#backend", "#nepaltech"]

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[250px_1fr_260px]">
          <aside className="space-y-6 rounded-xl border border-border bg-card p-4 xl:sticky xl:top-24 xl:h-fit">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h2>
              <ul className="mt-3 space-y-2">
                {categories.map((category, index) => (
                  <li key={category}>
                    <button
                      type="button"
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        index === 0
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Trending Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <h1 className="text-4xl font-bold font-heading tracking-tight sm:text-5xl">Blog</h1>
            <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted-foreground">
              Technical insights, community spotlights, and updates from Butwal Hacks.
            </p>

            <div className="mt-10 space-y-10">
              {blogPosts.map((post, index) => (
                <div key={post.slug}>
                  <article className="border-b border-border pb-8">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{post.publishedAt}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />5 min read</span>
                    </div>
                    <h2 className="mt-4 text-4xl font-bold font-heading leading-tight text-foreground">{post.title}</h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="mt-5 inline-block text-lg font-semibold text-primary hover:underline">
                      Read More →
                    </Link>
                  </article>

                  {index === 1 ? (
                    <aside className="my-8 rounded-xl border border-border bg-card p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sponsored</p>
                      <h3 className="mt-2 text-2xl font-semibold font-heading text-foreground">Support Community Infrastructure</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Sponsored placements are clearly labeled and separated from editorial content. This supports nonprofit operations without dark patterns.
                      </p>
                    </aside>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Newsletter</h2>
              <p className="mt-2 text-sm text-muted-foreground">Get technical updates in your inbox.</p>
              <input
                type="email"
                placeholder="email@example.com"
                aria-label="Email address"
                className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button type="button" className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                Subscribe
              </button>
            </div>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  )
}
