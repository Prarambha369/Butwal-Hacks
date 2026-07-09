"use client"

import { useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import TaskDetailDrawer from "./task-detail-drawer"
import type { TaskItem } from "./task-card"

interface FilterParams {
  searchQuery?: string
  priority?: string
  assignee?: string
}

interface TableTaskViewProps {
  workspaceId: string
  initialTasks: TaskItem[]
  teamMembers?: { id: string; name: string; initial: string }[]
  filters?: FilterParams
}

type SortKey = "title" | "status" | "priority" | "assignee_id" | "due_date"
type SortDir = "asc" | "desc"

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
}

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
}

const statusColors: Record<string, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-status-yellow",
  review: "text-status-blue",
  done: "text-status-green",
}

const priorityColors: Record<string, string> = {
  urgent: "text-status-red",
  high: "text-status-orange",
  medium: "text-status-yellow",
  low: "text-muted-foreground",
}

const columns = [
  { key: "title" as SortKey, label: "Title", sortable: true, grow: true },
  { key: "status" as SortKey, label: "Status", sortable: true },
  { key: "priority" as SortKey, label: "Priority", sortable: true },
  { key: "assignee_id" as SortKey, label: "Assignee", sortable: true },
  { key: "due_date" as SortKey, label: "Due", sortable: true },
]

export default function TableTaskView({ workspaceId, initialTasks, teamMembers = [], filters }: TableTaskViewProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("title")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  // ─── Sorting ────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  // Apply filters to internal state (preserving in-session changes)
  const filteredTasks = filters
    ? tasks.filter((t) => {
        if (filters.searchQuery && !t.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
          return false
        }
        if (filters.priority && t.priority !== filters.priority) {
          return false
        }
        if (filters.assignee && t.assignee_id !== filters.assignee) {
          return false
        }
        return true
      })
    : tasks

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case "title":
        cmp = a.title.localeCompare(b.title)
        break
      case "status":
        cmp = a.status.localeCompare(b.status)
        break
      case "priority": {
        const order = ["urgent", "high", "medium", "low"]
        cmp = order.indexOf(a.priority) - order.indexOf(b.priority)
        break
      }
      case "assignee_id":
        cmp = (a.assignee_id || "").localeCompare(b.assignee_id || "")
        break
      case "due_date":
        cmp = (a.due_date || "").localeCompare(b.due_date || "")
        break
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  // ─── Inline Edit ────────────────────────────────────────────────
  const handleCellUpdate = async (id: string, key: string, value: unknown) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [key]: value } : t)))

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) throw new Error("Failed to update")
      const { task } = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? initialTasks.find((it) => it.id === id) || t : t)))
    }

    setEditingCell(null)
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

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return
    const tempId = `temp-${Date.now()}`
    const newTask: TaskItem = {
      id: tempId,
      title: newTaskTitle.trim(),
      description: "",
      status: "todo",
      priority: "medium",
      assignee_id: null,
      due_date: null,
      position: tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setTasks((prev) => [...prev, newTask])
    setNewTaskTitle("")

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title: newTask.title,
          status: newTask.status,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const { task } = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === tempId ? task : t)))
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
    }
  }

  const getAssigneeName = (id: string | null | undefined) => {
    if (!id) return null
    return teamMembers.find((m) => m.id === id) || null
  }

  // ─── Editable Cell Renderers ────────────────────────────────────
  const renderInlineEditor = (task: TaskItem, key: string) => {
    switch (key) {
      case "status":
        return (
          <select
            defaultValue={task.status}
            autoFocus
            onChange={(e) => handleCellUpdate(task.id, "status", e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="bh-select text-xs !py-0.5 !px-1.5 min-w-[100px]"
          >
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        )
      case "priority":
        return (
          <select
            defaultValue={task.priority}
            autoFocus
            onChange={(e) => handleCellUpdate(task.id, "priority", e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="bh-select text-xs !py-0.5 !px-1.5 min-w-[80px]"
          >
            {Object.entries(priorityLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        )
      case "assignee_id":
        return (
          <select
            defaultValue={task.assignee_id || ""}
            autoFocus
            onChange={(e) => handleCellUpdate(task.id, "assignee_id", e.target.value || null)}
            onBlur={() => setEditingCell(null)}
            className="bh-select text-xs !py-0.5 !px-1.5 min-w-[100px]"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )
      case "due_date":
        return (
          <input
            type="date"
            defaultValue={task.due_date ? task.due_date.split("T")[0] : ""}
            autoFocus
            onChange={(e) => handleCellUpdate(task.id, "due_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
            onBlur={() => setEditingCell(null)}
            className="bh-input-sm text-xs !py-0.5 !px-1.5 min-w-[120px]"
          />
        )
      default:
        return null
    }
  }

  const renderCellValue = (task: TaskItem, key: string) => {
    if (editingCell?.id === task.id && editingCell?.key === key) {
      return renderInlineEditor(task, key)
    }

    switch (key) {
      case "title":
        return (
          <span className={cn(
            "text-sm font-medium",
            task.status === "done" && "text-muted-foreground line-through"
          )}>
            {task.title}
          </span>
        )
      case "status":
        return (
          <span className={cn("text-xs font-semibold", statusColors[task.status])}>
            {statusLabels[task.status]}
          </span>
        )
      case "priority":
        return (
          <span className={cn("text-xs font-medium", priorityColors[task.priority])}>
            {priorityLabels[task.priority]}
          </span>
        )
      case "assignee_id": {
        const member = getAssigneeName(task.assignee_id)
        return member ? (
          <span className="text-xs text-text-secondary">{member.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      }
      case "due_date":
        return task.due_date ? (
          <span className="text-xs text-text-secondary">
            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      default:
        return null
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 text-primary-red" />
      : <ArrowDown className="h-3 w-3 text-primary-red" />
  }

  return (
    <>
      {/* New Task Bar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateTask()
          }}
          placeholder="Add a new task..."
          className="bh-input-sm text-sm flex-1"
        />
        <button
          onClick={handleCreateTask}
          disabled={!newTaskTitle.trim()}
          className="bh-btn-primary text-sm !px-4 !py-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Table */}
      <div className="bh-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {/* Header */}
            <thead>
              <tr className="border-b border-border bg-surface-hover/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      col.sortable && "cursor-pointer hover:text-primary select-none",
                      col.grow ? "w-auto" : "w-[120px]"
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && <SortIcon columnKey={col.key} />}
                    </div>
                  </th>
                ))}
                <th className="w-[60px] px-4 py-2.5" />
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-border">
              {sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  className="group transition-colors hover:bg-surface-hover/50 cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-2.5",
                        col.key !== "title" && "w-[120px]"
                      )}
                      onClick={(e) => {
                        // For status, priority, due_date — inline edit (prevent drawer)
                        if (col.key === "status" || col.key === "priority" || col.key === "due_date") {
                          e.stopPropagation()
                          setEditingCell({ id: task.id, key: col.key })
                        }
                        // Title and assignee: let event bubble to row onClick which opens the drawer
                      }}
                    >
                      {renderCellValue(task, col.key)}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 w-[60px]" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-status-red transition-colors opacity-0 group-hover:opacity-100 p-1"
                      title="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No tasks yet. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (id, updates) => {
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
          }}
          onDelete={handleDeleteTask}
          teamMembers={teamMembers}
        />
      )}
    </>
  )
}
