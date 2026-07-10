/* eslint-disable @next/next/no-img-element */
import React from 'react';
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
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden rounded-3xl mb-8">
        {project.cover_image ? (
          <Image 
            src={cloudinaryUrl(project.cover_image, 1200)} 
            alt={project.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface/10 flex items-center justify-center border border-glass">
            <Code2 className="w-20 h-20 text-primary/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 w-full">
          <Link 
            href="/projects" 
            className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Gallery
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight mb-4">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface/10 backdrop-blur-md border border-glass text-primary text-xs font-medium">
              <Calendar className="w-3 h-3" />
              {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recent'}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bh-red-600/20 border border-red-600/30 text-bh-red-500 text-xs font-medium">
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
              <Code2 className="w-6 h-6 text-bh-red-500" />
              Project Overview
            </h2>
            <p className="text-lg text-secondary leading-relaxed">
              {project.description || "No description provided for this project."}
            </p>
            
            <div className="flex flex-wrap gap-3">
              {project.tech_stack?.map((tech: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full bg-surface/10 border border-glass text-xs font-mono text-secondary">
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
              className="p-6 rounded-3xl lg-surface hover:border-bh-red-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-surface/10 text-primary group-hover:bg-bh-red-600 transition-colors">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Source Code</p>
                  <p className="text-base font-bold text-primary">GitHub Repository</p>
                </div>
              </div>
            </a>
            <a 
              href={project.demo_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-6 rounded-3xl lg-surface hover:border-bh-red-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-surface/10 text-primary group-hover:bg-bh-red-600 transition-all">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-secondary">Live Demo</p>
                  <p className="text-base font-bold text-primary">View Prototype</p>
                </div>
              </div>
            </a>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          <div className="p-8 rounded-3xl lg-surface space-y-6">
            <h3 className="text-xl font-bold text-primary">Contributors</h3>
            <div className="space-y-4">
              {project.teams?.members?.map((member, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {member.profiles?.avatar_url ? (
                    <img 
                      src={member.profiles?.avatar_url} 
                      className="w-11 h-11 rounded-full border border-glass object-cover"
                      alt={member.profiles?.full_name || 'Contributor'}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full border border-glass bg-surface/10 flex items-center justify-center text-xs text-secondary">
                      {(member.profiles?.full_name || '?')[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-primary">{member.profiles?.full_name}</p>
                    <p className="text-xs text-secondary font-mono">{member.profiles?.bh_id}</p>
                  </div>
                </div>
              ))}
              {!project.teams?.members && (
                <div className="flex items-center gap-3">
                  {project.profiles?.avatar_url ? (
                    <img 
                      src={project.profiles?.avatar_url} 
                      className="w-11 h-11 rounded-full border border-glass object-cover"
                      alt={project.profiles?.full_name || 'Creator'}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full border border-glass bg-surface/10 flex items-center justify-center text-xs text-secondary">
                      {(project.profiles?.full_name || '?')[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-primary">{project.profiles?.full_name}</p>
                    <p className="text-xs text-secondary font-mono">{project.profiles?.bh_id}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-glass flex items-center justify-between">
              <span className="text-sm text-secondary">Community Love</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bh-red-600/20 border border-red-600/30 text-bh-red-500 text-xs font-bold">
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
