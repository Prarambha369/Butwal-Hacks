"use client";

import React from 'react';
import Image from 'next/image';
import { Project } from '@/lib/hacker-id';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group relative bh-glass-surface rounded-3xl border border-white/10 overflow-hidden transition-all duration-500 hover:border-red-500/30 hover:shadow-2xl hover:-translate-y-1">
      {/* Project Image Section */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image 
          src={project.image} 
          alt={project.name} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 to-transparent" />
        
        {/* Origin Tag */}
        <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white uppercase tracking-widest">
          {project.hackathonOrigin}
        </div>
      </div>

      {/* Project Content */}
      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <h4 className="text-text-primary font-bold text-xl leading-tight group-hover:text-red-500 transition-colors">
            {project.name}
          </h4>
          <p className="text-text-secondary text-sm line-clamp-2 opacity-70">
            {project.description}
          </p>
        </div>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span key={tech} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-text-secondary">
              {tech}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <a 
            href={project.githubUrl} 
            target="_blank" 
            className="flex-1 text-center px-4 py-2 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-all"
          >
            Code
          </a>
          <a 
            href={project.demoUrl} 
            target="_blank" 
            className="flex-1 text-center px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(230,57,70,0.3)] hover:bg-red-600 transition-all"
          >
            Demo
          </a>
        </div>
      </div>
    </div>
  );
}
