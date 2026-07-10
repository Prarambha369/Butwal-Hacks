"use client";

import React from 'react';

export default function ContactCTA() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Red Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-300 to-red-400" />
      
      {/* Subtle texture overlay (diagonal wave simulation) */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(45deg, transparent 45%, var(--color-text-primary) 50%, transparent 55%)`,
          backgroundSize: '100px 100px' 
        }} 
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Thank you for your interest in Butwal Hacks.
          </h2>
          <p className="text-xl md:text-2xl font-medium text-white/90 max-w-3xl mx-auto">
            We would love to hear from you and discuss how we can help bring your digital ideas to life. 
            Here are the different ways you can get in touch with us.
          </p>
        </div>

        <div className="bg-bg rounded-3xl border border-border p-8 md:p-12 shadow-2xl max-w-4xl mx-auto">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-neutral-300 text-sm font-bold uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                className="w-full px-4 py-3 rounded-xl bg-neutral-600 border border-neutral-500 text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-red-300 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-neutral-300 text-sm font-bold uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                className="w-full px-4 py-3 rounded-xl bg-neutral-600 border border-neutral-500 text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-red-300 transition-colors"
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="text-neutral-300 text-sm font-bold uppercase tracking-wider">Why are you contacting us?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Web Design', 'Mobile App Design', 'Collaboration', 'Others'].map((option) => (
                  <label key={option} className="flex items-center gap-3 p-4 rounded-xl bg-neutral-600 border border-neutral-500 cursor-pointer hover:border-red-300 transition-colors">
                    <input type="checkbox" className="w-5 h-5 accent-red-300" />
                    <span className="text-neutral-50 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="text-neutral-300 text-sm font-bold uppercase tracking-wider">Budget Range</label>
              <div className="flex items-center gap-6">
                <span className="text-neutral-400 font-mono">$1000</span>
                <input 
                  type="range" 
                  min="1000" 
                  max="5000" 
                  className="w-full h-2 bg-neutral-500 rounded-lg appearance-none cursor-pointer accent-red-300" 
                />
                <span className="text-neutral-400 font-mono">$5000</span>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-neutral-300 text-sm font-bold uppercase tracking-wider">Your Message</label>
              <textarea 
                rows={4} 
                placeholder="Tell us more about your project..." 
                className="w-full px-4 py-3 rounded-xl bg-neutral-600 border border-neutral-500 text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-red-300 transition-colors"
              />
            </div>
            <div className="md:col-span-2 flex justify-center pt-4">
              <button 
                type="submit" 
                className="px-12 py-4 rounded-full bg-red-300 text-white font-bold text-lg transition-all hover:bg-red-400 hover:shadow-[0_0_20px_rgba(254,0,0,0.4)] active:scale-95"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
