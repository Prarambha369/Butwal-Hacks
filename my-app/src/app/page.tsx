import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import ImpactMetrics from '@/components/home/impact-metrics';
import LiveStatsCounter from '@/components/home/live-stats-counter';
import NonProfitFAQ from '@/components/home/non-profit-faq';
import StaggeredFeatures from '@/components/home/staggered-features';
import FeaturedProjects from '@/components/home/featured-projects';
import StepsStrip from '@/components/home/steps-strip';
import ContactCTA from '@/components/sections/ContactCTA';
import Footer from '@/components/sections/Footer';
import { FadeIn } from '@/components/home/shared-primitives';
import { getFeaturedProjects } from '@/lib/actions/projects';
import { buildPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildPageMetadata({
  title: "Butwal Hacks: Free Hackathons for Students in Nepal",
  description:
    "Butwal Hacks runs free hackathons, workshops, and mentorship for students across Nepal. No fees, no experience needed. Just show up and build.",
  path: "/",
});

export const dynamic = "force-static";

/**
 * Landing page — one calm narrative, no filler:
 *   belong (Hero) → proof (live stats) → values → tools →
 *   real work (featured builds) → how it goes (steps) →
 *   answers (FAQ) → one invitation (ContactCTA).
 *
 * Retired from this composition (files kept for later real-data use):
 * trusted-by (unverifiable logos), database-table (showcase rows),
 * typography-blocks (manifesto repetition), event-gallery (stock photos),
 * event-calendar (dateless widget), features-cta (duplicate cards).
 */
export default async function LandingPage() {
  const projects = await getFeaturedProjects(6);

  return (
    <div className="min-h-dvh bg-background text-primary">
      <Navbar />
      <main>
        {/* 1. Belong */}
        <Hero />

        {/* 2. Proof — live from the database */}
        <LiveStatsCounter />

        {/* 3. Values */}
        <ImpactMetrics />

        {/* 4. Tools */}
        <FadeIn>
          <StaggeredFeatures />
        </FadeIn>

        {/* 5. Real work — community builds, honest empty state */}
        <FadeIn delay={120}>
          <FeaturedProjects projects={projects} />
        </FadeIn>

        {/* 6. How it goes — orientation, no ask */}
        <FadeIn delay={180}>
          <StepsStrip />
        </FadeIn>

        {/* 7. Answers */}
        <NonProfitFAQ />

        {/* 8. The single invitation */}
        <ContactCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
