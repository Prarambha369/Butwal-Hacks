"use client"

import { useState } from "react"
import { X, Trash2, Calendar, User, Tag, AlignLeft } from "lucide-react"
import type { TaskItem } from "./task-card"

interface TaskDetailDrawerProps {
  task: TaskItem
  onClose: () => void
  onUpdate: (id: string, updates: Partial<TaskItem>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  teamMembers?: { id: string; name: string; initial: string }[]
}

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
] as const

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const

export default function TaskDetailDrawer({ task, onClose, onUpdate, onDelete, teamMembers = [] }: TaskDetailDrawerProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")

  const handleSave = async (updates: Partial<TaskItem>) => {
    try {
      await onUpdate(task.id, updates)
    } finally {
      // save complete
    }
  }

  const handleDelete = async () => {
    if (confirm("Delete this task?")) {
      await onDelete(task.id)
      onClose()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-border z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="text-muted-foreground hover:text-status-red transition-colors p-1"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
            onBlur={() => {
              if (title !== task.title) handleSave({ title })
            }}
            className="w-full text-xl font-bold text-primary bg-transparent border-none outline-none placeholder:text-muted-foreground px-0"
            placeholder="Task title"
          />

          {/* Properties Grid — Notion-style */}
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Status</span>
              </div>
              <select
                defaultValue={task.status}
                onChange={(e) => handleSave({ status: e.target.value as TaskItem["status"] })}
                className="bh-select text-sm !py-1.5"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Priority</span>
              </div>
              <select
                defaultValue={task.priority}
                onChange={(e) => handleSave({ priority: e.target.value as TaskItem["priority"] })}
                className="bh-select text-sm !py-1.5"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Assignee</span>
              </div>
              <select
                defaultValue={task.assignee_id || ""}
                onChange={(e) => handleSave({ assignee_id: e.target.value || null })}
                className="bh-select text-sm !py-1.5"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Due Date</span>
              </div>
              <input
                type="date"
                defaultValue={task.due_date ? task.due_date.split("T")[0] : ""}
                onChange={(e) => handleSave({ due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="bh-input-sm text-sm !py-1.5"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlignLeft className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Description</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== task.description) handleSave({ description })
              }}
              className="bh-textarea text-sm min-h-[120px]"
              placeholder="Add a description..."
              rows={6}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
          <span>ID: {task.id.slice(0, 8)}</span>
        </div>
      </div>
    </>
  )
}
