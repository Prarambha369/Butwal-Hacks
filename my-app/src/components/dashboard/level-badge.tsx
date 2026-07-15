"use client";

import { calculateLevel } from '@/lib/gamification/levels';
import { Trophy } from 'lucide-react';

interface LevelBadgeProps {
  xp: number;
}

export default function LevelBadge({ xp }: LevelBadgeProps) {
  const { level, name, color } = calculateLevel(xp);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-hover border border-border text-xs font-mono">
      <Trophy size={12} className={color} />
      <span className={color}>Lvl {level}</span>
      <span className="opacity-40 mx-1">|</span>
      <span className="opacity-80">{name}</span>
    </div>
  );
}
