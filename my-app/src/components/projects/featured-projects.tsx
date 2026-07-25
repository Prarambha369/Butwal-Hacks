"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase';
import { Project } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';
import { cloudinaryUrl } from '@/lib/utils';
import Link from 'next/link';
import { Award, ExternalLink } from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { logger } from '@/lib/logger';

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        // Fetch projects that are verified and have high engagement
        // In a real app, we'd have a 'featured' boolean in the DB
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('github_verified', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        logger.error('Error fetching featured projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) return <div className="flex justify-center p-20"><RoseSpinner size="lg" /></div>;
  if (projects.length === 0) {
    return (
      <section className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center">
            <Award className="w-8 h-8 text-muted-foreground opacity-20" />
          </div>
          <p className="text-sm text-muted-foreground font-mono opacity-60">
            No featured projects yet. Verified projects appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-heading flex items-center gap-2">
            <Award className="w-6 h-6 text-primary-red" /> Featured Innovations
          </h2>
          <p className="text-muted-foreground">Top-rated projects verified by the community.</p>
        </div>
        <Link href="/projects" className="text-xs font-bold text-primary-red hover:underline">
          View All Projects →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project, idx) => (
          <div 
            key={project.id} 
            className={cn(
              "group relative bh-card overflow-hidden transition-all hover:border-primary-red/50 hover:-translate-y-1 duration-300",
              idx === 0 && "ring-2 ring-bh-red-500/50 shadow-2xl shadow-primary-red/10"
            )}
          >
            <div className="aspect-video relative overflow-hidden bg-surface-hover">
              {project.cover_image ? (
                <Image src={cloudinaryUrl(project.cover_image, 600)} alt={project.title} fill className="object-cover transition-transform group-hover:scale-105 duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-red/20 to-transparent">
                  <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-primary/20">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                </div>
              )}
              {idx === 0 && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-bh-red-500 text-primary text-[10px] font-bold uppercase tracking-tighter">
                  Editor&apos;s Choice
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-lg font-bold group-hover:text-primary-red transition-colors">{project.title}</h4>
                <p className="text-xs font-mono text-accent-teal uppercase tracking-wider mt-1">
                  {project.event_id || 'Independent Project'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {project.description}
              </p>
              <Link 
                href={`/projects/${project.id}`}
                className="block w-full py-2 rounded-lg bg-surface-hover border border-border text-center text-xs font-bold hover:bg-surface-hover transition-colors"
              >
                View Project
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
