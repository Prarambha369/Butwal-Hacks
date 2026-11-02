import { createServiceClient } from "@/utils/supabase";
import type { Metadata } from "next"
import { Users } from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"
import { fetchExplorerMembers, getExplorerStats } from "@/lib/members"
import SafeJsonLd from "@/lib/json-ld"
import { ExplorerClient } from "./explorer-client"
import { ExploreCta } from "./explore-cta"
import { ExploreHero } from "./explore-hero"
import { CommunityPlatforms } from "@/components/community/community-platforms"
import { TestimonialsSection } from "@/components/testimonials"
import TestimonialForm from "@/components/community/testimonial-form"
import ExcuseGenerator from "@/components/home/excuse-generator"

// ISR: revalidate every 60 seconds so new signups appear within a minute
export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Explore — Butwal Hacks Community",
  description:
    "Meet the builders, mentors, and organizers of Butwal Hacks. Look anyone up by BH-ID and find your next teammate.",
  path: "/explore",
  keywords: ["member directory", "BH-ID explorer", "community profiles", "tech talent Nepal"],
})

export default async function ExplorePage() {
  const supabase = createServiceClient();
  // Independent reads run in parallel so one slow query never stalls the page.
  const [explorerMembers] = await Promise.all([fetchExplorerMembers(supabase)]);
  const stats = getExplorerStats(explorerMembers);

  return (
    <>
      <SafeJsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Explore — Butwal Hacks Community",
        description: "Discover builders, mentors, and organizers in the Butwal Hacks community.",
        url: "https://butwalhacks.com/explore",
        about: {
          "@type": "NGO",
          name: "Butwal Hacks",
          description: "A nonprofit youth technology initiative in Butwal, Nepal.",
        },
      }} />

      <main className="min-h-dvh bg-background">
        {/* ── HERO WITH ANIMATED STATS ────────────────────────────── */}
        <ExploreHero
          totalMembers={stats.total}
          totalBuilders={stats.byRole.Builder}
          totalProjects={stats.totalProjects}
          totalEvents={stats.totalEvents}
        />

        {/* ── MEMBER DIRECTORY ────────────────────────────────────── */}
        <section className="py-12 md:py-16" aria-label="Member Directory">
          <div className="mx-auto max-w-6xl px-4">
            {/* The count already appears in the hero stats and the aria-label.
                Repeating it here was the third instance on one screen. */}
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-primary">Member directory</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search by name, BH-ID, or skill.
              </p>
            </div>

            {/* Client-Side Interactive Explorer */}
            <ExplorerClient members={explorerMembers} />

            {/* Static fallback for JS-disabled users */}
            <noscript>
              <div className="mt-8 p-8 text-center rounded-xl border border-border bg-surface">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Enable JavaScript to browse the full member directory, search by BH-ID, and connect with the community.
                </p>
              </div>
            </noscript>
          </div>
        </section>

        {/* ── WHERE WE HANG OUT (migrated from /community) ──────────── */}
        <CommunityPlatforms />

        {/* ── TESTIMONIALS (migrated from /community — sole surface) ── */}
        <TestimonialsSection />
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <TestimonialForm />
        </div>

        {/* ── EXCUSE GENERATOR (moved from homepage) ───────────────── */}
        <ExcuseGenerator />

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <ExploreCta />
      </main>
    </>
  )
}
