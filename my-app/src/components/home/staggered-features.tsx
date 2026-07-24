import { Fingerprint, Users, KanbanSquare, Award, Github, ArrowRight } from "lucide-react"
import Link from "next/link"

const features = [
  {
    title: "Your Hacker ID, Signed & Verified",
    description: "A public profile with cryptographically signed trust markers. Every certificate and contribution is timestamped and independently verifiable — no middleman required.",
    icon: Fingerprint,
    color: "text-primary-red bg-primary-red/8",
    href: "/explore",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Team Matching That Actually Works",
    description: "Describe what you're working on. We'll find teammates with complementary skills — designers who need developers, IoT tinkerers looking for ML people without the cold DMs.",
    icon: Users,
    color: "text-status-blue bg-status-blue/8",
    href: "/explore",
    span: "md:col-span-1 md:row-span-2",
  },
  {
    title: "Hackathon Task Management",
    description: "Drag-and-drop Kanban boards baked into every event. Assign tasks, set priorities, track progress — all inside your hackathon dashboard.",
    icon: KanbanSquare,
    color: "text-status-green bg-status-green/8",
    href: "/events",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Bounties with Real Payouts",
    description: "Complete real-world challenges and earn payouts through Open Collective. Transparent, publicly tracked, zero fees taken.",
    icon: Award,
    color: "text-status-yellow bg-status-yellow/8",
    href: "/opportunities",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Auto-Verify from GitHub",
    description: "Connect your repos. Your commit history timestamps become proof of work — automatically synced to your profile the moment you push.",
    icon: Github,
    color: "text-primary bg-surface-hover",
    href: "/community",
    span: "md:col-span-1 md:row-span-1",
  },
]

/**
 * StaggeredFeatures — mixed layout with visual variety
 *
 * Intentionally avoids the "6 identical icon cards in a 3-column grid" pattern.
 * Cards have varied sizes, the last row uses a 2-column split for asymmetry,
 * and a highlighted callout card breaks the rhythm.
 */
export default function StaggeredFeatures() {
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Minimal header — no eyebrow, just a plain heading */}
        <div className="mb-14 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
            The tools you actually need
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-lg">
            No fluff. A verified identity, a team that clicks, and projects that ship — everything else is optional.
          </p>
        </div>

        {/* Mixed layout grid — not all cards are the same */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 auto-rows-[minmax(180px,auto)]">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className={`group relative rounded-xl border border-border bg-surface p-6 md:p-7 transition-all duration-200 hover:shadow-sm ${feature.span}`}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${feature.color} mb-4`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-base font-semibold text-primary mb-1.5 group-hover:text-primary-red transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary-red transition-colors">
                  <span>Learn more</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            )
          })}


        </div>
      </div>
    </section>
  )
}
