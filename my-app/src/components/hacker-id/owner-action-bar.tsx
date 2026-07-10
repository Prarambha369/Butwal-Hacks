"use client";

import React from 'react';
import {ShieldCheck, Camera, Calendar} from 'lucide-react';


interface OwnerActionBarProps {
  role: string;
}

export default function OwnerActionBar({ role }: OwnerActionBarProps) {
  // We only show the action bar if the user is an Organizer
  if (role !== 'Organizer') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-10 duration-500">
      <div className="lg-surface rounded-full p-2 border border-bh-red-500/30 shadow-2xl flex items-center justify-between gap-2 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-2 border-r border-glass">
          <div className="w-2 h-2 rounded-full bg-bh-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">
            Issuer Mode
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-1 justify-center">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-bh-red-500 text-primary text-xs font-bold hover:bg-bh-red-600 transition-all active:scale-95 shadow-[0_0_15px_var(--glow-bh-red)]">
            <ShieldCheck size={14} />
            Issue Certificate
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/10 text-primary text-xs font-bold border border-glass hover:bg-surface/10 transition-all active:scale-95">
            <Calendar size={14} />
            Register Event
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/10 text-primary text-xs font-bold border border-glass hover:bg-surface/10 transition-all active:scale-95">
            <Camera size={14} />
            Upload Photos
          </button>
        </div>
      </div>
    </div>
  );
}
