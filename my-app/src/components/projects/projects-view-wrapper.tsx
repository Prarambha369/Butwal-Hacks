"use client"

import { useState } from "react"
import { Columns3, Table2, FolderKanban, Plus, Edit3, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import ProjectDatabaseTable from "./project-database-table"
import type { ProjectListItem } from "@/lib/actions/projects"
import DeleteProjectButton from "@/app/(main)/dashboard/hacker/projects/delete-button"
import GitHubSyncButton from "@/components/dashboard/github-sync-button"
import { EmptyState } from "@/components/ui/empty-state"

interface ProjectsViewWrapperProps {
  initialProjects: ProjectListItem[]
  initialTotalCount: number
  profileId: string
  teamIds: string[]
}

type ViewMode = "grid" | "table"

export default function ProjectsViewWrapper({
  initialProjects,
  initialTotalCount,
  profileId,
  teamIds,
}: ProjectsViewWrapperProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  if (initialProjects.length === 0 && initialTotalCount === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="w-12 h-12" />}
        title="No projects yet"
        description="You haven&apos;t submitted any projects yet. Your first project starts your portfolio and unlocks the First Ship achievement."
        actions={[
          { label: "Create your first project", href: "/dashboard/projects/new", variant: "primary" },
        ]}
        hint="You can also sync projects from GitHub"
      />
    )
  }

  return (
    <>
      {/* View Toggle + Action Buttons */}
      <div className="flex items-center justify-between">
        {/* View Toggle */}
        <div className="inline-flex items-center gap-0.5 bh-card p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
              viewMode === "grid"
                ? "bg-primary-red text-white shadow-sm"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Grid
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

        <div className="flex items-center gap-3">
          <GitHubSyncButton />
          <a
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
          >
            <Plus size={16} /> New Project
          </a>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialProjects.map((project) => (
            <div key={project.id} className="bh-card p-6 space-y-4 group hover:border-primary-red/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-primary-red/10 text-primary-red">
                  <FolderKanban size={20} />
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
                    title="View project detail"
                  >
                    <Eye size={16} />
                  </Link>
                  <Link
                    href={`/dashboard/projects/${project.id}/edit`}
                    className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary-red transition-colors"
                    title="Edit project"
                  >
                    <Edit3 size={16} />
                  </Link>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold group-hover:text-primary-red transition-colors">{project.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{project.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {project.tech_stack?.map((tech: string) => (
                  <span
                    key={tech}
                    className="text-[10px] font-mono px-2 py-1 rounded-full bg-surface-hover border border-border"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ProjectDatabaseTable
          initialProjects={initialProjects}
          initialTotalCount={initialTotalCount}
          profileId={profileId}
          teamIds={teamIds}
        />
      )}
    </>
  )
}
