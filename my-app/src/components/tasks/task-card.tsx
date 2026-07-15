"use client"

import { Circle, Clock, AlertCircle, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TaskItem {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  assignee_id?: string | null
  due_date?: string | null
  position: number
  created_at: string
  updated_at: string
}

interface TaskCardProps {
  task: TaskItem
  onSelect: (task: TaskItem) => void
  assigneeInitial?: string
}

const priorityConfig = {
  urgent: { icon: AlertCircle, color: "text-status-red", label: "Urgent" },
  high: { icon: ArrowUp, color: "text-status-orange", label: "High" },
  medium: { icon: Clock, color: "text-status-yellow", label: "Medium" },
  low: { icon: Circle, color: "text-muted-foreground", label: "Low" },
}

export default function TaskCard({ task, onSelect, assigneeInitial }: TaskCardProps) {
  const Priority = priorityConfig[task.priority]
  const isDone = task.status === "done"

  return (
    <button
      onClick={() => onSelect(task)}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-full text-left bh-card px-3 py-2.5 space-y-2 transition-all duration-150 hover:shadow-sm"
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn(
          "text-sm font-medium leading-snug",
          isDone ? "text-muted-foreground line-through" : "text-primary"
        )}>
          {task.title}
        </span>
      </div>

      {/* Bottom row: priority + due + assignee */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Priority.icon className={cn("h-3 w-3 shrink-0", Priority.color)} />
          {task.due_date && (
            <span className="text-xs text-muted-foreground truncate">
              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        {assigneeInitial && (
          <div className="h-5 w-5 rounded-full bg-surface-hover border border-border flex items-center justify-center text-[9px] font-semibold text-text-secondary shrink-0">
            {assigneeInitial}
          </div>
        )}
      </div>
    </button>
  )
}
