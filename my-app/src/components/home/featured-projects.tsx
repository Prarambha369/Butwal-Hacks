"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Heart, Star } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/utils';
import type { Project } from '@/lib/supabase-types';

interface FeaturedProjectsProps {
  projects: Project[];
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <section className="py-20 space-y-12">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-bh-red-500">Spotlight</span>
          <h2 className="text-3xl font-bold tracking-tight">Featured Innovations</h2>
        </div>
        <Link 
          href="/projects" 
          className="text-sm font-bold text-bh-red-500 hover:underline flex items-center gap-1"
        >
          View All <ExternalLink size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div key={project.id} className="lg-surface rounded-[20px] p-4 group cursor-pointer transition-all duration-500 hover:-translate-y-2">
            <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
              <Image 
                src={cloudinaryUrl(project.cover_image, 600) || '/placeholder-project.jpg'} 
                alt={project.title || 'Project Image'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-background/50 backdrop-blur-md text-primary text-[10px] font-mono flex items-center gap-1">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                Featured
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold group-hover:text-bh-red-500 transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-secondary line-clamp-2 opacity-80">
                {project.description}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-glass">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-bh-red-500" />
                  <span className="text-xs font-mono opacity-60">
                    {Array.isArray(project.project_likes) ? project.project_likes[0]?.count || 0 : 0} likes
                  </span>
                </div>
                <Link 
                  href={`/projects/${project.id}`} 
                  className="text-xs font-bold uppercase tracking-tighter hover:text-bh-red-500 transition-colors"
                >
                  Details →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
