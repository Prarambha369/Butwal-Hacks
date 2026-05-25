import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Explore",
  description: "Browse all key Butwal Hacks pages from a single index.",
  path: "/explore",
})

const groups = [
  {
    title: "Foundation",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/philosophy", label: "Philosophy" },
      { href: "/community", label: "Community" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Programs",
    links: [
      { href: "/initiatives", label: "All Initiatives" },
      { href: "/initiatives/hackathon", label: "Hackathon" },
      { href: "/initiatives/mini-hackathon", label: "MiniHackathon" },
      { href: "/initiatives/gamejam", label: "GameJam" },
      { href: "/events", label: "Events" },
      { href: "/events/daydream-butwal-september-2024", label: "Daydream Butwal" },
      { href: "/77-hacks", label: "77 Hacks (Planned)" },
    ],
  },
  {
    title: "Knowledge",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/docs", label: "Docs" },
      { href: "/docs/engineering/environment-setup", label: "Environment Setup" },
      { href: "/resources", label: "Resources" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/support", label: "Support & Donation" },
      { href: "/donors", label: "Donor Recognition" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-of-service", label: "Terms of Service" },
      { href: "/cookie-policy", label: "Cookie Policy" },
    ],
  },
] as const

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">Explore</h1>
        <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted-foreground">
          A complete index of key pages so everything is easy to access in one place.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <article key={group.title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-xl font-semibold font-heading text-foreground">{group.title}</h2>
              <ul className="mt-4 space-y-2">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}