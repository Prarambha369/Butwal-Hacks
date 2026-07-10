import TeamCreationForm from '@/components/team-creation-form'
import TeamMemberSearch from '@/components/team-member-search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {Users, Plus} from 'lucide-react'
import { auth0 } from "@/lib/auth0"
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function OrganizerTeamsPage() {
  const session = await auth0.getSession()
  const userId = session?.user?.sub

  if (!userId) {
    notFound()
  }

  const supabase = await createClient()
  // ponytail: Resolve profile UUID for FK query
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*, profiles(full_name)')
    .eq('organizer_id', profile?.id ?? 'none')

  if (teamsError) {
    throw new Error(teamsError.message)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Team Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamCreationForm eventId="default" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary mb-4">
              Search and add hackers to your teams
            </p>
            <TeamMemberSearch teamId="default" />
          </CardContent>
        </Card>
      </div>

      {teams && teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Teams ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-secondary mb-2">
                      {team.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {team.team_members?.length || 0} members
                      </Badge>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
