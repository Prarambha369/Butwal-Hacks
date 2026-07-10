"use client";

import React from 'react';
import { TrendingUp } from 'lucide-react';


interface StatPoint {
  date: string;
  views: number;
  likes: number;
}

interface ProjectStatsChartProps {
  data: StatPoint[];
  color?: string;
}

export default function ProjectStatsChart({ data, color = "var(--color-bh-red-500)" }: ProjectStatsChartProps) {
  if (!data || data.length === 0) return null;

  const maxViews = Math.max(...data.map(d => d.views));
  const width = 300;
  const height = 60;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.views / maxViews) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface/10 border border-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-bh-red-500" />
          <span className="text-[10px] font-mono text-secondary uppercase tracking-widest">7-Day View Trend</span>
        </div>
        <span className="text-xs font-bold">{data[data.length-1].views} views today</span>
      </div>
      <div className="relative h-16 w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((d, i) => (
            <circle 
              key={i} 
              cx={(i / (data.length - 1)) * width} 
              cy={height - (d.views / maxViews) * height} 
              r="3" 
              fill={color} 
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
