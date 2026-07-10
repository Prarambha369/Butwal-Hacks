"use client";

import React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { GlassCard } from '@/components/ui/glass-card';
import { Palette, Zap, Shield, Globe, Layers } from 'lucide-react';

export default function DesignSystemPage() {
  const redScale = [
    { name: 'bh-red-50', color: '#ffecec' },
    { name: 'bh-red-100', color: '#ffb9b9' },
    { name: 'bh-red-200', color: '#ff7c7c' },
    { name: 'bh-red-500', color: '#FE0000' },
    { name: 'bh-red-600', color: '#B10000' },
    { name: 'bh-red-700', color: '#7b0000' },
    { name: 'bh-red-800', color: '#420000' },
  ];

  const neutralScale = [
    { name: 'bh-grey-50', color: '#FFFFFF' },
    { name: 'bh-grey-100', color: '#d6d6d6' },
    { name: 'bh-grey-200', color: '#afafaf' },
    { name: 'bh-grey-300', color: '#898989' },
    { name: 'bh-grey-400', color: '#656565' },
    { name: 'bh-grey-500', color: '#434343' },
    { name: 'bh-grey-600', color: '#242424' },
  ];

  return (
    <div className="min-h-screen bg-background text-primary pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-6xl mx-auto space-y-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bh-red-500/10 text-bh-red-500 text-xs font-bold uppercase tracking-widest border border-bh-red-500/20">
              <Palette size={14} /> Design System
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              Liquid <span className="text-bh-red-500">Glass</span>
            </h1>
            <p className="text-lg text-secondary max-w-2xl">
              The official design language of Butwal Hacks. A synchronized system of 
              translucency, depth, and brand-centric colors that adapt to user preference.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-secondary">Current Theme:</span>
            <ThemeToggle />
          </div>
        </div>

        {/* 1. Brand Palette Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bh-red-500 flex items-center justify-center text-primary">
              <Palette size={18} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Official Color Palette</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Red Scale */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-widest text-secondary">Butwal Red Scale</h3>
              <div className="grid grid-cols-1 gap-2">
                {redScale.map((item) => (
                  <div key={item.name} className="flex items-center gap-4 p-2 rounded-xl bg-surface border border-glass transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-lg shadow-inner" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-sm font-bold">{item.name}</span>
                    <span className="ml-auto font-mono text-xs text-secondary">{item.color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neutral Scale */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-widest text-secondary">Neutral Scale (Dark/Light)</h3>
              <div className="grid grid-cols-1 gap-2">
                {neutralScale.map((item) => (
                  <div key={item.name} className="flex items-center gap-4 p-2 rounded-xl bg-surface border border-glass transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-lg shadow-inner" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-sm font-bold">{item.name}</span>
                    <span className="ml-auto font-mono text-xs text-secondary">{item.color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Liquid Glass Proof Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bh-red-500 flex items-center justify-center text-primary">
              <Layers size={18} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Liquid Glass Adaptability</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard variant="default" padding="lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-surface text-primary"><Zap size={20} /></div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-secondary px-2 py-1 rounded-full bg-surface border border-glass">Core Engine</span>
                </div>
                <h3 className="text-xl font-bold text-primary tracking-tight">Semantic Sync</h3>
                <p className="text-sm leading-relaxed text-secondary">Using CSS variables, this card automatically swaps its opacity and border color when you toggle themes.</p>
              </div>
            </GlassCard>
            <GlassCard variant="default" padding="lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-surface text-primary"><Shield size={20} /></div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-secondary px-2 py-1 rounded-full bg-surface border border-glass">Trust Network</span>
                </div>
                <h3 className="text-xl font-bold text-primary tracking-tight">Brand Fidelity</h3>
                <p className="text-sm leading-relaxed text-secondary">The official Butwal Red remains vibrant and constant, ensuring brand recognition regardless of the mode.</p>
              </div>
            </GlassCard>
            <GlassCard variant="default" padding="lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-surface text-primary"><Globe size={20} /></div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-secondary px-2 py-1 rounded-full bg-surface border border-glass">Global Reach</span>
                </div>
                <h3 className="text-xl font-bold text-primary tracking-tight">AEO Ready</h3>
                <p className="text-sm leading-relaxed text-secondary">Designed for high contrast and readability, making it an ideal source for AI and human users alike.</p>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* 3. Technical Breakdown */}
        <section className="lg-surface rounded-[32px] p-8 md:p-12 space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Technical Architecture</h2>
            <p className="text-secondary leading-relaxed mb-6">
              The system uses a <strong>variable-first approach</strong>. Instead of hard-coding Tailwind&apos;s 
              <code>dark:</code> classes everywhere, we define semantic roles. This allows for a more 
              fluid transition and easier maintenance.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-background/50 border border-glass space-y-2">
                <div className="text-bh-red-500 font-bold uppercase mb-2">Dark Base</div>
                <div className="flex justify-between"><span>Background</span> <span className="text-secondary">#242424</span></div>
                <div className="flex justify-between"><span>Surface</span> <span className="text-secondary">#434343</span></div>
                <div className="flex justify-between"><span>Text</span> <span className="text-secondary">#FFFFFF</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-background/50 border border-glass space-y-2">
                <div className="text-bh-red-500 font-bold uppercase mb-2">Light Base</div>
                <div className="flex justify-between"><span>Background</span> <span className="text-secondary">#FFFFFF</span></div>
                <div className="flex justify-between"><span>Surface</span> <span className="text-secondary">#F5F5F7</span></div>
                <div className="flex justify-between"><span>Text</span> <span className="text-secondary">#1C1C1E</span></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}