import React from 'react';
import { FadeIn } from '@/components/home/shared-primitives';

export default function WhatWeDo() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      <FadeIn>
        <div className="absolute inset-0 bg-gradient-to-r from-red-300 to-red-400" />
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(45deg, transparent 45%, var(--color-text-primary) 50%, transparent 55%)`,
            backgroundSize: '100px 100px' 
          }} 
        />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            What We Do?
          </h2>
          <p className="text-xl md:text-2xl font-medium text-white/90">
            &gt; Execution-Focused Ecosystem
          </p>
        </div>
      </FadeIn>
    </section>
  );
}
