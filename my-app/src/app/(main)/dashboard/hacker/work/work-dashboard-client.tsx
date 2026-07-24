"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Columns3, Table2, Search, X, RefreshCw, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import KanbanBoard from "@/components/tasks/kanban-board"
import TableTaskView from "@/components/tasks/table-task-view"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import type { TaskItem } from "@/components/tasks/task-card"
import type { Workspace } from "@/types/workspace"

export interface WorkDashboardClientProps {
  workspaceId: string
  initialTasks: TaskItem[]
  teamMembers: { id: string; name: string; initial: string }[]
  workspaces?: Workspace[]
}

type ViewMode = "board" | "table"

const priorityOptions = ["all", "urgent", "high", "medium", "low"] as const
const priorityLabels: Record<string, string> = {
  all: "All Priorities",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
}

export default function WorkDashboardClient({
  workspaceId: initialWorkspaceId,
  initialTasks,
  teamMembers,
  workspaces = [],
}: WorkDashboardClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("board")
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")

  // Workspace switching state
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWorkspaceId)
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [loading, setLoading] = useState(false)

  // Column status filter — clicking a stat card sets this
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Fetch tasks when workspace changes
  const fetchTasks = useCallback(async (wsId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks?workspace_id=${encodeURIComponent(wsId)}`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data = await res.json()
      setTasks(data.tasks ?? [])
    } catch {
      // Keep current tasks on failure
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedWorkspaceId !== initialWorkspaceId) {
      fetchTasks(selectedWorkspaceId)
    }
  }, [selectedWorkspaceId, initialWorkspaceId, fetchTasks])

  const hasActiveFilters = searchQuery || priorityFilter !== "all" || assigneeFilter !== "all"

  const totalTaskCount = tasks.length

  const filteredCount = useMemo(() =>
    tasks.filter((t) => {
      if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      if (assigneeFilter !== "all" && t.assignee_id !== assigneeFilter) return false
      return true
    }).length
  , [tasks, searchQuery, priorityFilter, assigneeFilter])

    // Column stats derived from current tasks
  const columnStats = useMemo(() => {
    const statuses = [
      { key: "todo", label: "To Do", color: "text-muted-foreground", dot: "bg-muted-foreground" },
      { key: "in_progress", label: "In Progress", color: "text-status-yellow", dot: "bg-status-yellow" },
      { key: "review", label: "Review", color: "text-status-blue", dot: "bg-status-blue" },
      { key: "done", label: "Done", color: "text-status-green", dot: "bg-status-green" },
    ] as const
    return statuses.map((s) => ({
      ...s,
      count: tasks.filter((t) => t.status === s.key).length,
    }))
  }, [tasks])

  const clearFilters = () => {
    setSearchQuery("")
    setPriorityFilter("all")
    setAssigneeFilter("all")
    setStatusFilter(null)
  }

  const filters = {
    searchQuery: searchQuery.trim(),
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    assignee: assigneeFilter === "all" ? undefined : assigneeFilter,
    status: statusFilter ?? undefined,
  }

  return (
    <div className="space-y-4">
      {/* Top Bar: Workspace Switcher + View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Workspace Switcher */}
          {workspaces.length > 1 && (
            <WorkspaceSwitcher
              workspaces={workspaces}
              selectedId={selectedWorkspaceId}
              onSelect={(id) => {
                if (id !== selectedWorkspaceId) {
                  setSelectedWorkspaceId(id)
                }
              }}
            />
          )}

          {/* View Toggle */}
          <div className="inline-flex items-center gap-0.5 bh-card p-0.5 shrink-0">
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                viewMode === "board"
                  ? "bg-primary-red text-white shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                viewMode === "table"
                  ? "bg-primary-red text-white shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="bh-input-sm text-xs pl-8 pr-8 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bh-select text-xs min-w-[90px] w-auto py-[0.5rem]"
            aria-label="Filter by priority"
          >
            {priorityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {priorityLabels[opt]}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bh-select text-xs min-w-[90px] w-auto py-[0.5rem]"
            aria-label="Filter by assignee"
          >
            <option value="all">All Assignees</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-primary-red transition-colors whitespace-nowrap px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Column Stats — clickable to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total summary card */}
        <div
          className={cn(
            "bh-card p-3 flex items-center gap-3 col-span-2 sm:col-span-1",
            statusFilter
              ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              : "bg-primary-red/[0.03] border-primary-red/10"
          )}
          onClick={statusFilter ? () => setStatusFilter(null) : undefined}
          role={statusFilter ? "button" : undefined}
          aria-label={statusFilter ? "Clear status filter — show all tasks" : undefined}
        >
          <div className="p-1.5 rounded-lg bg-primary-red/10 text-primary-red shrink-0">
            <ListChecks className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider truncate">
              {statusFilter ? "Filtered" : "Total Tasks"}
            </p>
          </div>
          <span className={cn(
            "text-lg font-bold font-mono",
            statusFilter ? "text-primary-red" : "text-primary"
          )}>
            {statusFilter
              ? tasks.filter((t) => t.status === statusFilter).length
              : filteredCount && filteredCount !== totalTaskCount
                ? `${filteredCount}/${totalTaskCount}`
                : totalTaskCount
            }
          </span>
        </div>

        {columnStats.map((col) => {
          const isActive = statusFilter === col.key
          return (
            <button
              key={col.key}
              onClick={() => setStatusFilter(isActive ? null : col.key)}
              className={cn(
                "bh-card p-3 flex items-center gap-3 text-left transition-all duration-200 cursor-pointer",
                isActive
                  ? "ring-2 ring-primary-red/50 shadow-[0_0_12px_rgba(254,0,0,0.12)] -translate-y-0.5"
                  : "hover:shadow-md hover:-translate-y-0.5"
              )}
              aria-label={`Filter by ${col.label}`}
            >
              <div className={cn("w-2 h-2 rounded-full shrink-0", col.dot)} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[10px] font-mono font-bold uppercase tracking-wider truncate transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {col.label}
                </p>
              </div>
              <span className={cn("text-lg font-bold transition-colors", col.color)}>
                {col.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Loading tasks...
        </div>
      )}

      {/* Filter Result Count */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          {filteredCount === 0 ? (
            <span>
              No tasks match your filters{" "}
              <button onClick={clearFilters} className="text-primary-red hover:underline font-medium">
                Clear filters
              </button>
            </span>
          ) : (
            <>
              Showing {filteredCount} of {totalTaskCount} tasks
              {searchQuery && (
                <span> matching &ldquo;{searchQuery}&rdquo;</span>
              )}
            </>
          )}
        </p>
      )}

      {/* Active View */}
      {viewMode === "board" ? (
        <KanbanBoard
          workspaceId={selectedWorkspaceId}
          initialTasks={tasks}
          teamMembers={teamMembers}
          filters={filters}
        />
      ) : (
        <TableTaskView
          workspaceId={selectedWorkspaceId}
          initialTasks={tasks}
          teamMembers={teamMembers}
          filters={filters}
        />
      )}
    </div>
  )
}
