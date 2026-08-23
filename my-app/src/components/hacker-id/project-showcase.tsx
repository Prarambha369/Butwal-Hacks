"use client";

import { Project } from '@/lib/supabase-types';
import { Code2 } from 'lucide-react';
import ContributionCard from './contribution-card';

interface ProjectShowcaseProps {
  projects: Project[];
  isProfileView?: boolean;
}

export default function ProjectShowcase({ projects, isProfileView = false }: ProjectShowcaseProps) {
  if (projects.length === 0) {
    return (
      <div className="bh-card p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto">
          <Code2 className="w-8 h-8 text-muted-foreground opacity-20" />
        </div>
        <p className="text-muted-foreground font-mono text-sm opacity-60">
          No projects shipped yet. The compiler awaits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary opacity-40">
          {isProfileView ? 'Project Contributions' : 'Shipped Projects'}
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground opacity-60">
          {projects.length} Projects
        </span>
      </div>

      <div className={isProfileView ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
        {projects.map((project) => (
          isProfileView ? (
            <ContributionCard key={project.id} project={project} />
          ) : (
            <ProjectCard key={project.id} project={project} />
          )
        ))}
      </div>
    </div>
  );
}

import ProjectCard from './project-card';
