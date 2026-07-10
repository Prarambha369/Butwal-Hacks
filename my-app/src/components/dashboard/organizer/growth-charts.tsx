'use client';

import React from 'react';
import {Users, FolderPlus} from 'lucide-react';

interface GrowthData {
  month: string;
  users: number;
  projects: number;
}

export default function GrowthCharts({ data }: { data: GrowthData[] }) {
  const maxUsers = Math.max(...data.map(d => d.users));
  const maxProjects = Math.max(...data.map(d => d.projects));

  const createUserPath = () => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.users / maxUsers) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  };

  const createProjectPath = () => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.projects / maxProjects) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* User Growth Chart */}
      <div className="p-6 rounded-2xl bg-surface/10 border border-glass space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-status-blue/20 rounded-xl flex items-center justify-center text-status-blue">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-bold">User Acquisition</h3>
          </div>
          <span className="text-xs font-bold text-status-blue bg-status-blue/10 px-2 py-1 rounded-full">
            +1,800% growth
          </span>
        </div>
        
        <div className="h-64 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="userGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-status-blue)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-status-blue)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map(tick => (
              <line 
                key={tick} 
                x1="0" y1={tick} x2="100" y2={tick} 
                stroke="var(--color-glass-border-subtle)" strokeWidth="0.5" 
              />
            ))}
            {/* Area Fill */}
            <path 
              d={`${createUserPath()} L 100,100 L 0,100 Z`} 
              fill="url(#userGradient)" 
            />
            {/* Line */}
            <path 
              d={createUserPath()} 
              fill="none" stroke="var(--color-status-blue)" strokeWidth="2" strokeLinejoin="round" 
            />
            {/* Data Points */}
            {data.map((d, i) => (
              <circle 
                key={i} 
                cx={(i / (data.length - 1)) * 100} 
                cy={100 - (d.users / maxUsers) * 100} 
                r="1.5" fill="var(--color-status-blue)" 
              />
            ))}
          </svg>
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-1 text-[10px] text-secondary">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>
      </div>

      {/* Project Growth Chart */}
      <div className="p-6 rounded-2xl bg-surface/10 border border-glass space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-status-green/20 rounded-xl flex items-center justify-center text-status-green">
              <FolderPlus size={20} />
            </div>
            <h3 className="text-lg font-bold">Project Submissions</h3>
          </div>
          <span className="text-xs font-bold text-status-green bg-status-green/10 px-2 py-1 rounded-full">
            +3,000% growth
          </span>
        </div>
        
        <div className="h-64 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="projectGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-status-green)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-status-green)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map(tick => (
              <line 
                key={tick} 
                x1="0" y1={tick} x2="100" y2={tick} 
                stroke="var(--color-glass-border-subtle)" strokeWidth="0.5" 
              />
            ))}
            {/* Area Fill */}
            <path 
              d={`${createProjectPath()} L 100,100 L 0,100 Z`} 
              fill="url(#projectGradient)" 
            />
            {/* Line */}
            <path 
              d={createProjectPath()} 
              fill="none" stroke="var(--color-status-green)" strokeWidth="2" strokeLinejoin="round" 
            />
            {/* Data Points */}
            {data.map((d, i) => (
              <circle 
                key={i} 
                cx={(i / (data.length - 1)) * 100} 
                cy={100 - (d.projects / maxProjects) * 100} 
                r="1.5" fill="var(--color-status-green)" 
              />
            ))}
          </svg>
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-1 text-[10px] text-secondary">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>
      </div>
    </div>
  );
}
