"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Grid3X3, List, X, ArrowUpDown, User, ChevronDown, Filter } from "lucide-react"
import { filterMembers, type ExplorerMember } from "@/lib/members"
import { MemberCard } from "@/components/explorer/member-card"
import { cn } from "@/lib/utils"

const SORT_OPTIONS = [
  { value: "activity", label: "Most Active" },
  { value: "projects", label: "Projects (high)" },
  { value: "name", label: "Name (A-Z)" },
  { value: "joined", label: "Newest" },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]["value"]
type RoleFilter = "All" | "Builder" | "Mentor" | "Organizer" | "Sponsor"

const ROLE_CONFIG: Record<RoleFilter, { label: string; color: string }> = {
  All: { label: "All Roles", color: "bg-surface-hover text-muted-foreground border-border" },
  Builder: { label: "Builders", color: "text-status-blue border-status-blue/20 bg-status-blue/10" },
  Mentor: { label: "Mentors", color: "text-status-green border-status-green/20 bg-status-green/10" },
  Organizer: { label: "Organizers", color: "text-status-orange border-status-orange/20 bg-status-orange/10" },
  Sponsor: { label: "Sponsors", color: "text-primary-red border-primary-red/20 bg-primary-red/10" },
}

export function ExplorerClient({ members }: { members: ExplorerMember[] }) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [role, setRole] = useState<RoleFilter>("All")
  const [sortBy, setSortBy] = useState<SortKey>("activity")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // Debounce search to avoid excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(timer)
  }, [query])

  const results = useMemo(
    () => filterMembers(members, { role, query: debouncedQuery, sortBy }),
    [members, role, debouncedQuery, sortBy],
  )

  // Close sort dropdown on click outside
  useEffect(() => {
    if (!sortOpen) return
    const handleClick = () => setSortOpen(false)
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [sortOpen])

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>('[aria-label="Search members"]')
        searchInput?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const clearAll = useCallback(() => {
    setQuery("")
    setDebouncedQuery("")
    setRole("All")
  }, [])

  const hasActiveFilters = query || role !== "All"

  const roles: RoleFilter[] = ["All", "Builder", "Mentor", "Organizer", "Sponsor"]

  return (
    <div className="space-y-6">
      {/* ── Search & Controls Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="search"
            placeholder="Search by name, BH-ID, skill, or bio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search members"
            className="w-full h-11 pl-9 pr-9 rounded-xl bg-surface border border-border text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary-red/50 focus:ring-1 focus:ring-primary-red/20 transition-all"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setSortOpen(!sortOpen) }}
            className="h-11 px-3 rounded-xl bg-surface border border-border text-sm text-muted-foreground hover:text-primary hover:border-muted-foreground/30 transition-all flex items-center gap-2 min-w-[140px]"
            aria-label="Sort members"
            aria-expanded={sortOpen}
          >
            <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-left text-xs font-medium truncate">
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", sortOpen && "rotate-180")} />
          </button>

          {sortOpen && (
            <div className="absolute top-full mt-1 right-0 min-w-[180px] z-20 p-1.5 rounded-xl bg-surface border border-border shadow-lg">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    sortBy === opt.value
                      ? "bg-primary-red/10 text-primary-red"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2.5 transition-all",
              viewMode === "grid"
                ? "bg-primary-red text-white"
                : "bg-surface text-muted-foreground hover:text-primary hover:bg-surface-hover"
            )}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2.5 transition-all",
              viewMode === "list"
                ? "bg-primary-red text-white"
                : "bg-surface text-muted-foreground hover:text-primary hover:bg-surface-hover"
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden h-11 px-3 rounded-xl bg-surface border border-border text-muted-foreground hover:text-primary transition-all flex items-center gap-2"
          aria-label="Toggle filters"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-red" />
          )}
        </button>
      </div>

      {/* ── Role Filter Pills ── */}
      <div className={cn(showFilters ? "flex" : "hidden", "sm:flex flex-wrap gap-2")} role="group" aria-label="Filter by role">
        {roles.map((r) => {
          const cfg = ROLE_CONFIG[r]
          return (
            <button
              key={r}
              onClick={() => { setRole(r); setShowFilters(false) }}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer",
                role === r
                  ? cn(cfg.color, "shadow-sm")
                  : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-primary bg-surface"
              )}
            >
              {cfg.label}
            </button>
          )
        })}

        {/* Clear button when filters are active */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-border text-muted-foreground/60 hover:text-primary hover:bg-surface-hover transition-all"
          >
            <X className="w-3 h-3 inline-block mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* ── Results Info Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-red" />
          {results.length === 0
            ? "No members found"
            : `${results.length} member${results.length !== 1 ? "s" : ""} found`
          }
          {hasActiveFilters && (
            <span className="text-muted-foreground/40">
              · filtered from {members.length} total
            </span>
          )}
        </div>
        {viewMode === "list" && results.length > 0 && (
          <span className="text-[10px] text-muted-foreground/40 hidden sm:block">
            <User className="w-3 h-3 inline-block mr-1" />
            List view
          </span>
        )}
      </div>

      {/* ── Member Grid / List ── */}
      {results.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {results.map((member, i) => (
            viewMode === "grid" && i === 0 ? (
              <div key={member.bhId} className="md:col-span-2 lg:col-span-2">
                <MemberCard member={member} isHighlighted={true} />
              </div>
            ) : (
              <MemberCard key={member.bhId} member={member} />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
            <Search className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-bold text-primary">No results found</p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            {query
              ? `No members match "${query}"${role !== "All" ? ` with role "${role}"` : ""}`
              : "Try adjusting your filters to see more members"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-red/10 text-primary-red text-xs font-bold hover:bg-primary-red/20 transition-all"
            >
              Clear all filters
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
