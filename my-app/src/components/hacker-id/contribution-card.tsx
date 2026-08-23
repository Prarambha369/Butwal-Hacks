"use client";

import Image from 'next/image';
import { Project } from '@/lib/supabase-types';
import Link from 'next/link';
import { ExternalLink, LayoutGrid, Star, GitFork, GitCommit, BookOpen } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/utils';
import { formatCount } from '@/lib/github';


interface ContributionCardProps {
  project: Project;
  isOwner?: boolean;
}

export default function ContributionCard({ project, isOwner }: ContributionCardProps) {
  const meta = project.github_meta;

  return (
    <div className="group relative bh-card overflow-hidden transition-all hover:border-primary-red/40 hover:bg-background/[0.07] duration-300">
      <div className="flex items-start p-4 gap-4">
        <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-border bg-surface-hover">
          {project.cover_image ? (
            <Image 
              src={cloudinaryUrl(project.cover_image, 400)} 
              alt={project.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-red/20 to-transparent">
              <LayoutGrid className="w-6 h-6 text-primary/20" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-primary truncate group-hover:text-primary-red transition-colors">
              {project.title}
            </h4>
            {isOwner && (
              <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-bh-red-500 text-primary">
                Lead
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 opacity-70">
            {project.description || 'No description provided.'}
          </p>

          {/* GitHub metadata row */}
          {meta && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60" title="Stars">
                <Star className="w-3 h-3" />
                {formatCount(meta.stargazers_count)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60" title="Forks">
                <GitFork className="w-3 h-3" />
                {formatCount(meta.forks_count)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60" title="Commits">
                <GitCommit className="w-3 h-3" />
                {formatCount(meta.commit_count)}
              </span>
              {meta.language && (
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {meta.language}
                </span>
              )}
            </div>
          )}

          {/* README preview */}
          {meta?.readme_preview && (
            <div className="flex items-start gap-1.5 pt-0.5">
              <BookOpen className="w-3 h-3 text-muted-foreground/40 mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground/50 leading-relaxed line-clamp-2">
                {meta.readme_preview}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Link 
              href={`/projects/${project.id}`}
              className="text-[10px] font-bold text-accent-teal hover:underline flex items-center gap-1"
            >
              View Case Study <ExternalLink className="w-3 h-3" />
            </Link>
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-muted-foreground/60 hover:text-primary-red transition-colors flex items-center gap-1"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
