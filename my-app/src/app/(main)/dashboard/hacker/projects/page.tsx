import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import Link from 'next/link';
import { FolderKanban, Plus, Edit3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteProjectButton from './delete-button';
import GitHubSyncButton from '@/components/dashboard/github-sync-button';

export default async function HackerProjectsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  // ponytail: Resolve profile UUID for FK queries
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  const profileId = profile?.id;

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('profile_id', profileId ?? 'none');

  const teamIds = memberships?.map(m => m.team_id) || [];

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, teams(name)')
    .or(`profile_id.eq.${profileId ?? 'none'},team_id.in.(${teamIds.join(',')})`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-secondary opacity-60">Manage your submissions and track their impact.</p>
        </div>
        <div className="flex items-center gap-3">
          <GitHubSyncButton />
          <Button variant="default" size="sm" asChild>
            <a href="/dashboard/projects/new">
              <Plus size={16} /> New Project
            </a>
          </Button>
        </div>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="lg-surface rounded-3xl p-6 border border-glass space-y-4 group hover:border-bh-red-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-bh-red-500/10 text-bh-red-500">
                  <FolderKanban size={20} />
                </div>
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}`} className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-primary transition-colors" title="View project detail">
                    <Eye size={16} />
                  </Link>
                  <Link href={`/dashboard/projects/${project.id}/edit`} className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-bh-red-500 transition-colors" title="Edit project">
                    <Edit3 size={16} />
                  </Link>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold group-hover:text-bh-red-500 transition-colors">{project.title}</h3>
                <p className="text-sm text-secondary opacity-60 line-clamp-2 mt-2">
                  {project.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-glass">
                {project.tech_stack?.map((tech: string) => (
                  <span key={tech} className="text-[10px] font-mono px-2 py-1 rounded-full bg-surface/10 border border-glass">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lg-surface rounded-3xl p-12 text-center border border-glass space-y-4">
          <FolderKanban size={48} className="mx-auto opacity-20" />
          <p className="text-secondary opacity-60">You haven&apos;t submitted any projects yet.</p>
          <a href="/dashboard/projects/new" className="text-sm font-bold text-bh-red-500 hover:underline">Submit your first project →</a>
        </div>
      )}
    </div>
  );
}
