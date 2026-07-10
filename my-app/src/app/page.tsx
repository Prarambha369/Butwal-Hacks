import React from 'react';
import SiteHeader from '@/components/site-header';
import Hero from '@/components/sections/Hero';
import ImpactNumbers from '@/components/sections/ImpactNumbers';
import MissionSection from '@/components/sections/MissionSection';
import ValuePillars from '@/components/sections/ValuePillars';
import WhatWeDo from '@/components/sections/WhatWeDo';
import BentoShowcaseGrid from '@/components/home/bento-showcase-grid';
import LatestUpdates from '@/components/sections/LatestUpdates';
import ContactCTA from '@/components/sections/ContactCTA';
import Footer from '@/components/sections/Footer';
import { getFeaturedProjects } from '@/lib/actions/projects';

export default async function LandingPage() {
  const featuredProjects = await getFeaturedProjects(3);

  return (
    <div className="min-h-screen bg-bg-base text-text-body">
      <SiteHeader />
      <main>
        <Hero />
        <ImpactNumbers />
        <MissionSection />
        <ValuePillars />
        <WhatWeDo />
        {featuredProjects.length > 0 && (
          <BentoShowcaseGrid projects={featuredProjects as any} />
        )}
        <LatestUpdates />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  );
}
