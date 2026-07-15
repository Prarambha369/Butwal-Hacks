/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';
import { Github, ExternalLink, Heart, Calendar, Users, Code2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';


import { cloudinaryUrl } from '@/lib/utils';
import type { Project } from '@/lib/supabase-types';

interface ExtendedProject extends Project {
  project_likes?: { count: number }[];
  teams?: { members?: { profiles?: { avatar_url?: string; full_name?: string; bh_id?: string } }[] } | null;
  profiles?: { avatar_url?: string; full_name?: string; bh_id?: string } | null;
}

interface ProjectDetailProps {
  project: ExtendedProject | null;
}

export default function ProjectDetailView({ project }: ProjectDetailProps) {
  if (!project) return null;

  const likesCount = project.project_likes?.[0]?.count || 0;

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden rounded-xl mb-8">
        {project.cover_image ? (
          <Image 
            src={cloudinaryUrl(project.cover_image, 1200)} 
            alt={project.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface-hover flex items-center justify-center border border-border">
            <Code2 className="w-20 h-20 text-primary/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 w-full">
          <Link 
            href="/projects" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Gallery
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight mb-4">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-hover border border-border text-primary text-xs font-medium">
              <Calendar className="w-3 h-3" />
              {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recent'}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-deep-red/20 border border-red-600/30 text-primary-red text-xs font-medium">
              <Users className="w-3 h-3" />
              {project.teams?.members?.length || 1} Contributor{project.teams?.members?.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary-red" />
              Project Overview
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {project.description || "No description provided for this project."}
            </p>
            
            <div className="flex flex-wrap gap-3">
              {project.tech_stack?.map((tech: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full bg-surface-hover border border-border text-xs font-mono text-muted-foreground">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <a 
              href={project.github_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-6 bh-card hover:border-primary-red/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-surface-hover text-primary group-hover:bg-deep-red transition-colors">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source Code</p>
                  <p className="text-base font-bold text-primary">GitHub Repository</p>
                </div>
              </div>
            </a>
            <a 
              href={project.demo_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-6 bh-card hover:border-primary-red/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-surface-hover text-primary group-hover:bg-deep-red transition-all">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Live Demo</p>
                  <p className="text-base font-bold text-primary">View Prototype</p>
                </div>
              </div>
            </a>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          <div className="p-8 bh-card space-y-6">
            <h3 className="text-xl font-bold text-primary">Contributors</h3>
            <div className="space-y-4">
              {project.teams?.members?.map((member, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {member.profiles?.avatar_url ? (
                    <img 
                      src={member.profiles?.avatar_url} 
                      className="w-11 h-11 rounded-full border border-border object-cover"
                      alt={member.profiles?.full_name || 'Contributor'}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full border border-border bg-surface-hover flex items-center justify-center text-xs text-muted-foreground">
                      {(member.profiles?.full_name || '?')[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-primary">{member.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{member.profiles?.bh_id}</p>
                  </div>
                </div>
              ))}
              {!project.teams?.members && (
                <div className="flex items-center gap-3">
                  {project.profiles?.avatar_url ? (
                    <img 
                      src={project.profiles?.avatar_url} 
                      className="w-11 h-11 rounded-full border border-border object-cover"
                      alt={project.profiles?.full_name || 'Creator'}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full border border-border bg-surface-hover flex items-center justify-center text-xs text-muted-foreground">
                      {(project.profiles?.full_name || '?')[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-primary">{project.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{project.profiles?.bh_id}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Community Love</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-deep-red/20 border border-red-600/30 text-primary-red text-xs font-bold">
                <Heart className="w-3 h-3 fill-red-500" />
                {likesCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
