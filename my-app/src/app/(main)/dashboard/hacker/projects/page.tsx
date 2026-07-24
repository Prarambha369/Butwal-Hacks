import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { getPaginatedProjects } from "@/lib/actions/projects";
import ProjectsViewWrapper from "@/components/projects/projects-view-wrapper";

export default async function HackerProjectsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  const db = createServiceClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  const profileId = profile?.id;
  if (!profileId) redirect('/dashboard/hacker');

  const { data: memberships } = await db
    .from('team_members')
    .select('team_id')
    .eq('profile_id', profileId);

  const teamIds = memberships?.map(m => m.team_id) || [];

  // Fetch the first page server-side; client handles navigation after that
  const initial = await getPaginatedProjects({
    profileId,
    teamIds,
    page: 0,
    pageSize: 10,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Projects</h1>
        <p className="text-sm text-muted-foreground">Manage your projects and submissions.</p>
      </div>

      <ProjectsViewWrapper
        initialProjects={initial.data}
        initialTotalCount={initial.totalCount}
        profileId={profileId}
        teamIds={teamIds}
      />
    </div>
  );
}
