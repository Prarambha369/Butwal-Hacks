"use client"

import { useState } from "react"
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

export function ExplorerClient({ members: _members }: { members: ExplorerMember[] }) {
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<RoleFilter>("All")
  const [sortBy, setSortBy] = useState<SortKey>("xp")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const results = filterMembers({ role, query, sortBy })

  const clearSearch = () => setQuery("")

  const roles: RoleFilter[] = ["All", "Builder", "Mentor", "Organizer", "Sponsor"]

  return (
    <div className="mt-6 space-y-6">
      {/* Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="search"
            placeholder="Search by name, BH-ID, skill, or bio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-hover border border-border text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary-red/50 focus:ring-1 focus:ring-bh-red-500/20 transition-all"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
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
          className="h-10 px-3 rounded-lg bg-surface-hover border border-border text-sm text-primary focus:outline-none focus:border-primary-red/50 transition-all cursor-pointer"
          aria-label="Sort members"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-all ${
              viewMode === "grid"
                ? "bg-primary-red text-white"
                : "bg-surface-hover text-muted-foreground hover:text-primary"
            }`}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 transition-all ${
              viewMode === "list"
                ? "bg-primary-red text-white"
                : "bg-surface-hover text-muted-foreground hover:text-primary"
            }`}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden h-10 px-3 rounded-lg bg-surface-hover border border-border text-muted-foreground hover:text-primary transition-all flex items-center gap-2"
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
                ? "bg-primary-red text-white border-primary-red"
                : "border-border text-muted-foreground hover:border-primary-red/30 hover:text-primary"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground/60">
        {results.length === 0
          ? "No members found"
          : `${results.length} member${results.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Member Grid / List */}
      {results.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(160px,auto)]"
              : "space-y-3"
          }
        >
          {results.map((member, i) => (
            i === 0 ? (
              <div key={member.bhId} className="md:col-span-2 lg:col-span-2 lg:row-span-2">
                <MemberCard member={member} isHighlighted={true} />
              </div>
            ) : (
              <MemberCard key={member.bhId} member={member} />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-lg bg-surface-hover flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-bold text-primary">No results</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Try a different search term or role filter
          </p>
          <button
            onClick={() => {
              setQuery("")
              setRole("All")
            }}
            className="mt-4 text-xs font-bold text-primary-red hover:text-primary-red transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
