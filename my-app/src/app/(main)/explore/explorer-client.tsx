"use client"

import { useState, useMemo, useCallback } from "react"
import { Search, SlidersHorizontal, Grid3X3, List, X } from "lucide-react"
import { filterMembers, type ExplorerMember } from "@/lib/members"
import { MemberCard } from "@/components/explorer/member-card"

const SORT_OPTIONS = [
  { value: "xp", label: "XP (high)" },
  { value: "projects", label: "Projects (high)" },
  { value: "name", label: "Name (A-Z)" },
  { value: "joined", label: "Newest" },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]["value"]
type RoleFilter = "All" | "Builder" | "Mentor" | "Organizer" | "Sponsor"

export function ExplorerClient({ members }: { members: ExplorerMember[] }) {
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<RoleFilter>("All")
  const [sortBy, setSortBy] = useState<SortKey>("xp")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const results = useMemo(
    () => filterMembers({ role, query, sortBy }),
    [role, query, sortBy],
  )

  const clearSearch = useCallback(() => setQuery(""), [])

  const roles: RoleFilter[] = ["All", "Builder", "Mentor", "Organizer", "Sponsor"]

  return (
    <div className="mt-6 space-y-6">
      {/* Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
          <input
            type="search"
            placeholder="Search by name, BH-ID, skill, or bio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface/30 border border-border/40 text-sm text-primary placeholder:text-secondary/40 focus:outline-none focus:border-bh-red-500/50 focus:ring-1 focus:ring-bh-red-500/20 transition-all"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="h-10 px-3 rounded-xl bg-surface/30 border border-border/40 text-sm text-primary focus:outline-none focus:border-bh-red-500/50 transition-all cursor-pointer"
          aria-label="Sort members"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-xl border border-border/40 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-all ${
              viewMode === "grid"
                ? "bg-bh-red-500 text-white"
                : "bg-surface/30 text-secondary hover:text-primary"
            }`}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 transition-all ${
              viewMode === "list"
                ? "bg-bh-red-500 text-white"
                : "bg-surface/30 text-secondary hover:text-primary"
            }`}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden h-10 px-3 rounded-xl bg-surface/30 border border-border/40 text-secondary hover:text-primary transition-all flex items-center gap-2"
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Role Filter Pills (desktop always visible, mobile toggle) */}
      <div
        className={`${
          showFilters ? "flex" : "hidden"
        } sm:flex flex-wrap gap-2`}
        role="group"
        aria-label="Filter by role"
      >
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r)
              setShowFilters(false)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              role === r
                ? "bg-bh-red-500 text-white border-bh-red-500"
                : "border-border/40 text-secondary hover:border-bh-red-500/30 hover:text-primary"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-secondary/60">
        {results.length === 0
          ? "No members found"
          : `${results.length} member${results.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Member Grid / List */}
      {results.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {results.map((member) => (
            <MemberCard key={member.bhId} member={member} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface/20 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-secondary/40" />
          </div>
          <p className="text-lg font-bold text-primary">No results</p>
          <p className="text-sm text-secondary/60 mt-1">
            Try a different search term or role filter
          </p>
          <button
            onClick={() => {
              setQuery("")
              setRole("All")
            }}
            className="mt-4 text-xs font-bold text-bh-red-500 hover:text-bh-red-400 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
