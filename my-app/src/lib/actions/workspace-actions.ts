"use server"

import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase"

/**
 * Fetch workspaces for a given team.
 */
export async function getTeamWorkspaces(teamId: string) {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()
  const { data, error } = await db
    .from("workspaces")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Create a new workspace for a team.
 */
export async function createWorkspace(params: {
  teamId: string
  name: string
  description?: string
}) {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()
  const { data, error } = await db
    .from("workspaces")
    .insert({
      team_id: params.teamId,
      name: params.name,
      description: params.description || "",
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Update a workspace.
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: { name?: string; description?: string }
) {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()
  const { data, error } = await db
    .from("workspaces")
    .update(updates)
    .eq("id", workspaceId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Delete a workspace.
 */
export async function deleteWorkspace(workspaceId: string) {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()
  const { error } = await db.from("workspaces").delete().eq("id", workspaceId)
  if (error) throw new Error(error.message)
}
