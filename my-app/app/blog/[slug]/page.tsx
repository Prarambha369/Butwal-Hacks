"use client";

import React from 'react';

export default function BlogPost() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-3xl mx-auto">
        {/* Blog Header */}
        <div className="space-y-6 mb-12">
          <span className="bh-badge">Engineering Log</span>
          <h1 className="bh-h1 text-4xl md:text-6xl">
            Scaling Youth Innovation in <br />
            <span className="text-red-500">Lumbini Province.</span>
          </h1>
          <div className="flex items-center gap-4 text-text-secondary font-mono text-sm">
            <span>June 04, 2026</span>
            <span>•</span>
            <span>5 min read</span>
            <span>•</span>
            <span className="text-red-400">By Butwal Hacks Team</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="bh-card-inner aspect-video relative rounded-[32px] overflow-hidden mb-12">
          <img 
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c đặt-crop&q=80&w=1200" 
            alt="Blog Cover" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="space-y-8 text-lg leading-relaxed text-text-secondary">
          <p>
            The landscape of technology education in Nepal is shifting. For too long, 
            innovation has been concentrated in the capital. But in the heart of 
            Lumbini Province, a new movement is taking shape.
          </p>
          
          <h2 className="bh-h3 text-text-primary">The Decentralization Thesis</h2>
          <p>
            We believe that the proximity to the problem is the greatest catalyst for 
            the solution. By building a regional hub in Butwal, we are creating a 
            space where builders don't just learn to code—they learn to solve.
          </p>
          
          <div className="p-6 bh-glass-surface rounded-[24px] border-l-4 border-red-500 my-8">
            <p className="italic text-text-primary font-medium">
              "The goal is not to create more developers, but to create more problem-solvers 
              who happen to use code as their primary tool."
            </p>
          </div>

          <h2 className="bh-h3 text-text-primary">Infrastructure as a Service</h2>
          <p>
            Through our fellowships and hackathons, we provide the high-bandwidth 
            internet, mentorship, and community that youth in the region often lack. 
            This removes the friction from the creative process.
          </p>

          <div className="bg-surface-grey p-6 rounded-[20px] font-mono text-sm leading-loose overflow-x-auto">
            <span className="text-blue-400">const</span> <span className="text-yellow-300">innovation</span> = (youth, tools) =&gt; {'{'} <br />
            &nbsp;&nbsp;<span className="text-text-secondary">// Decentralize education</span> <br />
            &nbsp;&nbsp;<span className="text-blue-400">return</span> youth.empower(tools).build(region.lumbini); <br />
            {'}'};
          </div>
        </div>
      </div>
    </div>
  );
}
