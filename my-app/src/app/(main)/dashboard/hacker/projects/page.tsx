import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import Link from 'next/link';
import { FolderKanban, Plus, Edit3, Eye } from 'lucide-react';
import DeleteProjectButton from './delete-button';
import GitHubSyncButton from '@/components/dashboard/github-sync-button';
import { EmptyState } from '@/components/ui/empty-state';

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

  const { data: projectsRaw, error: projectsError } = await supabase
    .from('projects')
    .select('*, teams(name)')
    .or(`profile_id.eq.${profileId ?? 'none'},team_id.in.(${teamIds.join(',')})`)
    .order('created_at', { ascending: false });

  // ponytail: gracefully handle missing column/table (migration not yet applied)
  const projects = projectsError && (projectsError.code === 'PGRST205' || projectsError.code === '42703')
    ? null
    : projectsRaw;
  if (projectsError && projectsError.code !== 'PGRST205' && projectsError.code !== '42703') throw projectsError;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your submissions and track their impact.</p>
        </div>
        <div className="flex items-center gap-3">
          <GitHubSyncButton />
          <a href="/dashboard/projects/new" className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95">
            <Plus size={16} /> New Project
          </a>
        </div>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bh-card p-6 space-y-4 group hover:border-primary-red/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-primary-red/10 text-primary-red">
                  <FolderKanban size={20} />
                </div>
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}`} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors" title="View project detail">
                    <Eye size={16} />
                  </Link>
                  <Link href={`/dashboard/projects/${project.id}/edit`} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary-red transition-colors" title="Edit project">
                    <Edit3 size={16} />
                  </Link>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold group-hover:text-primary-red transition-colors">{project.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {project.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {project.tech_stack?.map((tech: string) => (
                  <span key={tech} className="text-[10px] font-mono px-2 py-1 rounded-full bg-surface-hover border border-border">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FolderKanban className="w-12 h-12" />}
          title="No projects yet"
          description="You haven&apos;t submitted any projects yet. Your first project starts your portfolio and unlocks the First Ship achievement."
          actions={[
            { label: "Create your first project", href: "/dashboard/projects/new", variant: "primary" as const },
          ]}
          hint="You can also sync projects from GitHub"
        />
      )}
    </div>
  );
}
