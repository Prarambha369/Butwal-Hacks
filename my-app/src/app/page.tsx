import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import ImpactMetrics from '@/components/home/impact-metrics';
import NonProfitFAQ from '@/components/home/non-profit-faq';
import TrustedBy from '@/components/home/trusted-by';
import { FadeIn } from '@/components/home/shared-primitives';
import StaggeredFeatures from '@/components/home/staggered-features';
import DatabaseTable from '@/components/home/database-table';
import TypographyBlocks from '@/components/home/typography-blocks';
import FeaturedProjects from '@/components/home/featured-projects';
import ContactCTA from '@/components/sections/ContactCTA';
import Footer from '@/components/sections/Footer';

export const dynamic = "force-static";

/** Featured builds — hardcoded static data so the homepage can be fully static. */
const featuredProjects = [
  {
    id: "proj-001",
    title: "Smart Agro Nepal",
    description:
      "An IoT-powered crop monitoring system that uses soil sensors and weather APIs to help farmers in Lumbini Province optimize irrigation and reduce water waste by 40%.",
    cover_image: null,
    tech_stack: ["React", "Node.js", "Arduino", "TensorFlow Lite"],
    project_likes: [{ count: 47 }],
  },
  {
    id: "proj-002",
    title: "EduBridge LMS",
    description:
      "A lightweight learning management system designed for rural schools with intermittent internet. Syncs course materials via SMS fallback and works offline-first on mobile.",
    cover_image: null,
    tech_stack: ["Next.js", "Supabase", "PWA", "Twilio"],
    project_likes: [{ count: 38 }],
  },
  {
    id: "proj-003",
    title: "MediChain Records",
    description:
      "Blockchain-based medical record storage for district hospitals. Patients control access via QR codes; doctors get instant lab history across facilities.",
    cover_image: null,
    tech_stack: ["Solidity", "Flutter", "IPFS", "FastAPI"],
    project_likes: [{ count: 52 }],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-primary">
      <Navbar />
      <main>
        {/* Block 1: Hero */}
        <Hero />

        {/* Block 2: Trusted By (social proof) */}
        <TrustedBy />

        {/* Block 3: Impact Metrics */}
        <ImpactMetrics />

        {/* Block 4: Staggered Feature Grid — Notion-inspired offset cards */}
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

        {/* Featured Projects — hardcoded static data */}
        <FeaturedProjects projects={featuredProjects} />

        {/* Block 11: FAQ */}
        <NonProfitFAQ />

        {/* Block 12: CTA Section */}
        <ContactCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
