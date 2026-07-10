import type { Metadata } from "next"
import Link from "next/link"
import {
  MessageSquare,
  Send,
  Github,
  Mail,
  Users,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Quote,
} from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"
import { communityStats, initiatives, blogPosts, communityLinks } from "@/lib/content"
import { MemberDirectory } from "@/components/member-directory"
import { TestimonialsSection } from "@/components/testimonials"
import { FadeIn } from "@/components/home/shared-primitives"

export const metadata: Metadata = buildPageMetadata({
  title: "Community — Butwal Hacks",
  description:
    "Join 500+ builders, mentors, and organizers in Butwal's youth tech community. Participate in hackathons, ship projects, and earn verifiable trust markers.",
  path: "/community",
})

const platformIcons: Record<string, typeof MessageSquare> = {
  MessageSquare,
  Send,
  Github,
  Mail,
}

const platformGradients: Record<string, string> = {
  Discord: "from-indigo-600/20 to-indigo-800/10 border-indigo-500/20",
  Telegram: "from-status-blue/20 to-blue-800/10 border-status-blue/20",
  GitHub: "from-surface to-surface/50 border-border/40",
  Contact: "from-bh-red-500/10 to-red-800/10 border-bh-red-500/20",
}

export default function CommunityPage() {
  return (
    <>
      {/* JSON-LD Structured Data for Community / Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NGO",
            name: "Butwal Hacks",
            url: "https://butwalhacks.com",
            description:
              "A nonprofit youth technology initiative in Butwal, Nepal, providing hands-on hackathons, mentorship, and innovation opportunities.",
            foundingDate: "2024",
            areaServed: { "@type": "Place", name: "Lumbini Province, Nepal" },
            knowsAbout: ["Technology Education", "Hackathons", "Youth Mentorship"],
            member: {
              "@type": "Organization",
              name: "Butwal Hacks Community",
              description: "500+ builders, mentors, and organizers",
            },
          }),
        }}
      />

      <main className="min-h-screen bg-background">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden border-b border-border/20"
          aria-label="Community Hero"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-bh-red-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-status-blue/10 blur-[100px] pointer-events-none" />

          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-bh-red-500" />
                  Community
                </p>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-primary leading-[1.05]">
                  Where Builders
                  <br />
                  <span className="text-bh-red-500">Meet Opportunity</span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-secondary leading-relaxed max-w-xl">
                  Butwal Hacks is more than events — it&apos;s a growing community of students, developers,
                  designers, and mentors building the future of tech in Lumbini Province, Nepal.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
                  >
                    Join the Community <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/30 px-6 py-3 text-sm font-bold text-primary hover:bg-surface/50 transition-all"
                  >
                    Explore Members <Users className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right: Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                {communityStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="lg-surface rounded-2xl border border-glass p-5 md:p-6 hover:shadow-md transition-all"
                  >
                    <p className="text-3xl md:text-4xl font-black text-bh-red-500 tracking-tight">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm font-bold text-primary">{stat.label}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-secondary/70">
                      {stat.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── MEMBER DIRECTORY ─────────────────────────────────── */}
        <MemberDirectory />

        {/* ── COMMUNITY PLATFORMS ──────────────────────────────── */}
        <section className="relative py-20 md:py-28 overflow-hidden" aria-label="Community Platforms">
          <FadeIn className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-4">
                Connect
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
                Where We Hang Out
              </h2>
              <p className="mt-3 text-secondary max-w-xl mx-auto">
                Join the conversation on your preferred platform. All channels are free and open to everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {communityLinks.map((link) => {
                const Icon = platformIcons[link.icon] || MessageSquare
                const gradient = platformGradients[link.name] || "from-surface to-surface/50 border-glass"
                return (
                  <article
                    key={link.name}
                    className={`lg-surface rounded-2xl border p-6 bg-gradient-to-br ${gradient} transition-all hover:shadow-md group`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-surface/30 border border-border/20 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-primary">{link.name}</h3>
                        <p className="mt-1 text-sm text-secondary/80 leading-relaxed">
                          {link.description}
                        </p>
                        {link.available ? (
                          <a
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-bh-red-500 hover:text-bh-red-400 transition-colors"
                          >
                            {link.name === "Contact" ? "Send message" : `Join ${link.name}`}{" "}
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary/50 cursor-not-allowed">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </FadeIn>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        {/* ── FEATURED INITIATIVES ─────────────────────────────── */}
        <section className="py-20 md:py-28" aria-label="Featured Initiatives">
          <FadeIn className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-4">
                  Get Involved
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
                  Active Initiatives
                </h2>
              </div>
              <Link
                href="/initiatives"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {initiatives
                .filter((i) => i.status === "active")
                .slice(0, 3)
                .map((initiative) => (
                  <Link
                    key={initiative.slug}
                    href={`/initiatives/${initiative.slug}`}
                    className="lg-surface rounded-2xl border border-glass p-6 hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="inline-flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-status-green" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-status-green">
                        Active
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-primary group-hover:text-bh-red-500 transition-colors">
                      {initiative.name}
                    </h3>
                    <p className="mt-2 text-sm text-secondary/80 leading-relaxed flex-1">
                      {initiative.summary}
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-secondary/60">
                      Learn more <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/initiatives"
                className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                View all initiatives <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4">
          <hr className="border-border/20" />
        </div>

        {/* ── LATEST UPDATES / BLOG ───────────────────────────── */}
        <section className="py-20 md:py-28" aria-label="Latest Community Updates">
          <FadeIn className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500 mb-4">
                  Updates
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
                  Latest from the Community
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                All posts <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="lg-surface rounded-2xl border border-glass p-6 hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-2 text-[11px] font-medium text-secondary/60 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <h3 className="text-base font-bold text-primary group-hover:text-bh-red-500 transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-secondary/80 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-secondary/60">
                    Read more <ArrowUpRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                All posts <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────── */}
        <TestimonialsSection />

        {/* ── FINAL CTA ────────────────────────────────────────── */}
        <section className="relative py-24 md:py-32 overflow-hidden" aria-label="Join the Community">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-b from-bh-red-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-bh-red-500/10 blur-[120px] pointer-events-none" />

          <FadeIn className="relative mx-auto max-w-3xl px-4 text-center">
            <Sparkles className="w-10 h-10 text-bh-red-500 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
              Ready to Build?
            </h2>
            <p className="mt-4 text-lg text-secondary max-w-xl mx-auto leading-relaxed">
              Whether you&apos;re writing your first line of code or shipping your tenth project —
              there&apos;s a place for you here.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
              >
                Create Your Profile <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/30 px-8 py-3.5 text-sm font-bold text-primary hover:bg-surface/50 transition-all"
              >
                Get in Touch <Mail className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
    </>
  )
}


