"use server"

import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase/service"
import type { TaskItem } from "@/components/tasks/task-card"

/**
 * Fetch all tasks for a workspace.
 */
export async function getWorkspaceTasks(workspaceId: string): Promise<TaskItem[]> {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()
  const { data, error } = await db
    .from("tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true })
    .returns<TaskItem[]>()

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Create a new task in a workspace.
 */
export async function createTask(params: {
  workspaceId: string
  title: string
  status?: TaskItem["status"]
  priority?: TaskItem["priority"]
}) {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()

  // Get next position
  const { data: lastTask } = await db
    .from("tasks")
    .select("position")
    .eq("workspace_id", params.workspaceId)
    .eq("status", params.status || "todo")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = (lastTask?.position ?? -1) + 1

  const { data, error } = await db
    .from("tasks")
    .insert({
      workspace_id: params.workspaceId,
      title: params.title,
      status: params.status || "todo",
      priority: params.priority || "medium",
      position: nextPosition,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Update a task field.
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Pick<TaskItem, "title" | "description" | "status" | "priority" | "assignee_id" | "due_date" | "position">>
) {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()
  const { data, error } = await db
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Delete a task.
 */
export async function deleteTask(taskId: string) {
  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const db = createServiceClient()
  const { error } = await db.from("tasks").delete().eq("id", taskId)
  if (error) throw new Error(error.message)
}
