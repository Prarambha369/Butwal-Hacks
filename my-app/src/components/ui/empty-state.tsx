"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, SearchX, X } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  hint?: string;
  className?: string;
}

/**
 * EmptyState — a consistent empty state component for the Liquid Glass system.
 * Shows an icon, title, description, and optional action buttons.
 * Used when a section has no content yet (no projects, no teams, etc.).
 *
 * Usage:
 * <EmptyState
 *   icon={<FolderKanban className="w-12 h-12" />}
 *   title="No projects yet"
 *   description="Submit your first project to start building your portfolio."
 *   actions={[{ label: "Create Project", href: "/dashboard/projects/new", variant: "primary" }]}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  hint,
  className,
}: EmptyStateProps) {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className={cn(
        "bh-card p-12 text-center space-y-6",
        reducedMotion ? "" : "animate-in fade-in duration-300",
        className
      )}
    >
      {/* Icon container */}
      <div className="flex justify-center">
        <div className="p-4 rounded-lg bg-primary-red/5 border border-primary-red/10 text-primary-red/40">
          {icon}
        </div>
      </div>

      {/* Title & description */}
      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-primary">{title}</h3>
        <p className="text-sm text-secondary leading-relaxed">{description}</p>
      </div>

      {/* Action buttons */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions.map((action, i) =>
            action.href ? (
              <Link
                key={i}
                href={action.href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
                  action.variant === "primary"
                    ? "bg-bh-red-500 text-white hover:bg-deep-red hover:shadow-[0_0_20px_rgba(254,0,0,0.2)]"
                    : "bg-surface-hover text-secondary hover:text-primary border border-border"
                )}
              >
                {action.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                key={i}
                onClick={action.onClick}
                className={cn(
                  "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
                  action.variant === "primary"
                    ? "bg-bh-red-500 text-white hover:bg-deep-red"
                    : "bg-surface-hover text-secondary hover:text-primary border border-border"
                )}
              >
                {action.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      )}

      {/* Hint text */}
      {hint && (
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary-red/40" />
          <p className="text-[11px] text-secondary/40">{hint}</p>
        </div>
      )}
    </div>
  );
}

interface NoResultsStateProps {
  searchQuery: string;
  onClear: () => void;
}

/**
 * NoResultsState — shown when search or filter returns zero results.
 * Displays the query and a button to clear filters.
 */
export function NoResultsState({ searchQuery, onClear }: NoResultsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="p-4 rounded-lg bg-primary-red/5 border border-primary-red/10">
        <SearchX className="w-12 h-12 text-primary-red/40" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-primary">No results found</h3>
        <p className="text-sm text-secondary max-w-sm">
          We couldn&apos;t find anything for{' '}
          <span className="font-mono text-primary-red/80">&ldquo;{searchQuery}&rdquo;</span>
          . Try a different search term or category.
        </p>
      </div>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 bg-surface-hover text-secondary hover:text-primary border border-border"
      >
        Clear filters
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
