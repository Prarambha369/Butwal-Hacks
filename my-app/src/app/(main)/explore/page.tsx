import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next"
import { Users } from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"
import { fetchExplorerMembers, getExplorerStats } from "@/lib/members"
import SafeJsonLd from "@/lib/json-ld"
import { ExplorerClient } from "./explorer-client"
import { ExploreCta } from "./explore-cta"
import { ExploreHero } from "./explore-hero"

// ISR: revalidate every 60 seconds so new signups appear within a minute
export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Explore — Butwal Hacks Community",
  description:
    "Discover builders, mentors, and organizers in the Butwal Hacks community. Browse profiles, search by BH-ID, and find your next collaborator.",
  path: "/explore",
  keywords: ["member directory", "BH-ID explorer", "community profiles", "tech talent Nepal"],
})

export default async function ExplorePage() {
  const supabase = await createClient();
  const explorerMembers = await fetchExplorerMembers(supabase);
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
          totalXp={stats.totalXp}
        />

        {/* ── MEMBER DIRECTORY ────────────────────────────────────── */}
        <section className="py-16 md:py-20" aria-label="Member Directory">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary-red" />
                  <h2 className="text-sm font-bold text-primary">Community</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.total} people building the future of tech in Lumbini Province.
                </p>
              </div>
            </div>

            {/* Client-Side Interactive Explorer */}
            <ExplorerClient members={explorerMembers} />

            {/* Static fallback for JS-disabled users */}
            <noscript>
              <div className="mt-8 p-8 text-center rounded-xl border border-border bg-surface">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Enable JavaScript to browse the full member directory, search by BH-ID, and connect with the community.
                </p>
              </div>
            </noscript>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <ExploreCta totalMembers={stats.total} />
      </main>
    </>
  )
}
