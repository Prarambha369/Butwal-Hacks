"use client"

import { useState, useMemo } from "react"
import { Columns3, Table2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import KanbanBoard from "@/components/tasks/kanban-board"
import TableTaskView from "@/components/tasks/table-task-view"
import type { TaskItem } from "@/components/tasks/task-card"

export interface WorkDashboardClientProps {
  workspaceId: string
  initialTasks: TaskItem[]
  teamMembers: { id: string; name: string; initial: string }[]
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
  workspaceId,
  initialTasks,
  teamMembers,
}: WorkDashboardClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("board")
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")

  const hasActiveFilters = searchQuery || priorityFilter !== "all" || assigneeFilter !== "all"

  const totalTaskCount = initialTasks.length

  // Compute filtered count from initialTasks for the "Showing X of Y" display
  const filteredCount = useMemo(() =>
    initialTasks.filter((t) => {
      if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      if (assigneeFilter !== "all" && t.assignee_id !== assigneeFilter) return false
      return true
    }).length
  , [initialTasks, searchQuery, priorityFilter, assigneeFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setPriorityFilter("all")
    setAssigneeFilter("all")
  }

  // Build filter object to pass to each view
  const filters = {
    searchQuery: searchQuery.trim(),
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    assignee: assigneeFilter === "all" ? undefined : assigneeFilter,
  }

  return (
    <div className="space-y-4">
      {/* Top Bar: View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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

      {/* Active View — pass ALL tasks + filter object so views preserve internal state */}
      {viewMode === "board" ? (
        <KanbanBoard
          workspaceId={workspaceId}
          initialTasks={initialTasks}
          teamMembers={teamMembers}
          filters={filters}
        />
      ) : (
        <TableTaskView
          workspaceId={workspaceId}
          initialTasks={initialTasks}
          teamMembers={teamMembers}
          filters={filters}
        />
      )}
    </div>
  )
}
