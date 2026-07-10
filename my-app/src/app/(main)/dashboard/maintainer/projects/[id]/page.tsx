import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

import ModerationPanel from '@/components/dashboard/maintainer/moderation-panel';
import { Github, ExternalLink, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cloudinaryUrl } from '@/lib/utils';
import Link from 'next/link';

export default async function ProjectModerationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Since we don't have a status column yet, we simulate it based on github_verified or a dummy value
  const simulatedStatus = project.github_verified ? 'published' : 'published';

  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link href="/dashboard/maintainer" className="text-xs font-mono text-secondary hover:text-primary transition-colors">
              ← Back to Projects
            </Link>
            <h1 className="text-4xl font-black tracking-tight font-heading">Moderate Project</h1>
          </div>
          <div className="flex items-center gap-3">
            {project.github_url && (
              <a href={project.github_url} target="_blank" className="p-3 rounded-xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all">
                <Github className="w-5 h-5" />
              </a>
            )}
            {project.demo_url && (
              <Button variant="default" asChild>
                <a href={project.demo_url} target="_blank">
                  <ExternalLink className="w-4 h-4" /> Live Demo
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-glass bg-surface/10 shadow-2xl">
              {project.cover_image ? (
                <Image loading="lazy" src={cloudinaryUrl(project.cover_image, 1200)} alt={project.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Code2 className="w-20 h-20 text-primary/10" />
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">{project.title}</h2>
              <p className="text-lg text-secondary leading-relaxed whitespace-pre-wrap">
                {project.description || "No description provided."}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack?.map((tech: string) => (
                  <span key={tech} className="px-3 py-1 rounded-full bg-surface/10 border border-glass text-xs font-medium text-secondary">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <ModerationPanel 
              projectId={id}
              currentStatus={simulatedStatus}
              isVerified={project.github_verified}
              onStatusChange={async (status) => {
                const { updateProjectStatus } = await import('@/lib/actions/moderation');
                await updateProjectStatus(id, status);
              }}
              onVerify={async () => {
                const { verifyProjectGitHub } = await import('@/lib/actions/moderation');
                await verifyProjectGitHub(id);
              }}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
