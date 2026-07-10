"use client";

import React from 'react';
import { Zap, Users, Handshake } from 'lucide-react';
import { StaggerReveal } from '@/components/home/shared-primitives';

const pillars = [
  {
    title: 'Integrity',
    description: 'Clear governance, public documentation, and consistent standards that build lasting trust.',
    icon: Zap,
  },
  {
    title: 'Community',
    description: 'Supportive pathways where every person can learn, contribute, and belong.',
    icon: Users,
  },
  {
    title: 'Action-First',
    description: 'Real projects, hands-on mentorship, and build-first experiences over theory.',
    icon: Handshake,
  },
];

export default function ValuePillars() {
  return (
    <section className="w-full bg-bg py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerReveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div 
                key={pillar.title}
                className="group relative p-8 rounded-2xl bg-neutral-600 border border-neutral-500 transition-all duration-300 hover:-translate-y-2 hover:border-red-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-300/10 text-red-300 group-hover:bg-red-300 group-hover:text-white transition-colors">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-50 mb-4">
                  {pillar.title}
                </h3>
                <p className="text-neutral-200 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </StaggerReveal>
      </div>
    </section>
  );
}
