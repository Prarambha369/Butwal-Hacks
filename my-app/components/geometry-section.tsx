"use client";

import React from 'react';

export default function GeometrySection() {
  return (
    <section id="geometry" className="py-32 px-6 md:px-20 bg-color-bg-secondary dark:bg-color-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <span className="text-blue-600 font-bold text-xs tracking-widest uppercase block mb-4">
            The Math of Beauty
          </span>
          <h2 className="text-4xl md:text-6xl text-apple-bold leading-tight">
            Quiet Geometry. <br />
            Driven by Concentricity.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Fixed Shapes */}
          <div className="flex flex-col gap-6">
            <div className="aspect-square liquid-glass rounded-[24px] flex items-center justify-center shadow-sm border-gray-200 dark:border-gray-800 p-8">
              <div className="w-full h-full bg-blue-500/10 rounded-[24px] flex items-center justify-center border-2 border-dashed border-blue-400/30">
                <span className="text-xs font-mono text-blue-600">Radius: 24px (Fixed)</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Fixed Shapes</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Maintains a constant corner radius regardless of the container size or padding. Best for standalone elements.
              </p>
            </div>
          </div>

          {/* Capsules */}
          <div className="flex flex-col gap-6">
            <div className="aspect-square liquid-glass rounded-[9999px] flex items-center justify-center shadow-sm border-gray-200 dark:border-gray-800 p-8">
              <div className="w-full h-12 bg-indigo-500/10 capsule flex items-center justify-center border-2 border-dashed border-indigo-400/30">
                <span className="text-xs font-mono text-indigo-600">Radius: H / 2</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Capsules</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                The radius is exactly half the height. This creates the perfect pill shape seen in sliders, switches, and buttons.
              </p>
            </div>
          </div>

          {/* Concentric Shapes */}
          <div className="flex flex-col gap-6">
            <div className="aspect-square liquid-glass rounded-[32px] flex items-center justify-center shadow-sm border-gray-200 dark:border-gray-800 p-6">
              {/* Parent: 32px radius, Padding: 24px */}
              <div className="w-full h-full bg-purple-500/10 concentric-child flex items-center justify-center border-2 border-dashed border-purple-400/30 p-4 text-center">
                <span className="text-xs font-mono text-purple-600">
                  Parent(32px) - Padding(24px) = <br />Child(8px)
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Concentric Shapes</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                The "golden rule" of Apple design. Radii are calculated by subtracting padding from the parent's radius to avoid "pinched" corners.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24 p-8 md:p-12 liquid-glass capsule flex flex-col md:flex-row items-center justify-between gap-8 border-blue-200 dark:border-blue-900/30">
          <div className="max-w-xl">
            <h4 className="text-2xl font-bold mb-2">Avoid the "Tension"</h4>
            <p className="text-text-secondary">
              When radii don't align concentrically, corners feel either too pinched or too flared, breaking the visual balance.
            </p>
          </div>
          <button className="capsule bg-blue-600 text-white px-6 py-3 font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg">
            View Guidelines
          </button>
        </div>
      </div>
    </section>
  );
}
