"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}

interface DashboardCommandPaletteProps {
  links: DashboardNavItem[];
}

/**
 * DashboardCommandPalette — Alt+K command palette for navigating between
 * dashboard sections. Filterable by typing, arrow key + Enter navigation.
 * Does not conflict with the global Cmd+K command search.
 */
export function DashboardCommandPalette({
  links,
}: DashboardCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ── Keyboard trigger ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+K or Alt+k toggle the palette
      if (e.key.toLowerCase() === "k" && e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Escape closes
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      // Don't intercept typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // `/` opens the palette (like Linear, Slack)
      if (e.key === "/" && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setSelectedIdx(0);
    }
  }, [open]);

  // ── Filter links by query ──────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return links;
    const q = query.toLowerCase();
    return links.filter(
      (link) =>
        link.label.toLowerCase().includes(q) ||
        link.href.toLowerCase().includes(q) ||
        link.shortcut.toLowerCase().includes(q),
    );
  }, [query, links]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // ── Keyboard navigation ────────────────────────────────────
  const navigate = useCallback(
    (direction: "up" | "down") => {
      setSelectedIdx((prev) => {
        const max = filtered.length - 1;
        if (direction === "down") return Math.min(prev + 1, max);
        return Math.max(prev - 1, 0);
      });
    },
    [filtered.length],
  );

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigate("down");
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      navigate("up");
    }
    if (e.key === "Enter" && filtered[selectedIdx]) {
      go(filtered[selectedIdx].href);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-[20vh] z-50 w-[90vw] max-w-[420px] -translate-x-1/2"
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard navigation"
      >
        <div className="bh-card overflow-hidden border border-border/50 shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Jump to..."
              className="flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
              aria-label="Navigate to dashboard section"
            />
            <kbd className="hidden rounded-md border border-border/30 bg-surface/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Search className="h-7 w-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No pages match &ldquo;{query}&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((link, idx) => (
                  <button
                    key={link.href}
                    onClick={() => go(link.href)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      idx === selectedIdx
                        ? "bg-primary-red/10 text-primary"
                        : "text-muted-foreground hover:bg-surface/30 hover:text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg",
                        idx === selectedIdx
                          ? "text-primary-red"
                          : "text-muted-foreground/50",
                      )}
                    >
                      {link.icon}
                    </span>
                    <div className="flex-1 truncate">
                      <p className="truncate font-medium">{link.label}</p>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-mono transition-opacity",
                        idx === selectedIdx
                          ? "opacity-100 text-muted-foreground"
                          : "opacity-40 text-muted-foreground/50",
                      )}
                    >
                      <kbd className="rounded border border-border/30 px-1 py-0.5">
                        g
                      </kbd>
                      <kbd className="rounded border border-border/30 px-1 py-0.5">
                        {link.shortcut}
                      </kbd>
                    </span>
                    <ArrowRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-opacity",
                        idx === selectedIdx ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
              <span>
                <kbd className="rounded border border-border/30 px-1 font-mono">
                  ↑↓
                </kbd>{" "}
                Navigate
              </span>
              <span>
                <kbd className="rounded border border-border/30 px-1 font-mono">
                  ↵
                </kbd>{" "}
                Open
              </span>
              <span>
                <kbd className="rounded border border-border/30 px-1 font-mono">
                  esc
                </kbd>{" "}
                Close
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
