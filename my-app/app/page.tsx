import React from 'react';
import LiquidGlassNav from '@/components/liquid-glass-nav';
import ImmersionHero from '@/components/immersion-hero';
import PhilosophySection from '@/components/philosophy-section';
import GeometrySection from '@/components/geometry-section';
import ContinuitySection from '@/components/continuity-section';
import InteractionSection from '@/components/interaction-section';
import NavigationSection from '@/components/navigation-section';

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <LiquidGlassNav />
      <ImmersionHero />
      <PhilosophySection />
      <GeometrySection />
      <ContinuitySection />
      <InteractionSection />
      <NavigationSection />
    </main>
  );
}
