"use client";

import React from 'react';
import { TrendingUp, Heart, MessageSquare, Eye, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectImpactProps {
  projectId: string;
  views: number;
  likes: number;
  comments: number;
  verified: boolean;
}

export default function ProjectImpactReport({ projectId, views, likes, comments, verified }: ProjectImpactProps) {
  // Calculate Impact Score
  // Formula: (Views * 0.1) + (Likes * 1) + (Comments * 2)
  const score = Math.round((views * 0.1) + (likes * 1) + (comments * 2));
  
  const getImpactLevel = (s: number) => {
    if (s > 500) return { label: 'Legendary', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    if (s > 100) return { label: 'High Impact', color: 'text-teal-400', bg: 'bg-teal-400/10' };
    if (s > 20) return { label: 'Growing', color: 'text-blue-400', bg: 'bg-blue-400/10' };
    return { label: 'Emerging', color: 'text-secondary', bg: 'bg-surface/10' };
  };

  const level = getImpactLevel(score);

  return (
    <div className="space-y-6 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-glass">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-bh-red-500" /> Impact Analysis
        </h3>
        <button 
          onClick={async () => {
            const { distributeProjectXP } = await import('@/lib/actions/xp');
            try {
              await distributeProjectXP(projectId, 100);
              toast.success('XP distributed to all contributors!');
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : 'Distribution failed');
            }
          }}
          className="px-3 py-1 rounded-full bg-bh-red-500/10 text-bh-red-500 text-[10px] font-bold uppercase hover:bg-bh-red-500 hover:text-primary transition-all"
        >
          Distribute XP
        </button>
        <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", level.bg, level.color)}>
          {level.label}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface/10 border border-glass text-center space-y-1">
          <div className="flex justify-center mb-2"><Eye className="w-4 h-4 text-blue-400" /></div>
          <p className="text-xl font-bold">{views}</p>
          <p className="text-[10px] font-mono text-secondary uppercase">Views</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface/10 border border-glass text-center space-y-1">
          <div className="flex justify-center mb-2"><Heart className="w-4 h-4 text-bh-red-500" /></div>
          <p className="text-xl font-bold">{likes}</p>
          <p className="text-[10px] font-mono text-secondary uppercase">Likes</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface/10 border border-glass text-center space-y-1">
          <div className="flex justify-center mb-2"><MessageSquare className="w-4 h-4 text-teal-400" /></div>
          <p className="text-xl font-bold">{comments}</p>
          <p className="text-[10px] font-mono text-secondary uppercase">Comments</p>
        </div>
        <div className="p-4 rounded-2xl bg-bh-red-500/10 border border-bh-red-500/20 text-center space-y-1">
          <div className="flex justify-center mb-2"><TrendingUp className="w-4 h-4 text-bh-red-500" /></div>
          <p className="text-xl font-bold text-bh-red-500">{score}</p>
          <p className="text-[10px] font-mono text-bh-red-500 uppercase">Score</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-surface/10 border border-glass space-y-2">
        <p className="text-xs text-secondary leading-relaxed">
          The impact score is a weighted aggregation of community engagement. 
          {verified ? " This project is verified by Butwal Hacks maintainers, boosting its trust signal." : " Verification by maintainers can further boost this project's visibility."}
        </p>
      </div>
    </div>
  );
}
