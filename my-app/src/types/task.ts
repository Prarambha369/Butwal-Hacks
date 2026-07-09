/**
 * Task status enum values.
 */
export type TaskStatus = "todo" | "in_progress" | "review" | "done"

/**
 * Task priority enum values.
 */
export type TaskPriority = "low" | "medium" | "high" | "urgent"

/**
 * Supabase row type for the `tasks` table.
 */
export interface Task {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

/**
 * Input for creating a new task.
 */
export interface CreateTaskInput {
  workspace_id: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string | null
  due_date?: string | null
}

/**
 * Input for updating a task (partial).
 */
export type UpdateTaskInput = Partial<CreateTaskInput> & { position?: number }
