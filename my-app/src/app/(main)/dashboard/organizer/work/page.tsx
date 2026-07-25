import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase"
import WorkDashboardClient from "../../hacker/work/work-dashboard-client"

export const dynamic = "force-dynamic"

interface TeamMemberRaw {
  user_id: string
  profile: {
    id: string
    full_name: string | null
  } | null
}

export default async function OrganizerWorkPage() {
  const session = await auth0.getSession()
  if (!session?.user) {
    redirect("/auth/login")
  }

  const db = createServiceClient()

  // Get the user's profile
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", session.user.sub)
    .single()

  if (!profile) {
    redirect("/dashboard/organizer")
  }

  // Get user's teams (organizers can be team members too)
  const { data: memberships } = await db
    .from("team_members")
    .select("team_id, team:teams!inner(id, name)")
    .eq("user_id", profile.id)

  const teamIds = memberships?.map((m) => m.team_id) || []

  // Get workspaces for those teams
  const workspaces = teamIds.length > 0
    ? await db.from("workspaces").select("*").in("team_id", teamIds)
    : { data: [] }

  // Get tasks for the first workspace
  const firstWorkspace = workspaces.data?.[0] || null
  const tasks = firstWorkspace
    ? await db.from("tasks").select("*").eq("workspace_id", firstWorkspace.id).order("position")
    : { data: [] }

  // Get team members for assignee display
  const teamMembers = firstWorkspace
    ? await db
        .from("team_members")
        .select("user_id, profile:profiles!inner(id, full_name)")
        .eq("team_id", firstWorkspace.team_id)
    : { data: [] }

  const members = ((teamMembers.data || []) as unknown as TeamMemberRaw[]).map((m) => ({
    id: m.profile?.id || m.user_id,
    name: m.profile?.full_name || "Unknown",
    initial: (m.profile?.full_name || "?").charAt(0).toUpperCase(),
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Team Work</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tasks across your hackathon teams — Kanban board and table view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {firstWorkspace?.name || "No active workspace"}
          </span>
        </div>
      </div>

      {/* Workspace Content */}
      {firstWorkspace ? (
        <WorkDashboardClient
          workspaceId={firstWorkspace.id}
          initialTasks={tasks.data || []}
          teamMembers={members}
          workspaces={workspaces.data || []}
        />
      ) : (
        <div className="bh-card p-12 text-center">
          <h3 className="text-lg font-semibold text-primary mb-2">No Active Workspace</h3>
          <p className="text-sm text-muted-foreground">
            Join a team to get access to your workspace and start managing tasks.
          </p>
        </div>
      )}
    </div>
  )
}
