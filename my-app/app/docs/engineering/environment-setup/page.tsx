import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

import CodeBlock from "@/components/code-block"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Environment Setup",
  description: "Set up your Butwal Hacks engineering environment with clear prerequisites and installation steps.",
  path: "/docs/engineering/environment-setup",
})

const setupCode = `git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks/my-app
npm install
npm run dev`

const toc = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "installation", label: "Installation Steps" },
  { id: "configuration", label: "Configuration" },
]

export default function EnvironmentSetupDocPage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-muted-foreground">Docs / Engineering / Environment Setup</p>
          <h1 className="mt-3 text-4xl font-bold font-heading tracking-tight sm:text-5xl">Environment Setup</h1>
          <div className="mt-4 flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span>Core Maintainer Guide</span>
            <span>5-min read</span>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[260px_1fr_260px]">
          <aside className="rounded-xl border border-border bg-card p-4 xl:sticky xl:top-24 xl:h-fit">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Getting Started</h2>
            <nav className="mt-3 space-y-2">
              <a href="#prerequisites" className="block rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm text-foreground">Prerequisites</a>
              <a href="#installation" className="block rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Installation Steps</a>
              <a href="#configuration" className="block rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Configuration</a>
            </nav>
          </aside>

          <article className="min-w-0">
            <p className="text-lg leading-relaxed text-muted-foreground">
              This guide helps you configure a local development environment for Butwal Hacks so your setup matches production and linting standards.
            </p>

            <div className="mt-7 rounded-xl border border-primary/40 bg-primary/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sponsored Community Partner</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Documentation sponsorship, when present, is clearly labeled and never blocks access to educational content. We do not run intrusive ads inside core technical documentation.
              </p>
            </div>

            <section id="prerequisites" className="scroll-mt-24 border-b border-border py-8">
              <h2 className="text-3xl font-bold font-heading">Prerequisites</h2>
              <p className="mt-4 text-muted-foreground">Install the following tools before starting:</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Node.js (v18 or later)</li>
                <li>npm (v9 or later)</li>
                <li>Git CLI</li>
              </ul>
            </section>

            <section id="installation" className="scroll-mt-24 border-b border-border py-8">
              <h2 className="text-3xl font-bold font-heading">Installation Steps</h2>
              <p className="mt-4 text-muted-foreground">Clone the repository and install dependencies using the commands below.</p>
              <div className="mt-5">
                <CodeBlock language="bash" code={setupCode} />
              </div>
            </section>

            <section id="configuration" className="scroll-mt-24 border-b border-border py-8">
              <h2 className="text-3xl font-bold font-heading">Configuration</h2>
              <p className="mt-4 text-muted-foreground">
                Set up environment variables in your local setup and keep sensitive keys out of version control.
              </p>
              <div className="mt-5 rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Keep keys in local environment files and share secrets only through approved maintainer channels.
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <a
                href="https://github.com/Prarambha369/Butwal-Hacks/edit/main/my-app/app/docs/engineering/environment-setup/page.tsx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Edit this page on GitHub
              </a>
              <p className="text-sm text-muted-foreground">Last updated: Feb 23, 2026</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link href="/docs" className="rounded-xl border border-border bg-card p-4 hover:bg-muted">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Previous</p>
                <p className="mt-1 text-lg font-semibold text-foreground">Introduction</p>
              </Link>
              <Link href="/resources" className="rounded-xl border border-border bg-card p-4 hover:bg-muted text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Next</p>
                <p className="mt-1 text-lg font-semibold text-foreground">Project Structure</p>
              </Link>
            </div>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">On This Page</h2>
              <nav className="mt-3 space-y-2">
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="block text-sm text-muted-foreground hover:text-foreground">
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stay Updated</h2>
              <p className="mt-2 text-sm text-muted-foreground">Get notified about documentation updates.</p>
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
