"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, LayoutGrid } from "lucide-react";
import type { Workspace } from "@/types/workspace";

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function WorkspaceSwitcher({
  workspaces,
  selectedId,
  onSelect,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = workspaces.find((w) => w.id === selectedId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-all text-xs font-medium text-primary min-w-0 max-w-[200px]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch workspace"
      >
        <LayoutGrid className="w-3.5 h-3.5 shrink-0 text-primary-red" />
        <span className="truncate">{selected?.name ?? "Select workspace"}</span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 w-56 bh-card p-1 shadow-lg z-50"
          role="listbox"
          aria-label="Workspaces"
        >
          {workspaces.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No workspaces available</p>
          ) : (
            workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  onSelect(ws.id);
                  setOpen(false);
                }}
                role="option"
                aria-selected={ws.id === selectedId}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors text-left",
                  ws.id === selectedId
                    ? "bg-primary-red/10 text-primary-red font-bold"
                    : "text-primary hover:bg-surface-hover"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    ws.id === selectedId ? "bg-primary-red" : "bg-border"
                  )}
                />
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.id === selectedId && (
                  <Check className="w-3 h-3 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
