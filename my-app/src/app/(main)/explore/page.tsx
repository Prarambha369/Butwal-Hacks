import { PROFILE_SETTINGS_PATH } from "@/lib/routes";
import { createServiceClient } from "@/utils/supabase";
import type { Metadata } from "next"
import Link from "next/link"
import { Users, GraduationCap, ArrowRight } from "lucide-react"
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
  const [explorerMembers, { count: mentorCount }] = await Promise.all([
    fetchExplorerMembers(supabase),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("open_to_mentor", true)
      .not("bh_id", "is", null),
  ]);
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

        {/* ── MENTORS STRIP (links /mentors + onboarding path) ────── */}
        <section aria-label="Mentors" className="border-y border-border bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-green/10 text-status-green">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-primary">
                  {mentorCount ?? 0} mentor{(mentorCount ?? 0) === 1 ? "" : "s"} taking 1:1 calls
                </p>
                <p className="text-sm text-muted-foreground">
                  Stuck on a bug or a career call? Book time. Developers volunteer office hours here.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/mentors" className="bh-btn-primary text-sm">
                Find a mentor <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={PROFILE_SETTINGS_PATH} className="bh-btn-secondary text-sm">
                Become a mentor
              </Link>
            </div>
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
