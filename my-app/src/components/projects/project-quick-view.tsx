"use client"

import { ExternalLink, Edit3, Calendar, User, Tag, X, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { ProjectRow } from "./project-database-table"

interface ProjectQuickViewProps {
  project: ProjectRow
  onClose: () => void
}

// ponytail: Duplicated from project-database-table.tsx to avoid circular import.
// Refactor into a shared constants file when a third consumer appears.
const statusColors: Record<string, string> = {
  "Web App": "text-status-blue bg-status-blue/8",
  "Mobile App": "text-status-teal bg-status-teal/8",
  "AI/ML": "text-status-green bg-status-green/8",
  "Data Science": "text-status-green bg-status-green/8",
  Blockchain: "text-status-orange bg-status-orange/8",
  "Hardware/IoT": "text-status-yellow bg-status-yellow/8",
  "DevOps/Tools": "text-status-red bg-status-red/8",
  "Game Dev": "text-status-blue bg-status-blue/8",
  "Open Source Tool": "text-status-teal bg-status-teal/8",
}

export default function ProjectQuickView({ project, onClose }: ProjectQuickViewProps) {
  const statusLabel = project.category || "Submitted"
  const statusColor = project.category
    ? statusColors[project.category] || "text-muted-foreground bg-surface-hover"
    : "text-muted-foreground bg-surface-hover"

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-border z-50 flex flex-col shadow-xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Project Quick View
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors min-w-[44px] min-h-[44px] p-1 flex items-center justify-center rounded-lg hover:bg-surface-hover"
            aria-label="Close quick view"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-primary leading-snug">{project.title}</h3>
            <p className="text-xs text-muted-foreground font-mono">ID: {project.id.slice(0, 8)}</p>
          </div>

          {/* Status & Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-md", statusColor)}>
              {statusLabel}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(project.created_at)}
            </div>
          </div>

          {/* Lead */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover border border-border">
            <div className="flex items-center gap-2 w-20 shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Lead</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-semibold text-text-secondary font-mono">
                {project.profile_initials}
              </div>
              <span className="text-sm font-medium text-primary">
                {project.profile_name || "Unknown"}
              </span>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Description</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          {/* Tech Stack */}
          {project.tech_stack.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Tech Stack</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border border-border bg-surface text-text-secondary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Links</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bh-red-500 text-white text-sm font-bold hover:bg-deep-red transition-all active:scale-[0.97]"
              >
                <ArrowUpRight className="h-4 w-4" />
                Full Details
              </Link>
              <Link
                href={`/projects/${project.id}/edit`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-primary text-sm font-medium hover:bg-surface-hover/80 transition-all active:scale-[0.97]"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Created {formatDate(project.created_at)}</span>
          <span className="font-mono">{project.profile_initials}</span>
        </div>
      </div>
    </>
  )
}
