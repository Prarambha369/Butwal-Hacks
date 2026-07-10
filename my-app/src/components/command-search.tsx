"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Loader2, Users, Code2, Calendar, ArrowRight, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

// ponytail: no cmdk/kbar deps. useEffect keyboard listener + useState controls. ~100 lines.

type SearchResult = {
  type: "profile" | "project" | "event"
  id: string
  title: string
  subtitle: string
  href: string
  icon: React.ReactNode
}

const ICONS = {
  profile: <Users className="h-3.5 w-3.5 shrink-0" />,
  project: <Code2 className="h-3.5 w-3.5 shrink-0" />,
  event: <Calendar className="h-3.5 w-3.5 shrink-0" />,
}

const SECTION_LABELS: Record<string, string> = {
  profile: "Hackers",
  project: "Projects",
  event: "Events",
}

export default function CommandSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Keyboard shortcut: Cmd+K / Ctrl+K ──────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      // ponytail: defer focus to next tick so the DOM is ready
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setQuery("")
      setResults([])
    }
  }, [open])

  // ── Search Supabase with debounce ───────────────────────────────
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const supabase = createClient()
    const term = `%${q.trim()}%`
    const limit = 4

    try {
      const [profilesRes, projectsRes, eventsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, bh_id")
          .or(`full_name.ilike.${term},bh_id.ilike.${term},email.ilike.${term}`)
          .limit(limit),
        supabase
          .from("projects")
          .select("id, title")
          .or(`title.ilike.${term},description.ilike.${term}`)
          .limit(limit),
        supabase
          .from("events")
          .select("id, title, start_date")
          .or(`title.ilike.${term},description.ilike.${term}`)
          .limit(limit),
      ])

      const items: SearchResult[] = []

      profilesRes.data?.forEach((p) => {
        items.push({
          type: "profile",
          id: p.id,
          title: p.full_name || "Unnamed",
          subtitle: p.bh_id || "",
          href: `/p/${p.bh_id || p.id}`,
          icon: ICONS.profile,
        })
      })

      projectsRes.data?.forEach((p) => {
        items.push({
          type: "project",
          id: p.id,
          title: p.title,
          subtitle: "Project",
          href: `/projects/${p.id}`,
          icon: ICONS.project,
        })
      })

      eventsRes.data?.forEach((e) => {
        items.push({
          type: "event",
          id: e.id,
          title: e.title,
          subtitle: e.start_date
            ? new Date(e.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "Event",
          href: `/events/${e.id}`,
          icon: ICONS.event,
        })
      })

      setResults(items)
      setSelectedIdx(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // ── Keyboard navigation within results ──────────────────────────
  const navigate = useCallback(
    (direction: "up" | "down") => {
      setSelectedIdx((prev) => {
        const max = results.length - 1
        if (direction === "down") return Math.min(prev + 1, max)
        return Math.max(prev - 1, 0)
      })
    },
    [results.length],
  )

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); navigate("down") }
    if (e.key === "ArrowUp") { e.preventDefault(); navigate("up") }
    if (e.key === "Enter" && results[selectedIdx]) {
      go(results[selectedIdx].href)
    }
  }

  // ── Render ──────────────────────────────────────────────────────
  if (!open) return null

  // Group results by type for section headers
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-[15vh] z-50 w-[90vw] max-w-[540px] -translate-x-1/2"
        role="dialog"
        aria-modal="true"
        aria-label="Search hackers, projects, and events"
      >
        <div className="lg-surface overflow-hidden rounded-2xl border border-border/50 shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
            <Search className="h-4 w-4 shrink-0 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search hackers, projects, events..."
              className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              aria-label="Search query"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
            <kbd className="hidden rounded-md border border-border/30 bg-surface/50 px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
            {results.length === 0 && query.trim().length >= 2 && !loading && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Search className="h-8 w-8 text-text-muted/30" />
                <p className="text-sm text-text-muted">No results found</p>
                <p className="text-xs text-text-muted/50">Try a different search term</p>
              </div>
            )}

            {results.length === 0 && query.trim().length < 2 && !loading && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Search className="h-8 w-8 text-text-muted/30" />
                <p className="text-sm text-text-muted">Type at least 2 characters to search</p>
                <p className="text-xs text-text-muted/50">Search profiles, projects, and events</p>
              </div>
            )}

            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                    {SECTION_LABELS[type] || type}
                  </span>
                  <div className="h-px flex-1 bg-border/20" />
                </div>
                {items.map((item, i) => {
                  // ponytail: indexOf is O(n²) but n ≤ 12 (4 each from 3 tables) — negligible
                  const idx = results.indexOf(item)
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => go(item.href)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        idx === selectedIdx
                          ? "bg-primary-red/10 text-text-primary"
                          : "text-text-muted hover:bg-surface/30 hover:text-text-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg",
                          idx === selectedIdx ? "text-primary-red" : "text-text-muted/50",
                        )}
                      >
                        {item.icon}
                      </span>
                      <div className="flex-1 truncate">
                        <p className="truncate font-medium">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-text-muted/60">{item.subtitle}</p>
                        )}
                      </div>
                      <ArrowRight className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-opacity",
                        idx === selectedIdx ? "opacity-100" : "opacity-0",
                      )} />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
            <div className="flex items-center gap-3 text-[10px] text-text-muted/50">
              <span><kbd className="rounded border border-border/30 px-1 font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="rounded border border-border/30 px-1 font-mono">↵</kbd> open</span>
              <span><kbd className="rounded border border-border/30 px-1 font-mono">esc</kbd> close</span>
            </div>
            {results.length > 0 && (
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-text-muted/50 transition-colors hover:text-text-muted"
              >
                <X className="h-3 w-3" />
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
