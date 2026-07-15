/**
 * Supabase row type for the `workspaces` table.
 */
export interface Workspace {
  id: string
  team_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Input for creating a new workspace.
 */
export interface CreateWorkspaceInput {
  team_id: string
  name: string
  description?: string
}

/**
 * Input for updating a workspace (partial).
 */
export type UpdateWorkspaceInput = Partial<Pick<Workspace, "name" | "description">>
