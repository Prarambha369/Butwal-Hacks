import { PHASE_LABEL, type EventPhase } from "@/lib/event-status";
import { cn } from "@/lib/utils";

const STYLE: Record<EventPhase, string> = {
  open: "border-status-green/30 bg-status-green/10 text-status-green",
  "closing-soon": "border-status-orange/30 bg-status-orange/10 text-status-orange",
  live: "border-primary-red/30 bg-primary-red/10 text-primary-red",
  past: "border-border bg-surface-hover text-muted-foreground",
};

const DOT: Record<EventPhase, string> = {
  open: "bg-status-green",
  "closing-soon": "bg-status-orange",
  live: "bg-primary-red motion-safe:animate-pulse",
  past: "bg-text-muted",
};

/**
 * Registration state as text plus a dot, so it reads without color too.
 * `null` phase renders a neutral placeholder of the same size (used before
 * the client knows the time, so nothing reflows when it does).
 */
export function EventStatusBadge({
  phase,
  className,
}: {
  phase: EventPhase | null;
  className?: string;
}) {
  if (!phase) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block h-6 w-28 rounded-full bg-muted", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em]",
        STYLE[phase],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", DOT[phase])} />
      {PHASE_LABEL[phase]}
    </span>
  );
}
