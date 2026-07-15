import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";

import TeamManagement from '@/components/dashboard/team-management';

export default async function HackerTeamsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Squad</h1>
          <p className="text-sm text-muted-foreground">Coordinate roles and manage your team members.</p>
        </div>
      </div>

      <TeamManagement />
    </div>
  );
}
