"use client";

import React from 'react';
import { Project } from '@/lib/hacker-id';
import ProjectCard from './project-card';

interface ProjectShowcaseProps {
  projects: Project[];
}

export default function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  if (projects.length === 0) {
    return (
      <div className="bh-glass-surface rounded-3xl p-12 border border-white/10 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-text-secondary opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <p className="text-text-secondary font-mono text-sm opacity-60">
          No projects shipped yet. The compiler awaits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-text-primary opacity-40">
          Shipped Projects
        </h3>
        <span className="text-[10px] font-mono text-text-secondary opacity-60">
          {projects.length} Projects
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
