import type { TaskItem } from "@/components/tasks/task-card"

/**
 * Column definitions for the Kanban board.
 */
export const columns = [
  { key: "todo", label: "To Do", color: "text-muted-foreground" },
  { key: "in_progress", label: "In Progress", color: "text-status-yellow" },
  { key: "review", label: "Review", color: "text-status-blue" },
  { key: "done", label: "Done", color: "text-status-green" },
] as const

export type ColumnKey = (typeof columns)[number]["key"]

/**
 * Filter tasks by column status and sort by position.
 */
export function getTasksByColumn(tasks: TaskItem[], status: string): TaskItem[] {
  return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)
}

/**
 * Reorder a task within the same column.
 * Returns a new tasks array with updated positions.
 */
export function reorderWithinColumn(
  tasks: TaskItem[],
  draggableId: string,
  sourceIndex: number,
  destIndex: number,
  columnKey: string
): TaskItem[] {
  const updated = [...tasks]
  const taskIndex = updated.findIndex((t) => t.id === draggableId)
  if (taskIndex === -1) return tasks

  const task = { ...updated[taskIndex] }
  const colTasks = getTasksByColumn(updated, columnKey)

  // Remove from source position
  colTasks.splice(sourceIndex, 1)
  // Insert at destination position
  colTasks.splice(destIndex, 0, task)

  // Recalculate positions
  colTasks.forEach((t, i) => {
    const idx = updated.findIndex((ut) => ut.id === t.id)
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], position: i }
    }
  })

  return updated
}

/**
 * Move a task from one column to another.
 * Returns a new tasks array with updated statuses and positions.
 */
export function moveBetweenColumns(
  tasks: TaskItem[],
  draggableId: string,
  sourceCol: string,
  destCol: string,
  sourceIndex: number,
  destIndex: number
): TaskItem[] {
  const updated = [...tasks]
  const taskIndex = updated.findIndex((t) => t.id === draggableId)
  if (taskIndex === -1) return tasks

  const task = { ...updated[taskIndex] }
  task.status = destCol as TaskItem["status"]

  // Remove from source column and recalculate positions
  const sourceTasks = getTasksByColumn(updated, sourceCol)
  sourceTasks.splice(sourceIndex, 1)
  sourceTasks.forEach((t, i) => {
    const idx = updated.findIndex((ut) => ut.id === t.id)
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], position: i }
    }
  })

  // Insert into destination column and recalculate positions
  const destTasks = updated
    .filter((t) => t.status === destCol && t.id !== draggableId)
    .sort((a, b) => a.position - b.position)

  task.position = destIndex
  destTasks.splice(destIndex, 0, task)

  destTasks.forEach((t, i) => {
    const idx = updated.findIndex((ut) => ut.id === t.id)
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], position: i }
    }
  })

  // Write the moved task back with updated status and position
  const movedIdx = updated.findIndex((t) => t.id === draggableId)
  if (movedIdx !== -1) {
    updated[movedIdx] = task
  }

  return updated
}

/**
 * Process a drag-and-drop result and return the updated tasks array.
 * Handles both within-column reorder and cross-column moves.
 */
export function applyDragResult(
  tasks: TaskItem[],
  draggableId: string,
  source: { droppableId: string; index: number },
  destination: { droppableId: string; index: number } | null
): TaskItem[] {
  if (!destination) return tasks

  const sourceCol = source.droppableId
  const destCol = destination.droppableId
  const sourceIndex = source.index
  const destIndex = destination.index

  // No actual move
  if (sourceCol === destCol && sourceIndex === destIndex) return tasks

  if (sourceCol === destCol) {
    return reorderWithinColumn(tasks, draggableId, sourceIndex, destIndex, sourceCol)
  }

  return moveBetweenColumns(tasks, draggableId, sourceCol, destCol, sourceIndex, destIndex)
}

/**
 * Create a temporary task object for optimistic creation.
 */
export function createTempTask(
  title: string,
  status: TaskItem["status"],
  position: number
): TaskItem {
  return {
    id: `temp-${Date.now()}`,
    title: title.trim(),
    description: "",
    status,
    priority: "medium",
    assignee_id: null,
    due_date: null,
    position,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
