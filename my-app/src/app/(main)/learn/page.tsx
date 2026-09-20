export const dynamic = "force-static";

import type { Metadata } from "next"
import Link from "next/link"
import { buildPageMetadata } from "@/lib/seo"
import { Book, FileText, Code, Video, ExternalLink, GraduationCap } from "lucide-react"
import Breadcrumbs from "@/components/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "Learn",
  description: "Guides, workshop resources, and docs for builders in Lumbini. Start from zero.",
  path: "/learn",
})

const guides = [
  {
    title: "Environment Setup",
    description: "Get the code running on your own machine, step by step. First time? Take it slow, it works.",
    href: "/docs/engineering/environment-setup",
    cta: "Open guide",
  },
  {
    title: "Community Contribution",
    description: "Contribution basics, code standards, and the maintainer workflow.",
    href: "/docs/engineering/environment-setup",
    cta: "Open guide",
  },
  {
    title: "Component Library",
    description: "Live preview and usage reference for UI components, with props, variants, and color options.",
    href: "/docs/components/section-heading",
    cta: "Open preview",
  },
]

const resourceCategories = [
  {
    title: "Learning Materials",
    icon: Book,
    description: "Guides, tutorials, and educational content from our workshops and programs.",
    items: [
      { name: "Getting Started with Web Development", available: false },
      { name: "Introduction to Git and GitHub", available: false },
      { name: "Building Your First Project", available: false },
    ],
  },
  {
    title: "Code Examples",
    icon: Code,
    description: "Sample projects and code repositories from community initiatives.",
    items: [
      { name: "Starter Templates", link: "https://github.com/Prarambha369", available: true },
      { name: "Past Project Showcases", available: false },
      { name: "Community Contributions", available: false },
    ],
  },
  {
    title: "Recordings & Media",
    icon: Video,
    description: "Recorded sessions, talks, and presentations from our events.",
    items: [
      { name: "Workshop Recordings", available: false },
      { name: "Community Talks", available: false },
      { name: "Event Highlights", available: false },
    ],
  },
]

/**
 * Learn hub — /resources (workshop materials) + /docs (contributor guides)
 * merged into one page. Docs subpages (/docs/engineering/*,
 * /docs/components/*) stay where they are.
 */
export default function LearnPage() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Learn" }]} />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-red/10 shrink-0">
            <GraduationCap className="w-6 h-6 text-primary-red" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">Learn</h1>
            <p className="mt-3 max-w-2xl text-base sm:text-lg text-secondary">
              Guides, workshop resources, and docs for builders in Lumbini. Start from zero.
            </p>
          </div>
        </div>

        {/* Contributor guides (migrated from /docs index). */}
        <div id="guides" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold font-heading text-primary">Contributor guides</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {guides.map((g) => (
              <article key={g.title} className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-lg font-bold text-primary">{g.title}</h3>
                <p className="mt-2 text-sm text-secondary">{g.description}</p>
                <Link href={g.href} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                  {g.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Workshop resources (migrated from /resources). */}
        <div id="resources" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-bold font-heading text-primary">Workshop resources</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {resourceCategories.map((category) => {
              const Icon = category.icon
              return (
                <article key={category.title} className="rounded-xl border border-border bg-surface p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-background/50 border border-border">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary">{category.title}</h3>
                      <p className="text-sm text-secondary mt-1">{category.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, index) => (
                      <li key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50 border border-border/50">
                        <span className="text-sm text-primary">{item.name}</span>
                        {"link" in item && item.available && item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                            aria-label={`View ${item.name}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-secondary px-2 py-0.5 rounded bg-surface/50">
                            Soon
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </div>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold font-heading text-primary mb-4">External Resources</h2>
          <p className="text-secondary mb-6">Hand-picked guides and tutorials from around the web.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="https://developer.mozilla.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-border bg-surface hover:bg-surface/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="font-semibold text-primary">MDN Web Docs</h3>
                <p className="text-sm text-secondary">Web development reference from the MDN team</p>
              </div>
              <ExternalLink className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
            </a>
            <a
              href="https://www.freecodecamp.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-border bg-surface hover:bg-surface/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="font-semibold text-primary">freeCodeCamp</h3>
                <p className="text-sm text-secondary">Learn to code with free tutorials</p>
              </div>
              <ExternalLink className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
            </a>
          </div>
        </section>

        <section className="mt-12 p-6 rounded-xl border border-border bg-surface">
          <h2 className="text-xl font-semibold font-heading text-primary mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Contributing Resources
          </h2>
          <p className="text-secondary mb-4">
            Have resources, guides, or materials to share with the community? We welcome contributions
            that can help others learn and grow.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Share Resources
          </Link>
        </section>
      </section>
    </main>
  )
}
