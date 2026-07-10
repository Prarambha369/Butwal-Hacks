"use client";

import React from 'react';
import { FadeIn } from '@/components/home/shared-primitives';
import { cn } from '@/lib/utils';

const milestones = [
  {
    date: 'Q3 2026',
    title: 'Regional Mentor Network',
    description: 'A formal mentor pool connecting builders across campuses and local communities in Lumbini Province.',
    side: 'left',
  },
  {
    date: 'Q4 2026',
    title: 'Builder Fellowship',
    description: 'A cohort model for youth shipping real projects with milestone-based mentorship and accountability.',
    side: 'right',
  },
  {
    date: 'Q1 2027',
    title: 'Open Labs Partnership',
    description: 'Institutional collaboration with schools and colleges for recurring hands-on innovation labs.',
    side: 'left',
  },
];

export default function RoadmapCards() {
  return (
    <section className="w-full bg-bg py-24 md:py-32">
      <FadeIn>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          {/* Center Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-400 -translate-x-1/2 hidden md:block" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex flex-col md:flex-row items-center justify-between gap-8",
                  milestone.side === 'right' ? "md:flex-row-reverse" : ""
                )}
              >
                {/* Content Card */}
                <div className="w-full md:w-[45%] group">
                  <div className="p-8 rounded-2xl bg-neutral-600 border border-neutral-500 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-red-300 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <span className="text-red-300 font-bold text-sm uppercase tracking-widest mb-2 block">
                      {milestone.date}
                    </span>
                    <h3 className="text-2xl font-bold text-neutral-50 mb-4">
                      {milestone.title}
                    </h3>
                    <p className="text-neutral-200 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>

                {/* Timeline Dot */}
                <div className="relative z-10 flex items-center justify-center hidden md:flex">
                  <div className="h-4 w-4 rounded-full bg-red-300 ring-4 ring-bg shadow-[0_0_15px_rgba(254,0,0,0.6)]" />
                </div>

                {/* Spacer for layout balance on desktop */}
                <div className="hidden md:block w-[45%]" />
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}


