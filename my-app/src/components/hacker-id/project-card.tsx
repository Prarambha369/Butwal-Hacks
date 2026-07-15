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
    <div className="group relative bh-card overflow-hidden transition-all hover:border-primary-red/50 hover:-translate-y-1 duration-300">
      <div className="aspect-video relative overflow-hidden bg-surface-hover">
        {project.cover_image ? (
          <Image 
            src={cloudinaryUrl(project.cover_image, 600)} 
            alt={project.title}
            fill
            className="object-cover transition-transform group-hover:scale-105 duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-red/20 to-transparent">
            <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-primary/20">
              <ExternalLink className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h4 className="text-lg font-bold text-primary group-hover:text-primary-red transition-colors">
            {project.title}
          </h4>
          <p className="text-xs font-mono text-accent-teal uppercase tracking-wider mt-1">
            {project.event_id ? `Event: ${project.event_id}` : 'Independent Project'}
          </p>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {project.tech_stack?.map(tech => (
            <span key={tech} className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-medium text-muted-foreground">
              {tech}
            </span>
          ))}
        </div>
        <Link 
          href={`/projects/${project.id}`}
          className="block w-full py-2 rounded-lg bg-surface-hover border border-border text-center text-xs font-bold hover:bg-surface-hover transition-colors"
        >
          View Project Details
        </Link>
      </div>
    </div>
  );
}
