"use client";

import React, { useState } from 'react';
import { Search, MessageSquare, User, Settings, Bell, ChevronRight } from 'lucide-react';

export default function NavigationSection() {
  const [edgeEffect, setEdgeEffect] = useState<'soft' | 'hard'>('soft');

  return (
    <section id="navigation" className="py-32 px-6 md:px-20 bg-color-bg-secondary dark:bg-color-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <span className="text-blue-600 font-bold text-xs tracking-widest uppercase block mb-4">
            Information Architecture
          </span>
          <h2 className="text-4xl md:text-6xl text-apple-bold leading-tight">
            Navigation Focus. <br />
            Less Decoration, More Structure.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Demo 1: Grouped Controls */}
          <div className="flex flex-col gap-8">
            <div className="p-8 liquid-glass rounded-[32px] border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-4">Shared Backgrounds</h3>
              <p className="text-text-secondary text-sm mb-8">
                Hierarchy is expressed through grouping. Related actions share a single 
                material surface, reducing visual noise and clarifying intent.
              </p>
              
              <div className="flex justify-center py-10 bg-gray-100 dark:bg-gray-900 rounded-2xl">
                {/* Grouped API simulation */}
                <div className="liquid-glass capsule p-1 flex items-center gap-1 shadow-sm">
                  <button className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm text-blue-600 transition-all active:scale-90">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button className="p-3 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all active:scale-90 text-text-primary">
                    <User className="w-5 h-5" />
                  </button>
                  <button className="p-3 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all active:scale-90 text-text-primary">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="mt-6 text-xs text-center text-text-secondary italic">
                "Items grouped using the correct API share a background"
              </p>
            </div>
          </div>

          {/* Demo 2: Scroll Edge Effects */}
          <div className="flex flex-col gap-8">
            <div className="p-8 liquid-glass rounded-[32px] border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-4">Scroll Edge Effects</h3>
              <p className="text-text-secondary text-sm mb-8">
                Replacing hard dividers with subtle blurs. 
                <span className="font-bold text-text-primary"> Soft </span> for iOS/iPadOS, 
                <span className="font-bold text-text-primary"> Hard </span> for macOS.
              </p>

              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setEdgeEffect('soft')}
                  className={`px-4 py-2 text-xs font-bold capsule transition-all ${edgeEffect === 'soft' ? 'bg-text-primary text-white' : 'liquid-glass'}`}
                >
                  Soft (iOS)
                </button>
                <button 
                  onClick={() => setEdgeEffect('hard')}
                  className={`px-4 py-2 text-xs font-bold capsule transition-all ${edgeEffect === 'hard' ? 'bg-text-primary text-white' : 'liquid-glass'}`}
                >
                  Hard (macOS)
                </button>
              </div>

              <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
                {/* The "Pinned" Control */}
                <div className="absolute top-0 left-0 right-0 h-14 liquid-glass z-20 flex items-center px-4 justify-between border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm font-bold">Pinned Header</span>
                  <ChevronRight className="w-4 h-4" />
                </div>

                {/* The Edge Effect Overlay */}
                <div className={`absolute top-0 left-0 right-0 h-14 z-10 pointer-events-none transition-all duration-500 ${
                  edgeEffect === 'soft' 
                  ? 'bg-gradient-to-b from-white/40 to-transparent backdrop-blur-sm' 
                  : 'bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-gray-300 dark:border-gray-700'
                }`} />

                {/* Content */}
                <div className="p-4 pt-20 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* The Search Tab Visualization */}
        <div className="mt-20 p-12 liquid-glass rounded-[40px] flex flex-col md:flex-row items-center gap-12 border-blue-100 dark:border-blue-900/20">
          <div className="relative w-48 h-96 bg-gray-900 rounded-[40px] border-[6px] border-gray-800 shadow-2xl shrink-0">
             <div className="absolute bottom-0 left-0 right-0 h-20 liquid-glass border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-4 pb-4">
                <div className="w-6 h-6 bg-gray-400 rounded-full" />
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-blue-500/30">
                  <Search className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full" />
                <div className="w-6 h-6 bg-gray-400 rounded-full" />
             </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold mb-4">The Essential Search Tab</h3>
            <p className="text-text-secondary text-lg leading-relaxed">
              "iOS now includes a dedicated Search tab at the bottom, making it quicker to access 
              and easier to reach." By promoting Search to a primary navigation level, 
              we reduce friction for users when content isn't immediately visible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
