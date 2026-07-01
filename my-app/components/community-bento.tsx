"use client";

import React from 'react';

const bentoItems = [
  {
    title: "The Makers",
    description: "A diverse collective of students, engineers, and designers.",
    size: "lg", // 2x2
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    tag: "Community"
  },
  {
    title: "Build Logs",
    description: "Shipping in public, one commit at a time.",
    size: "sm", // 1x1
    image: "https://images.unsplash.com/photo-1587620962725-abab7ly-800", // Placeholder
    tag: "Transparency"
  },
  {
    title: "Local Impact",
    description: "Empowering the youth of Butwal.",
    size: "sm", // 1x1
    image: "https://images.unsplash.com/photo-1531482615713-2afd6b9536d3?auto=format&fit=crop&q=80&w=800",
    tag: "Impact"
  },
  {
    title: "The Hub",
    description: "Where ideas become reality.",
    size: "md", // 2x1
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    tag: "Infrastructure"
  }
];

export default function CommunityBento() {
  return (
    <section className="py-20 w-full max-w-6xl mx-auto px-6 md:px-20 space-y-12">
      <div className="text-left space-y-4">
        <span className="bh-badge">The Collective</span>
        <h2 className="bh-h2">Human-Centric Innovation.</h2>
        <p className="text-text-secondary max-w-2xl">
          We aren't just a non-profit; we're a peer-to-peer network of builders. 
          Our strength lies in the intersection of different disciplines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">
        {/* Large Feature (2x2) */}
        <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[32px] bh-glass-surface p-2">
          <div className="relative w-full h-full overflow-hidden rounded-[24px] bh-card-inner">
            <img 
              src={bentoItems[0].image} 
              alt={bentoItems[0].title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-8 flex flex-col justify-end">
              <span className="bh-badge mb-3 w-fit">{bentoItems[0].tag}</span>
              <h3 className="text-2xl font-bold text-text-primary mb-2">{bentoItems[0].title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{bentoItems[0].description}</p>
            </div>
          </div>
        </div>

        {/* Small item (1x1) */}
        <div className="relative group overflow-hidden rounded-[32px] bh-glass-surface p-2 h-full">
          <div className="relative w-full h-full overflow-hidden rounded-[24px] bh-card-inner">
            <img 
              src={bentoItems[1].image} 
              alt={bentoItems[1].title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end">
              <span className="bh-badge mb-2 w-fit text-[10px]">{bentoItems[1].tag}</span>
              <h3 className="text-lg font-bold text-text-primary">{bentoItems[1].title}</h3>
            </div>
          </div>
        </div>

        {/* Small item (1x1) */}
        <div className="relative group overflow-hidden rounded-[32px] bh-glass-surface p-2 h-full">
          <div className="relative w-full h-full overflow-hidden rounded-[24px] bh-card-inner">
            <img 
              src={bentoItems[2].image} 
              alt={bentoItems[2].title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end">
              <span className="bh-badge mb-2 w-fit text-[10px]">{bentoItems[2].tag}</span>
              <h3 className="text-lg font-bold text-text-primary">{bentoItems[2].title}</h3>
            </div>
          </div>
        </div>

        {/* Medium item (2x1) */}
        <div className="md:col-span-2 relative group overflow-hidden rounded-[32px] bh-glass-surface p-2 h-full">
          <div className="relative w-full h-full overflow-hidden rounded-[24px] bh-card-inner">
            <img 
              src={bentoItems[3].image} 
              alt={bentoItems[3].title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-8 flex flex-col justify-end">
              <span className="bh-badge mb-3 w-fit">{bentoItems[3].tag}</span>
              <h3 className="text-2xl font-bold text-text-primary mb-2">{bentoItems[3].title}</h3>
              <p className="text-text-secondary text-sm">{bentoItems[3].description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
