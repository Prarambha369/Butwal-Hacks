"use client"

import { Search, ArrowUpDown, Plus } from "lucide-react"

const projects = [
  {
    name: "Nepal Earthquake Early Warning System",
    status: { label: "In Review", color: "text-status-blue bg-status-blue/8" },
    tags: ["Python", "IoT", "ML"],
    assignee: "AB",
    due: "Aug 15",
    priority: "high",
  },
  {
    name: "Community Learning Platform",
    status: { label: "In Progress", color: "text-status-yellow bg-status-yellow/8" },
    tags: ["Next.js", "Supabase", "Tailwind"],
    assignee: "PK",
    due: "Sep 1",
    priority: "medium",
  },
  {
    name: "Local Market Connect",
    status: { label: "To Do", color: "text-muted-foreground bg-surface-hover" },
    tags: ["React Native", "Firebase"],
    assignee: "SB",
    due: "Oct 10",
    priority: "low",
  },
  {
    name: "Disaster Response Drone UI",
    status: { label: "Done", color: "text-status-green bg-status-green/8" },
    tags: ["React", "Mapbox"],
    assignee: "RJ",
    due: "Jul 30",
    priority: "high",
  },
  {
    name: "Smart Agriculture Dashboard",
    status: { label: "In Progress", color: "text-status-yellow bg-status-yellow/8" },
    tags: ["Vue", "D3.js", "Node"],
    assignee: "AB",
    due: "Sep 15",
    priority: "medium",
  },
]

export default function DatabaseTable() {
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section header */}
        <div className="mb-12 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-red/8 text-[10px] font-mono font-semibold text-primary-red tracking-tight">
              database
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
            Every project, filterable and sortable
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-lg">
            A table view that looks and works like a database. Filter by status, sort by priority, or search for what you need.
          </p>
        </div>

        {/* Database Table Mockup */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors"
                aria-label="Filter projects"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Filter</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors"
                aria-label="Sort projects"
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sort</span>
              </button>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors"
              aria-label="Create new project"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>New</span>
            </button>
          </div>

          {/* Column Headers — hidden on mobile, shown on md+ */}
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1.5fr_0.75fr_0.75fr] border-b border-border bg-surface-hover/50">
            {["Name", "Status", "Tags", "Lead", "Due"].map((col) => (
              <div
                key={col}
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <span>{col}</span>
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              </div>
            ))}
          </div>

          {/* Rows — card stack on mobile, table rows on md+ */}
          <div className="space-y-3 md:space-y-0 md:divide-y md:divide-border">
            {projects.map((project) => (
              <div
                key={project.name}
                className="rounded-lg border border-border bg-surface p-4 md:p-0 md:rounded-none md:border-0 md:bg-transparent md:grid md:grid-cols-[2fr_1fr_1.5fr_0.75fr_0.75fr] hover:bg-surface-hover transition-colors cursor-pointer group"
              >
                {/* Mobile card layout (shown < md) */}
                <div className="flex flex-col gap-2 md:hidden">
                  {/* Name + priority row */}
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        project.priority === "high"
                          ? "bg-primary-red"
                          : project.priority === "medium"
                            ? "bg-status-yellow"
                            : "bg-text-muted"
                      }`}
                    />
                    <span className="text-sm font-medium text-primary group-hover:text-primary-red transition-colors leading-snug">
                      {project.name}
                    </span>
                  </div>
                  {/* Row 2: status + tags */}
                  <div className="flex items-center gap-2 pl-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${project.status.color}`}>
                      {project.status.label}
                    </span>
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-border bg-surface text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* Row 3: lead + due */}
                  <div className="flex items-center gap-4 pl-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Lead</span>
                      <div className="h-5 w-5 rounded-full bg-surface-hover border border-border flex items-center justify-center text-[10px] font-semibold text-text-secondary font-mono">
                        {project.assignee}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Due</span>
                      <span className="text-xs text-text-secondary font-mono">{project.due}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop table layout (shown on md+) */}
                <div className="hidden md:contents">
                  {/* Name */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        project.priority === "high"
                          ? "bg-primary-red"
                          : project.priority === "medium"
                            ? "bg-status-yellow"
                            : "bg-text-muted"
                      }`}
                    />
                    <span className="text-sm font-medium text-primary group-hover:text-primary-red transition-colors">
                      {project.name}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="px-4 py-3 flex items-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${project.status.color}`}>
                      {project.status.label}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-border bg-surface text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Assignee */}
                  <div className="px-4 py-3 flex items-center">
                    <div className="h-6 w-6 rounded-full bg-surface-hover border border-border flex items-center justify-center text-xs font-semibold text-text-secondary font-mono">
                      {project.assignee}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="px-4 py-3 flex items-center">
                    <span className="text-xs text-text-secondary font-mono">{project.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{projects.length} rows</span>
            <span className="opacity-30">·</span>
            <span>Click a row to open project details →</span>
          </div>
        </div>
      </div>
    </section>
  )
}
