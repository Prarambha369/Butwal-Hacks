import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * The KPI tile used across every dashboard overview.
 *
 * Matches the reference layout's stat row: an icon chip, a label, a large
 * value, and an optional trend line. Colours come from existing theme tokens
 * rather than the hardcoded hex the old chart components used, so the tiles
 * survive dark mode.
 */

const TONES = {
  red: "bg-primary-red/10 text-primary-red",
  green: "bg-status-green/10 text-status-green",
  blue: "bg-status-blue/10 text-status-blue",
  yellow: "bg-status-yellow/10 text-status-yellow",
  teal: "bg-status-teal/10 text-status-teal",
  neutral: "bg-surface-hover text-secondary",
} as const;

export type StatTone = keyof typeof TONES;

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  hint?: React.ReactNode;
  /** Rendered under the value. Use for a trend, not a second metric. */
  trend?: React.ReactNode;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  trend,
  href,
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              TONES[tone],
            )}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-mono text-2xl font-bold leading-none text-primary tabular-nums">
        {value}
      </p>
      {trend ? <div className="mt-2 text-xs text-secondary">{trend}</div> : null}
      {hint ? <div className="mt-1 text-xs text-text-muted">{hint}</div> : null}
    </>
  );

  const shell = cn(
    "block rounded-xl border border-border bg-surface p-4",
    href && "transition-colors hover:border-border-light hover:bg-surface-hover",
    className,
  );

  if (!href) return <div className={shell}>{body}</div>;

  // Stretch the link over the tile so the whole surface is clickable, while
  // keeping the accessible name on the text rather than an empty anchor.
  return (
    <a href={href} className={cn(shell, "group relative")}>
      {body}
      <span className="absolute inset-0" aria-hidden="true" />
      <span className="sr-only">Open {label}</span>
    </a>
  );
}

/** Responsive stat row. Four across on desktop, two on tablet, one on mobile. */
export function StatGrid({
  children,
  className,
  cols = 4,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        cols === 4
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
