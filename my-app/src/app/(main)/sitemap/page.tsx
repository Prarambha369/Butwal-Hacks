import type { Metadata } from "next"
import Link from "next/link"
import {
  Globe,
  Users,
  Calendar,
  Code,
  Heart,
  BookOpen,
  Shield,
  FileText,
  ArrowRight,
} from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Sitemap — Explore Butwal Hacks",
  description: "Complete site directory for Butwal Hacks. Browse all pages, programs, events, and resources organized by category.",
  path: "/sitemap",
})

interface SiteSection {
  title: string
  description: string
  icon: React.ReactNode
  links: { href: string; label: string; description: string }[]
}

const sections: SiteSection[] = [
  {
    title: "Community",
    description: "Connect with builders, mentors, and organizers across Nepal.",
    icon: <Users className="h-5 w-5" />,
    links: [
      { href: "/explore", label: "Explore", description: "Discover members, browse profiles, find collaborators" },
      { href: "/community", label: "Community Hub", description: "Platforms, updates, and ways to get involved" },
      { href: "/chapters", label: "Chapters", description: "Local chapters in Pokhara, Kathmandu, Chitwan" },
      { href: "/initiatives", label: "Initiatives", description: "Active programs like Hackathon, GameJam, MiniHackathon" },
      { href: "/contact", label: "Contact", description: "Get in touch with the team" },
    ],
  },
  {
    title: "Events & Programs",
    description: "Hackathons, workshops, game jams, and structured programs.",
    icon: <Calendar className="h-5 w-5" />,
    links: [
      { href: "/events", label: "All Events", description: "Upcoming and past events calendar" },
      { href: "/events/list", label: "Event List", description: "Detailed list view of all events" },
      { href: "/programs", label: "Programs", description: "Structured learning and building programs" },
      { href: "/gallery", label: "Event Gallery", description: "Photos from hackathons and meetups" },
    ],
  },
  {
    title: "Build & Projects",
    description: "Showcase your work, find teams, and earn recognition.",
    icon: <Code className="h-5 w-5" />,
    links: [
      { href: "/projects", label: "Projects", description: "Community-built projects and open-source work" },
      { href: "/opportunities", label: "Opportunities", description: "Bounties, jobs, internships, and grants" },
      { href: "/dashboard/hacker/work", label: "Task Board", description: "Notion-style kanban for team projects" },
      { href: "/dashboard/hacker/team-matching", label: "Team Matching", description: "AI-powered teammate suggestions" },
    ],
  },
  {
    title: "About & Mission",
    description: "Our story, values, and how we operate.",
    icon: <Heart className="h-5 w-5" />,
    links: [
      { href: "/about", label: "About Us", description: "Mission, vision, and team behind Butwal Hacks" },
      { href: "/philosophy", label: "Philosophy", description: "Our beliefs and operating principles" },
      { href: "/blog", label: "Blog", description: "Stories, updates, and community articles" },
      { href: "/support", label: "Sponsor Prospectus", description: "Partner with us to support youth tech" },
      { href: "/donors", label: "Donor Recognition", description: "Honoring our supporters and contributors" },
    ],
  },
  {
    title: "Trust & Transparency",
    description: "Open financials, governance, and verified credentials.",
    icon: <Shield className="h-5 w-5" />,
    links: [
      { href: "/transparency", label: "Financial Transparency", description: "Live budget data from Open Collective" },
      { href: "/governance", label: "Governance", description: "Board structure, policies, and ethics" },
      { href: "/annual-report", label: "Annual Report", description: "Yearly impact and growth metrics" },
    ],
  },
  {
    title: "Resources & Docs",
    description: "Learning materials, documentation, and developer guides.",
    icon: <BookOpen className="h-5 w-5" />,
    links: [
      { href: "/resources", label: "Resources", description: "Guides, tutorials, and learning materials" },
      { href: "/docs", label: "Documentation", description: "Technical docs for contributors and maintainers" },
      { href: "/docs/engineering/environment-setup", label: "Setup Guide", description: "Local dev environment setup" },
      { href: "/docs/components/section-heading", label: "Component Library", description: "UI component previews and usage" },
    ],
  },
  {
    title: "Legal",
    description: "Policies, terms, and compliance information.",
    icon: <FileText className="h-5 w-5" />,
    links: [
      { href: "/legal/privacy", label: "Privacy Policy", description: "How we handle your data" },
      { href: "/legal/terms", label: "Terms of Service", description: "Terms governing platform use" },
      { href: "/cookie-policy", label: "Cookie Policy", description: "How we use cookies and tracking" },
    ],
  },
]

export default function SitemapPage() {
  return (
    <main className="min-h-dvh bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-4">
              <Globe className="h-3 w-3" />
              Site Directory
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
              Explore Butwal Hacks
            </h1>
            <p className="mt-4 text-lg text-secondary leading-relaxed max-w-xl">
              Everything in one place. Browse all pages, programs, and resources
              organized by category.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-xl border border-border bg-surface p-6 transition-all hover:shadow-md hover:border-border"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-primary">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-primary">{section.title}</h2>
                  <p className="text-xs text-secondary mt-0.5">{section.description}</p>
                </div>
              </div>

              {/* Links */}
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-secondary hover:bg-background hover:text-primary transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{link.label}</span>
                        <p className="text-xs text-secondary/60 truncate mt-0.5 group-hover:text-secondary/80">
                          {link.description}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 ml-3 shrink-0 text-secondary/40 group-hover:text-primary transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Quick links footer */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-secondary">
              Can&apos;t find what you&apos;re looking for?{" "}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                Contact us
              </Link>
            </p>
            <div className="flex items-center gap-4 text-xs text-secondary">
              <span>{sections.reduce((acc, s) => acc + s.links.length, 0)} pages</span>
              <span className="text-secondary/30">·</span>
              <span>{sections.length} categories</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
