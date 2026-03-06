import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Clock3 } from "lucide-react"

import CodeBlock from "@/components/code-block"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { blogPosts, getBlogPostBySlug } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return buildPageMetadata({
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
      path: `/blog/${slug}`,
    })
  }

  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  })
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const sections = [
    { id: "overview", title: "Overview" },
    { id: "implementation", title: "Implementation Notes" },
    { id: "lessons", title: "Lessons Learned" },
  ]

  const codeSnippet = `def resolve_conflicts(local_node, incoming_payload):\n    l_clock = local_node.get_vclock()\n    i_vclock = incoming_payload.vclock\n\n    if i_vclock.is_descendant_of(l_clock):\n        local_node.apply_patch(incoming_payload.data)\n        return Status.SYNCED\n\n    return Status.CONFLICT_RECONCILE`

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[220px_1fr_260px]">
          <aside className="rounded-xl border border-border bg-card p-4 xl:sticky xl:top-24 xl:h-fit">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="text-primary">Engineering</li>
              <li className="text-muted-foreground">Case Studies</li>
              <li className="text-muted-foreground">Community Updates</li>
            </ul>
          </aside>

          <article className="min-w-0">
            <p className="text-sm text-muted-foreground">Home / Blog / {post.title}</p>
            <h1 className="mt-3 text-4xl font-bold font-heading tracking-tight leading-tight sm:text-6xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{post.publishedAt}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />5-min read</span>
            </div>

            <p className="mt-8 text-xl italic leading-relaxed text-muted-foreground">{post.excerpt}</p>

            <div className="mt-8 rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sponsored</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sponsored blocks are clearly labeled and placed outside core explanations to preserve reader trust and editorial clarity.
              </p>
            </div>

            <section id="overview" className="scroll-mt-24 border-b border-border py-8">
              <h2 className="text-4xl font-bold font-heading">The Core Challenges</h2>
              <div className="mt-4 space-y-4 text-lg leading-relaxed text-muted-foreground">
                {post.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section id="implementation" className="scroll-mt-24 border-b border-border py-8">
              <h2 className="text-4xl font-bold font-heading">Hybrid Local-First Architecture</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                We emphasize resilient and low-bandwidth-friendly patterns to support practical deployment contexts.
              </p>
              <div className="mt-5">
                <CodeBlock language="sync_handler.py" code={codeSnippet} showLineNumbers={false} />
              </div>
            </section>

            <section id="lessons" className="scroll-mt-24 border-b border-border py-8">
              <h2 className="text-4xl font-bold font-heading">Lessons from the Field</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                We prioritize maintainability, performance under constrained conditions, and transparent reporting of trade-offs.
              </p>
            </section>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <a
                href={`https://github.com/Prarambha369/Butwal-Hacks/edit/main/my-app/app/blog/${post.slug}/page.tsx`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Edit this page on GitHub
              </a>
              <p className="text-sm text-muted-foreground">Last updated: {post.publishedAt}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link href="/blog" className="rounded-xl border border-border bg-card p-4 hover:bg-muted">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Previous Post</p>
                <p className="mt-1 text-lg font-semibold text-foreground">Blog Index</p>
              </Link>
              <Link href="/blog" className="rounded-xl border border-border bg-card p-4 hover:bg-muted text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Post</p>
                <p className="mt-1 text-lg font-semibold text-foreground">More Articles</p>
              </Link>
            </div>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Table of Contents</h2>
              <nav className="mt-3 space-y-2">
                {sections.map((item, index) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm ${index === 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stay Updated</h2>
              <p className="mt-2 text-sm text-muted-foreground">Receive community engineering updates.</p>
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
