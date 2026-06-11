import React from 'react';

export default function ImmersionHero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-start px-6 md:px-20 overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl">
        <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
          Design System 2026
        </span>
        <h1 className="text-5xl md:text-8xl text-apple-bold leading-[1.1] mb-8">
          Design for the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
            Human Experience.
          </span>
        </h1>
        <p className="text-lg md:text-2xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
          A harmonized design language that's more cohesive, adaptive and expressive. 
          Bringing structure and clarity without ever stealing focus.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="capsule bg-text-primary text-white dark:bg-white dark:text-black text-lg font-bold px-8 py-4 hover:opacity-90 transition-all active:scale-95 shadow-xl">
            Explore Principles
          </button>
          <button className="capsule liquid-glass text-text-primary text-lg font-bold px-8 py-4 hover:bg-white/50 dark:hover:bg-white/10 transition-all active:scale-95">
            Watch Video
          </button>
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <span className="text-xs font-medium uppercase tracking-widest">Scroll to discover</span>
        <div className="w-px h-12 bg-gradient-to-b from-text-primary to-transparent" />
      </div>
    </section>
  );
}
