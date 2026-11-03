import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for event analytics — mirrors
 * `/dashboard/organizer/events/[event_id]/analytics/page.tsx` (header,
 * chart grid), using the same chart-placeholder shape as the maintainer
 * loading skeleton. Server component; the pulse animates via
 * `motion-safe:` utilities.
 */

function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
    />
  );
}

function ChartBars({ height }: { height: string }) {
  return (
    <div className={cn("flex items-end gap-1.5 pt-2", height)}>
      <Bar className="h-1/3 flex-1" />
      <Bar className="h-2/3 flex-1" />
      <Bar className="h-1/2 flex-1" />
      <Bar className="h-3/4 flex-1" />
      <Bar className="h-2/5 flex-1" />
    </div>
  );
}

export default function EventAnalyticsLoading() {
  return (
    <div aria-busy="true" className="space-y-8">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading event analytics…
      </div>

      <div className="space-y-2">
        <Bar className="h-9 w-64" />
        <Bar className="h-4 w-full max-w-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bh-card p-5 space-y-3">
            <Bar className="h-4 w-32" />
            <Bar className="h-6 w-20" />
            <ChartBars height="h-40" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bh-card p-5 space-y-3">
            <Bar className="h-3 w-24" />
            <Bar className="h-6 w-16" />
            <ChartBars height="h-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
