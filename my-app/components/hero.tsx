"use client";

import React from 'react';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-start px-6 md:px-20 py-20 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full relative z-10">
        <div className="space-y-8">
          <span className="bh-badge bh-badge-live animate-pulse">
            Est. 2024 • Butwal, Nepal
          </span>
          
          <h1 className="bh-h1 max-w-4xl leading-[1.1]">
            Powering Nepal's Next <br />
            <span className="text-red-500">Generation of Builders.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl leading-relaxed">
            We are decentralizing technology education in Lumbini Province. 
            Join a community of hackers, makers, and visionaries building 
            the future of Western Nepal.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-6">
            <button className="bh-btn-primary px-8 py-4 text-lg">
              Start Building
            </button>
            <button className="bh-btn-secondary px-8 py-4 text-lg">
              Explore the Hub
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
