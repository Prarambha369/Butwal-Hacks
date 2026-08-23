"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Loader2, Users, Code2, Calendar, ArrowRight, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"

// ponytail: native <dialog> with showModal/close. No cmdk/kbar deps, no custom backdrop div.
// Search queries go through /api/search (service_role) instead of direct Supabase
// anon client, because RLS is disabled and only service_role has table permissions.

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

const SECTION_I18N_KEYS: Record<string, string> = {
  profile: "search.section_hackers",
  project: "search.section_projects",
  event: "search.section_events",
}

export default function CommandSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { locale } = useLanguage()

  // ── Keyboard shortcut: Cmd+K / Ctrl+K ──────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const el = dialogRef.current
        if (el?.open) { el.close() } else { el?.showModal() }
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // ── Custom event trigger (navbar button) ─────────────────────
  useEffect(() => {
    const handler = () => {
      const el = dialogRef.current
      if (el?.open) { el.close() } else { el?.showModal() }
    }
    window.addEventListener("bh:open-search", handler)
    return () => window.removeEventListener("bh:open-search", handler)
  }, [])

  // Reset state when dialog closes
  useEffect(() => {
    const el = dialogRef.current
    const handler = () => {
      setQuery("")
      setResults([])
    }
    el?.addEventListener("close", handler)
    return () => el?.removeEventListener("close", handler)
  }, [])

  // ponytail: search() is locale-independent to avoid re-fetch on language switch.
  // Subtitle strings are translated at render time via SECTION_I18N_KEYS.
  // Uses /api/search (service_role) instead of anon Supabase client because
  // RLS is disabled and only service_role has table permissions.
  // ── Search via API route with debounce ────────────────────────────
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: q.trim() }),
      })

      if (!res.ok) {
        setResults([])
        return
      }

      const data = await res.json()
      const items: SearchResult[] = (data.results || []).map((r: {
        type: string
        id: string
        title: string
        subtitle: string
        href: string
      }) => ({
        ...r,
        icon: ICONS[r.type as keyof typeof ICONS] || ICONS.profile,
      }))

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
      dialogRef.current?.close()
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

  // Group results by type for section headers
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto h-fit w-[90vw] max-w-[540px] rounded-2xl border border-border/50 bg-white p-0 shadow-2xl backdrop:bg-black/50 open:flex open:flex-col"
      aria-label={t("search.placeholder", locale)}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close()
      }}
    >
      <div className="bh-card overflow-hidden border-0">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("search.placeholder", locale)}
            className="flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
            aria-label={t("search.placeholder", locale)}
            autoFocus
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <kbd className="hidden rounded-md border border-border/30 bg-surface/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
          {results.length === 0 && query.trim().length >= 2 && !loading && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t("common.no_results", locale)}</p>
              <p className="text-xs text-muted-foreground/50">{t("search.try_different", locale)}</p>
            </div>
          )}

          {results.length === 0 && query.trim().length < 2 && !loading && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t("search.type_to_search", locale)}</p>
              <p className="text-xs text-muted-foreground/50">{t("search.search_hint", locale)}</p>
            </div>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {t(SECTION_I18N_KEYS[type] || type, locale)}
                </span>
                <div className="h-px flex-1 bg-border/20" />
              </div>
              {items.map((item) => {
                const idx = results.indexOf(item)
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      idx === selectedIdx
                        ? "bg-primary-red/10 text-primary"
                        : "text-muted-foreground hover:bg-surface/30 hover:text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg",
                        idx === selectedIdx ? "text-primary-red" : "text-muted-foreground/50",
                      )}
                    >
                      {item.icon}
                    </span>
                    <div className="flex-1 truncate">
                      <p className="truncate font-medium">{item.title}</p>
                      {item.subtitle && (
                        <p className="truncate text-xs text-muted-foreground/60">{item.subtitle}</p>
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
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
            <span><kbd className="rounded border border-border/30 px-1 font-mono">&uarr;&darr;</kbd> {t("search.kbd_navigate", locale)}</span>
            <span><kbd className="rounded border border-border/30 px-1 font-mono">&crarr;</kbd> {t("search.kbd_open", locale)}</span>
            <span><kbd className="rounded border border-border/30 px-1 font-mono">esc</kbd> {t("search.kbd_close", locale)}</span>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <X className="h-3 w-3" />
            {t("action.close", locale)}
          </button>
        </div>
      </div>
    </dialog>
  )
}
