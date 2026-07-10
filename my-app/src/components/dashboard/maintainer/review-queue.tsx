"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle, ExternalLink, AlertCircle, Github, Code2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Project } from '@/lib/supabase-types';

import { cloudinaryUrl } from '@/lib/utils';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ReviewQueue() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPendingProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('github_verified', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch {
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickVerify = async (projectId: string) => {
    try {
      const { verifyProjectGitHub } = await import('@/lib/actions/moderation');
      const result = await verifyProjectGitHub(projectId);
      if (result.success) {
        toast.success('Project verified!');
        await fetchPendingProjects();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const handleFlag = async (projectId: string) => {
    try {
      const { updateProjectStatus } = await import('@/lib/actions/moderation');
      const result = await updateProjectStatus(projectId, 'flagged');
      if (result.success) {
        toast.info('Project flagged for review');
        await fetchPendingProjects();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><RoseSpinner size="lg" /></div>;

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 space-y-4 bg-surface/10 rounded-3xl border border-glass">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">All Caught Up!</h3>
          <p className="text-secondary">There are no projects awaiting verification.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {projects.map(project => (
        <div key={project.id} className="lg-surface p-6 rounded-3xl border border-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:border-bh-red-500/50">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface/10 shrink-0 border border-glass">
              {project.cover_image ? (
                <Image loading="lazy" src={cloudinaryUrl(project.cover_image, 200)} alt={project.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/10">
                  <Code2 className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold">{project.title}</h4>
                <span className="px-2 py-0.5 rounded-full bg-surface/10 border border-glass text-[10px] font-mono text-secondary">
                  ID: {project.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-sm text-secondary line-clamp-1 max-w-md">
                {project.description}
              </p>
              <div className="flex items-center gap-3 pt-1">
                {project.github_url && (
                  <a href={project.github_url} target="_blank" className="text-xs font-medium text-bh-red-500 hover:underline flex items-center gap-1">
                    <Github className="w-3 h-3" /> GitHub
                  </a>
                )}
                {project.demo_url && (
                  <a href={project.demo_url} target="_blank" className="text-xs font-medium text-bh-red-500 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Demo
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleFlag(project.id)}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-surface/10 border border-glass text-xs font-bold hover:bg-bh-red-500/10 hover:text-bh-red-500 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-3 h-3" /> Flag
            </button>
            <button 
              onClick={() => handleQuickVerify(project.id)}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-bh-red-500 text-primary text-xs font-bold hover:bg-bh-red-500/90 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-3 h-3" /> Verify
            </button>
            <Link 
              href={`/dashboard/maintainer/projects/${project.id}`}
              className="p-2 rounded-xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all"
              title="Full Moderation"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
