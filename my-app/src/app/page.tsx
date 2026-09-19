import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import ImpactMetrics from '@/components/home/impact-metrics';
import LiveStatsCounter from '@/components/home/live-stats-counter';
import NonProfitFAQ from '@/components/home/non-profit-faq';
import StaggeredFeatures from '@/components/home/staggered-features';
import FeaturedProjects from '@/components/home/featured-projects';
import StepsStrip from '@/components/home/steps-strip';
import EventCalendar from '@/components/home/event-calendar';
import CalendarErrorBoundary from '@/components/home/calendar-error-boundary';
import TrustedBy from '@/components/home/trusted-by';
import ContactCTA from '@/components/sections/ContactCTA';
import Footer from '@/components/sections/Footer';
import { FadeIn } from '@/components/home/shared-primitives';
import { getFeaturedProjects } from '@/lib/actions/projects';
import { createServiceClient } from '@/utils/supabase';
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
 * database-table (showcase rows), typography-blocks (manifesto
 * repetition), event-gallery (stock photos), features-cta (duplicate
 * cards).
 *
 * Restored with real data: event-calendar (published events plotted,
 * organizer publishing flows through automatically) and trusted-by
 * (maintainer-managed partner wall, hidden until a partner exists).
 */
export default async function LandingPage() {
  const projects = await getFeaturedProjects(6);

  // Published events feed the calendar grid. Publishing is the only
  // step an organizer takes — no separate calendar management exists.
  const supabase = createServiceClient();
  const { data: publishedEvents } = await supabase
    .from("events")
    .select("title, slug, start_date, end_date")
    .eq("is_published", true)
    .order("start_date", { ascending: true })
    .limit(200);
  const calendarEvents = ((publishedEvents ?? []) as Array<{
    title: string; slug: string | null; start_date: string; end_date: string | null;
  }>).map((e) => ({ title: e.title, slug: e.slug, start_date: e.start_date, end_date: e.end_date }));

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

        {/* 5b. When — published events on the calendar, with .ics sync */}
        <CalendarErrorBoundary>
          <EventCalendar events={calendarEvents} />
        </CalendarErrorBoundary>

        {/* 6. How it goes — orientation, no ask */}
        <FadeIn delay={180}>
          <StepsStrip />
        </FadeIn>

        {/* 7. Answers */}
        <NonProfitFAQ />

        {/* 7b. Who backs us — maintainer wall, hidden until real */}
        <TrustedBy />

        {/* 8. The single invitation */}
        <ContactCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
