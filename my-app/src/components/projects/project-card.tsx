"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Github, ExternalLink, Heart, Code2 } from 'lucide-react';

import { cloudinaryUrl } from '@/lib/utils';
import { Project } from '@/lib/supabase-types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const likesCount = project.project_likes?.[0]?.count || 0;

  return (
    <div className="bh-card rounded-xl p-4 group relative overflow-hidden transition-transform duration-300 hover:-translate-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
        {project.cover_image ? (
          <Image 
            src={cloudinaryUrl(project.cover_image, 600)} 
            alt={project.title}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface-hover flex items-center justify-center border border-border">
            <Code2 className="w-12 h-12 text-primary/20" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <div className="px-2 py-1 rounded-full bg-background/60 border border-border text-primary text-xs font-medium flex items-center gap-1">
            <Heart className="w-3 h-3 text-primary-red fill-red-500" />
            {likesCount}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-primary leading-tight line-clamp-1 group-hover:text-primary-red transition-colors">
            {project.title}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech_stack.slice(0, 3).map((tech, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-mono text-muted-foreground">
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 3 && (
            <span className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-mono text-muted-foreground">
              +{project.tech_stack.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Link 
            href={`/projects/${project.id}`} 
            className="flex-1 py-2 rounded-lg bg-surface-hover hover:bg-background/20 text-primary text-center text-xs font-semibold transition-all"
          >
            View Project
          </Link>
          {project.github_url && (
            <a 
              href={project.github_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-surface-hover hover:bg-surface-hover text-muted-foreground hover:text-primary transition-all flex items-center justify-center"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {project.demo_url && (
            <a 
              href={project.demo_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-surface-hover hover:bg-surface-hover text-muted-foreground hover:text-primary transition-all flex items-center justify-center"
              title="Demo"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
