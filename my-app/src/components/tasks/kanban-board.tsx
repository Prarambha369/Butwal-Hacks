"use client"

import { useState, useCallback } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaskSubscription } from "@/hooks/use-task-subscription"
import TaskCard from "./task-card"
import TaskDetailDrawer from "./task-detail-drawer"
import { columns, getTasksByColumn, applyDragResult, createTempTask } from "@/lib/board-utils"
import type { TaskItem } from "./task-card"

interface KanbanBoardProps {
  workspaceId: string
  initialTasks: TaskItem[]
  teamMembers: { id: string; name: string; initial: string }[]
  filters?: {
    searchQuery?: string
    priority?: string
    assignee?: string
    status?: string
  }
}

export default function KanbanBoard({
  workspaceId,
  initialTasks,
  teamMembers,
  filters,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({})

  // ─── Real-time subscription ─────────────────────────────────────
  const { markPending } = useTaskSubscription({ workspaceId, setTasks })

  // ─── Drag-and-drop handler ──────────────────────────────────────
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, source, destination } = result
      if (!destination) return

      // Mark this task as pending to skip real-time echo
      markPending(draggableId)

      const updated = applyDragResult(tasks, draggableId, source, destination)
      setTasks(updated)

      // If column changed, persist via API
      if (source.droppableId !== destination.droppableId) {
        const movedTask = updated.find((t) => t.id === draggableId)
        if (movedTask) {
          try {
            await fetch(`/api/tasks/${draggableId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: destination.droppableId,
                position: movedTask.position,
              }),
            })
          } catch {
            // Revert on failure
            setTasks(initialTasks)
          }
        }
      }
    },
    [tasks, initialTasks, markPending]
  )

  // ─── Filter tasks ───────────────────────────────────────────────
  const filteredTasks = filters
    ? tasks.filter((t) => {
        if (
          filters.searchQuery &&
          !t.title.toLowerCase().includes(filters.searchQuery.toLowerCase())
        ) {
          return false
        }
        if (filters.priority && t.priority !== filters.priority) {
          return false
        }
        if (filters.assignee && t.assignee_id !== filters.assignee) {
          return false
        }
        if (filters.status && t.status !== filters.status) {
          return false
        }
        return true
      })
    : tasks

  // ─── Filtered counts per column ─────────────────────────────────
  const totalCounts = columns.reduce(
    (acc, col) => {
      acc[col.key] = getTasksByColumn(tasks, col.key).length
      return acc
    },
    {} as Record<string, number>
  )

  const filteredCounts = columns.reduce(
    (acc, col) => {
      acc[col.key] = getTasksByColumn(filteredTasks, col.key).length
      return acc
    },
    {} as Record<string, number>
  )

  // ─── Create task in a specific column ───────────────────────────
  const handleCreateTask = async (columnKey: string) => {
    const title = (newTaskInputs[columnKey] || "").trim()
    if (!title) return

    const colTasks = getTasksByColumn(filteredTasks, columnKey)
    const tempTask = createTempTask(title, columnKey as TaskItem["status"], colTasks.length)
    markPending(tempTask.id)
    setTasks((prev) => [...prev, tempTask])
    setNewTaskInputs((prev) => ({ ...prev, [columnKey]: "" }))

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title,
          status: columnKey,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const { task } = await res.json()
      markPending(task.id)
      setTasks((prev) => {
        // Remove the temp task and deduplicate in case Realtime INSERT already added the real task
        const withoutTemp = prev.filter((t) => t.id !== tempTask.id)
        if (withoutTemp.some((t) => t.id === task.id)) {
          return withoutTemp
        }
        return [...withoutTemp, task]
      })
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempTask.id))
    }
  }

  // ─── Drawer handlers ────────────────────────────────────────────
  const handleUpdateTask = async (id: string, updates: Partial<TaskItem>) => {
    markPending(id)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update")
      const { task } = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? initialTasks.find((it) => it.id === id) || t : t)))
    }
  }

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    } catch {
      setTasks((prev) => [...prev, initialTasks.find((t) => t.id === id)!])
    }
  }

  const getAssigneeInitial = (assigneeId: string | null | undefined): string | undefined => {
    if (!assigneeId) return undefined
    return teamMembers.find((m) => m.id === assigneeId)?.initial
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-0">
          {columns.map((col) => {
            const colTasks = getTasksByColumn(filteredTasks, col.key)
            const total = totalCounts[col.key]
            const filtered = filteredCounts[col.key]
            const isFilteredActive = filters?.searchQuery || filters?.priority || filters?.assignee

            return (
              <div key={col.key} className="flex flex-col min-h-[300px]">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {col.label}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-surface-hover text-muted-foreground",
                        isFilteredActive && filtered !== total && "text-primary-red"
                      )}
                    >
                      {isFilteredActive ? `${filtered}/${total}` : total}
                    </span>
                  </div>
                </div>

                {/* Droppable Column */}
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 space-y-2 rounded-lg p-2 transition-colors duration-150",
                        "border border-dashed border-transparent",
                        snapshot.isDraggingOver
                          ? "border-primary-red/30 bg-primary-red/[0.03]"
                          : "bg-surface-hover/30"
                      )}
                    >
                      {/* Task Cards */}
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "transition-shadow duration-150",
                                snapshot.isDragging && "shadow-lg rotate-[2deg] z-50"
                              )}
                            >
                              <TaskCard
                                task={task}
                                onSelect={setSelectedTask}
                                assigneeInitial={getAssigneeInitial(task.assignee_id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty State */}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="py-8 text-center">
                          <p className="text-xs text-muted-foreground">No tasks</p>
                        </div>
                      )}

                      {/* New Task Input */}
                      <div className="pt-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newTaskInputs[col.key] || ""}
                            onChange={(e) =>
                              setNewTaskInputs((prev) => ({
                                ...prev,
                                [col.key]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateTask(col.key)
                            }}
                            placeholder={`Add task to ${col.label}...`}
                            className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/50 px-1 py-1"
                          />
                          {(newTaskInputs[col.key] || "").trim() && (
                            <button
                              onClick={() => handleCreateTask(col.key)}
                              className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-0.5"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          teamMembers={teamMembers}
        />
      )}
    </>
  )
}
