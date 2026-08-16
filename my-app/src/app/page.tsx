import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import ImpactMetrics from '@/components/home/impact-metrics';
import LiveStatsCounter from '@/components/home/live-stats-counter';
import EventCalendar from '@/components/home/event-calendar';
import EventGallery from '@/components/home/event-gallery';
import NonProfitFAQ from '@/components/home/non-profit-faq';
import TrustedBy from '@/components/home/trusted-by';
import { FadeIn } from '@/components/home/shared-primitives';
import StaggeredFeatures from '@/components/home/staggered-features';
import DatabaseTable from '@/components/home/database-table';
import TypographyBlocks from '@/components/home/typography-blocks';
import FeaturesCTA from '@/components/home/features-cta';
import ContactCTA from '@/components/sections/ContactCTA';
import Footer from '@/components/sections/Footer';
import { buildPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildPageMetadata({
  title: "Butwal Hacks — The Pulse of Innovation in Western Nepal",
  description:
    "A youth-led nonprofit building structured pathways from learning to building to launching real-world technology initiatives in Western Nepal. Free hackathons, mentorship, and verified credentials.",
  path: "/",
});

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-primary">
      <Navbar />
      <main>
        {/* Block 1: Hero */}
        <Hero />

        {/* Block 2: Trusted By (social proof) */}
        <TrustedBy />

        {/* Block 3: Live Stats Counter (animated DB metrics) */}
        <LiveStatsCounter />

        {/* Block 4: Impact Metrics (values) */}
        <ImpactMetrics />

        {/* Block 5: Events Calendar */}
        <EventCalendar />

        {/* Block 6: Event Gallery */}
        <EventGallery />

        {/* Block 7: Staggered Feature Grid — Notion-inspired offset cards */}
        <FadeIn>
          <StaggeredFeatures />
        </FadeIn>

        {/* Block 9: Database Table — Notion-style project view */}
        <FadeIn delay={120}>
          <DatabaseTable />
        </FadeIn>

        {/* Block 10: Typography Blocks — Notion document-style section */}
        <FadeIn delay={240}>
          <TypographyBlocks />
        </FadeIn>

        {/* Block 11: FAQ */}
        <NonProfitFAQ />

        {/* Block 12: Feature Grid + Final CTA */}
        <FeaturesCTA />

        {/* Block 13: CTA Section */}
        <ContactCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
