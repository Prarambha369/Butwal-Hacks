"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import ProjectQuickView from "./project-quick-view"
import type { ProjectListItem } from "@/lib/actions/projects"

export type { ProjectListItem as ProjectRow }

interface ProjectDatabaseTableProps {
  initialProjects: ProjectListItem[]
  initialTotalCount: number
  profileId: string
  teamIds: string[]
}

type SortKey = "title" | "category" | "created_at"
type SortDir = "asc" | "desc"

export const statusColors: Record<string, string> = {
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

const defaultStatusColor = "text-muted-foreground bg-surface-hover"

const PAGE_SIZES = [5, 10, 20, 50] as const
const MAX_VISIBLE_PAGES = 5
const SEARCH_DEBOUNCE_MS = 300

// Sort icon — module scope so it isn't recreated on every render
function SortIcon({
  columnKey,
  sortKey,
  sortDir,
}: {
  columnKey: SortKey
  sortKey: SortKey
  sortDir: SortDir
}) {
  if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
  return sortDir === "asc"
    ? <ArrowUp className="h-3 w-3 text-primary-red" />
    : <ArrowDown className="h-3 w-3 text-primary-red" />
}

export default function ProjectDatabaseTable({
  initialProjects,
  initialTotalCount,
  profileId,
  teamIds,
}: ProjectDatabaseTableProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(10)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Memoize teamIds to avoid re-fetch on every render
  const teamIdsStr = teamIds.join(",")
  const stableTeamIds = useMemo(() => teamIds, [teamIdsStr])  

  // Fetch from server when params change
  const fetchPage = useCallback(async (
    p: number,
    ps: number,
    search: string,
    category: string,
    sk: SortKey,
    sd: SortDir,
  ) => {
    setLoading(true)
    try {
      // Dynamic import so the server action is loaded only when needed
      const { getPaginatedProjects } = await import("@/lib/actions/projects")
      const result = await getPaginatedProjects({
        profileId,
        teamIds: stableTeamIds,
        page: p,
        pageSize: ps,
        search,
        category,
        sortKey: sk,
        sortDir: sd,
      })
      setProjects(result.data)
      setTotalCount(result.totalCount)
      // Clamp page if server returned fewer pages
      if (result.page !== p) setPage(result.page)
    } catch {
      // Keep current data on error
    } finally {
      setLoading(false)
    }
  }, [profileId, stableTeamIds])

  // Debounced fetch for search
  const debouncedFetch = useCallback((
    p: number,
    ps: number,
    search: string,
    category: string,
    sk: SortKey,
    sd: SortDir,
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPage(p, ps, search, category, sk, sd)
    }, SEARCH_DEBOUNCE_MS)
  }, [fetchPage])

  // Fetch when sort/page/pageSize changes (immediate, no debounce)
  useEffect(() => {
    fetchPage(page, pageSize, searchQuery.trim(), statusFilter === "all" ? "" : statusFilter, sortKey, sortDir)
  }, [page, pageSize, sortKey, sortDir])  

  // Debounced fetch when search or filter changes
  useEffect(() => {
    if (page !== 0) { setPage(0); return }
    debouncedFetch(0, pageSize, searchQuery.trim(), statusFilter === "all" ? "" : statusFilter, sortKey, sortDir)
  }, [searchQuery, statusFilter])  

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Reset to page 1 when sort changes
  useEffect(() => { setPage(0) }, [sortKey, sortDir])

  // Keyboard shortcut: / to focus search, Escape to close drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === "Escape") setSelectedProject(null)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (selectedProject) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [selectedProject])

  const openQuickView = useCallback((project: ProjectListItem) => {
    setSelectedProject(project)
  }, [])

  // Extract unique categories from current page data
  const categories = useMemo(() => {
    const cats = new Set<string>()
    projects.forEach((p) => { if (p.category) cats.add(p.category) })
    return Array.from(cats).sort()
  }, [projects])

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const startRow = totalCount === 0 ? 0 : safePage * pageSize + 1
  const endRow = Math.min((safePage + 1) * pageSize, totalCount)

  // Build visible page numbers
  const pageNumbers = useMemo(() => {
    const half = Math.floor(MAX_VISIBLE_PAGES / 2)
    let start = Math.max(0, safePage - half)
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES)
    if (end - start < MAX_VISIBLE_PAGES) {
      start = Math.max(0, end - MAX_VISIBLE_PAGES)
    }
    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = []
    if (start > 0) {
      pages.push(0)
      if (start > 1) pages.push("ellipsis-start")
    }
    for (let i = start; i < end; i++) pages.push(i)
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis-end")
      pages.push(totalPages - 1)
    }
    return pages
  }, [safePage, totalPages])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
  }

  // Priority dot color derived from category
  const priorityDot = (category: string | null): string => {
    if (!category) return "bg-text-muted"
    const highPriority = ["AI/ML", "Hardware/IoT", "DevOps/Tools"]
    const mediumPriority = ["Web App", "Mobile App", "Blockchain", "Game Dev"]
    if (highPriority.includes(category)) return "bg-primary-red"
    if (mediumPriority.includes(category)) return "bg-status-yellow"
    return "bg-text-muted"
  }

  // Status badge rendering
  const renderStatus = (category: string | null) => {
    const label = category || "Submitted"
    const colors = category ? statusColors[category] || defaultStatusColor : defaultStatusColor
    return <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md", colors)}>{label}</span>
  }


  // Due date formatting
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Toolbar — search, filter, new */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              aria-label="Search projects by name"
              className="bh-input-sm text-xs pl-8 pr-7 w-[140px] lg:w-[180px]"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery("") }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bh-select text-xs min-w-[90px] w-auto py-[0.5rem]"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary-red transition-colors px-1">
              Clear
            </button>
          )}
        </div>

        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-surface-hover transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New</span>
        </Link>
      </div>

      {/* Results count bar + loading indicator */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-surface-hover/30">
        <p className="text-xs text-muted-foreground">
          {totalCount === 0 ? (
            <span>
              No projects match your filters{" "}
              <button onClick={clearFilters} className="text-primary-red hover:underline font-medium">
                Clear filters
              </button>
            </span>
          ) : (
            <>
              Showing {startRow}&ndash;{endRow} of {totalCount} project{totalCount !== 1 ? "s" : ""}
              {searchQuery.trim() && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
            </>
          )}
        </p>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1.5fr_0.75fr_0.75fr] border-b border-border bg-surface-hover/50">
        <div
          className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-primary select-none"
          onClick={() => handleSort("title")}
        >
          <span>Name</span>
          <SortIcon columnKey="title" sortKey={sortKey} sortDir={sortDir} />
        </div>
        <div
          className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-primary select-none"
          onClick={() => handleSort("category")}
        >
          <span>Status</span>
          <SortIcon columnKey="category" sortKey={sortKey} sortDir={sortDir} />
        </div>
        <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>Tags</span>
        </div>
        <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>Lead</span>
        </div>
        <div
          className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-primary select-none"
          onClick={() => handleSort("created_at")}
        >
          <span>Due</span>
          <SortIcon columnKey="created_at" sortKey={sortKey} sortDir={sortDir} />
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3 md:space-y-0 md:divide-y md:divide-border">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => openQuickView(project)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openQuickView(project) }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${project.title}`}
            className="block rounded-lg border border-border bg-surface p-4 md:p-0 md:rounded-none md:border-0 md:bg-transparent md:grid md:grid-cols-[2fr_1fr_1.5fr_0.75fr_0.75fr] hover:bg-surface-hover transition-colors group cursor-pointer"
          >
            {/* Mobile card layout (< md) */}
            <div className="flex flex-col gap-2 md:hidden">
              <div className="flex items-start gap-2">
                <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", priorityDot(project.category))} />
                <span className="text-sm font-medium text-primary group-hover:text-primary-red transition-colors leading-snug">
                  {project.title}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-0">
                {renderStatus(project.category)}
                {project.tech_stack.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-border bg-surface text-text-secondary">
                    {tag}
                  </span>
                ))}
                {project.tech_stack.length > 2 && (
                  <span className="text-[10px] font-mono text-muted-foreground">+{project.tech_stack.length - 2}</span>
                )}
              </div>
              <div className="flex items-center gap-4 pl-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Lead</span>
                  <div className="h-5 w-5 rounded-full bg-surface-hover border border-border flex items-center justify-center text-[10px] font-semibold text-text-secondary font-mono">
                    {project.profile_initials}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Due</span>
                  <span className="text-xs text-text-secondary font-mono">{formatDate(project.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Desktop table layout (md+) */}
            <div className="hidden md:contents">
              <div className="px-4 py-3 flex items-center gap-3 min-w-0">
                <div className={cn("h-2 w-2 shrink-0 rounded-full", priorityDot(project.category))} />
                <span className="text-sm font-medium text-primary group-hover:text-primary-red transition-colors truncate">
                  {project.title}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center">
                {renderStatus(project.category)}
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap min-w-0">
                {project.tech_stack.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-border bg-surface text-text-secondary truncate max-w-[100px]">
                    {tag}
                  </span>
                ))}
                {project.tech_stack.length > 3 && (
                  <span className="text-[10px] font-mono text-muted-foreground">+{project.tech_stack.length - 3}</span>
                )}
              </div>
              <div className="px-4 py-3 flex items-center">
                <div className="h-6 w-6 rounded-full bg-surface-hover border border-border flex items-center justify-center text-xs font-semibold text-text-secondary font-mono">
                  {project.profile_initials}
                </div>
                {project.profile_name && (
                  <span className="ml-2 text-xs text-text-secondary hidden lg:inline">{project.profile_name}</span>
                )}
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className="text-xs text-text-secondary font-mono">{formatDate(project.created_at)}</span>
              </div>
            </div>
          </div>
        ))}

        {totalCount === 0 && !hasActiveFilters && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No projects yet. Create one above.</p>
          </div>
        )}

        {totalCount === 0 && hasActiveFilters && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No projects match your current filters.{" "}
              <button onClick={clearFilters} className="text-primary-red hover:underline font-medium">
                Clear filters
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{startRow}&ndash;{endRow}</span>
            <span className="opacity-30">of</span>
            <span className="font-mono">{totalCount}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0 || loading}
              className={cn(
                "min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-xs transition-colors",
                safePage === 0 || loading
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageNumbers.map((p, i) =>
              p === "ellipsis-start" || p === "ellipsis-end" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground/40">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={loading}
                  className={cn(
                    "min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-xs font-medium transition-colors",
                    p === safePage
                      ? "bg-bh-red-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
                  )}
                  aria-label={`Page ${p + 1}`}
                  aria-current={p === safePage ? "page" : undefined}
                >
                  {p + 1}
                </button>
              )
            )}

            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages - 1 || loading}
              className={cn(
                "min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-xs transition-colors",
                safePage >= totalPages - 1 || loading
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
              )}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
              className="bh-select text-xs min-w-[60px] w-auto py-[0.3rem]"
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Project Quick View Drawer */}
      {selectedProject && (
        <ProjectQuickView
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  )
}
