"use client";


import Image from 'next/image';
import { Project } from '@/lib/supabase-types';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group relative lg-surface rounded-3xl border border-glass overflow-hidden transition-all hover:border-bh-red-500/50 hover:-translate-y-1 duration-300">
      <div className="aspect-video relative overflow-hidden bg-surface/10">
        {project.cover_image ? (
          <Image 
            src={cloudinaryUrl(project.cover_image, 600)} 
            alt={project.title}
            fill
            className="object-cover transition-transform group-hover:scale-105 duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bh-red-500/20 to-transparent">
            <div className="w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center text-primary/20">
              <ExternalLink className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h4 className="text-lg font-bold text-primary group-hover:text-bh-red-500 transition-colors">
            {project.title}
          </h4>
          <p className="text-xs font-mono text-accent-teal uppercase tracking-wider mt-1">
            {project.event_id ? `Event: ${project.event_id}` : 'Independent Project'}
          </p>
        </div>
        <p className="text-sm text-secondary line-clamp-2 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {project.tech_stack?.map(tech => (
            <span key={tech} className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] font-medium text-secondary">
              {tech}
            </span>
          ))}
        </div>
        <Link 
          href={`/projects/${project.id}`}
          className="block w-full py-2 rounded-xl bg-surface/10 border border-glass text-center text-xs font-bold hover:bg-surface/10 transition-colors"
        >
          View Project Details
        </Link>
      </div>
    </div>
  );
}
