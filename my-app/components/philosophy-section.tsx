"use client";

import React from 'react';
import { motion } from 'framer-motion'; // Assuming framer-motion is available, if not I will use CSS
import { Target, Layers, Zap, Heart } from 'lucide-react';

export default function PhilosophySection() {
  const principles = [
    {
      icon: <Layers className="w-6 h-6 text-blue-600" />,
      title: "Unobtrusive Structure",
      description: "UI should support interaction where needed, and remain invisible when it's not. Liquid Glass floats above content to bring clarity without stealing focus."
    },
    {
      icon: <Target className="w-6 h-6 text-purple-600" />,
      title: "Spatial Grounding",
      description: "Interactions should feel spatial yet grounded. Elements spring from their source, reinforcing the relationship between the trigger and the action."
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: "Adaptive Continuity",
      description: "One anatomy, every surface. Whether on a narrow iPhone or an expansive Mac, the experience carries forward without interruption."
    },
    {
      icon: <Heart className="w-6 h-6 text-red-600" />,
      title: "Optimistic Spirit",
      description: "Using a family of system colors that work in harmony across all appearances, maintaining the unique optimistic spirit of the ecosystem."
    }
  ];

  return (
    <section id="philosophy" className="py-32 px-6 md:px-20 bg-white dark:bg-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 dark:bg-blue-900/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-200/30 dark:bg-purple-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-20 text-center">
          <span className="text-blue-600 font-bold text-xs tracking-widest uppercase block mb-4">
            The North Star
          </span>
          <h2 className="text-4xl md:text-6xl text-apple-bold leading-tight mb-6">
            Reshaping the <br />
            Relationship with Content.
          </h2>
          <p className="text-text-secondary max-w-3xl mx-auto text-lg leading-relaxed">
            Liquid Glass isn't just a visual update—it's a new set of heuristics. 
            It's about moving toward a shared design foundation that maintains flow 
            across devices, screen sizes, and input modes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((p, i) => (
            <div 
              key={i} 
              className="p-8 liquid-glass rounded-[32px] border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-500 group hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {p.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{p.title}</h3>
              <p className="text-text-secondary leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <div className="inline-block p-1 liquid-glass rounded-full border-gray-200 dark:border-gray-800">
             <div className="px-8 py-4 bg-text-primary text-white dark:bg-white dark:text-black rounded-full font-bold cursor-pointer hover:opacity-90 transition-all">
               Read the Full Human Interface Guidelines
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
