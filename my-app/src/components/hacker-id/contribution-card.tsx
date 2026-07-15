"use client";

import Image from 'next/image';
import { Project } from '@/lib/supabase-types';
import Link from 'next/link';
import { ExternalLink, LayoutGrid } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/utils';


interface ContributionCardProps {
  project: Project;
  isOwner?: boolean;
}

export default function ContributionCard({ project, isOwner }: ContributionCardProps) {
  return (
    <div className="group relative bh-card overflow-hidden transition-all hover:border-primary-red/40 hover:bg-background/[0.07] duration-300">
      <div className="flex items-center p-4 gap-4">
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
          <div className="flex items-center gap-3 pt-1">
            <Link 
              href={`/projects/${project.id}`}
              className="text-[10px] font-bold text-accent-teal hover:underline flex items-center gap-1"
            >
              View Case Study <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
