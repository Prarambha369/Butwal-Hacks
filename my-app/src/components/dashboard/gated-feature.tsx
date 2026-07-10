"use client";

import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GatedFeatureProps {
  minXp: number;
  userXp: number;
  children: React.ReactNode;
  featureName: string;
  className?: string;
}

export default function GatedFeature({ 
  minXp, 
  userXp, 
  children, 
  featureName, 
  className 
}: GatedFeatureProps) {
  const isLocked = userXp < minXp;

  if (isLocked) {
    return (
      <div className={cn("relative group", className)}>
        <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] rounded-full flex items-center justify-center cursor-help transition-all group-hover:bg-background/40">
          <Lock className="w-3 h-3 text-secondary" />
        </div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
          <div className="bg-background text-primary text-[10px] px-2 py-1 rounded whitespace-nowrap">
            Requires {minXp} XP to unlock {featureName}
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
