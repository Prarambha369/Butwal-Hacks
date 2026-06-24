"use client";

import React from 'react';
import { Plus, ShieldCheck, Camera, Calendar } from 'lucide-react';
import Link from 'next/link';

interface OwnerActionBarProps {
  role: string;
}

export default function OwnerActionBar({ role }: OwnerActionBarProps) {
  // We only show the action bar if the user is an Organizer
  if (role !== 'Organizer') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bh-glass-surface rounded-full p-2 border border-red-500/30 shadow-2xl flex items-center justify-between gap-2 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-2 border-r border-white/10">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-primary opacity-60">
            Issuer Mode
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-1 justify-center">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all active:scale-95 shadow-[0_0_15px_rgba(230,57,70,0.3)]">
            <ShieldCheck size={14} />
            Issue Certificate
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white text-xs font-bold border border-white/10 hover:bg-white/10 transition-all active:scale-95">
            <Calendar size={14} />
            Register Event
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white text-xs font-bold border border-white/10 hover:bg-white/10 transition-all active:scale-95">
            <Camera size={14} />
            Upload Photos
          </button>
        </div>
      </div>
    </div>
  );
}
