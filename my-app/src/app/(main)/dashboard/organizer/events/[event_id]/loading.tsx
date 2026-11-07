import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the event detail page — mirrors
 * `/dashboard/organizer/events/[event_id]/page.tsx` (breadcrumb header,
 * quick-link strip, overview card + action column). Server component;
 * the pulse animates via `motion-safe:` utilities.
 */

function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export default function EventSectionLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading the event…
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-56" />
          <Bar className="h-4 w-40" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bh-card p-6 space-y-5 md:col-span-2">
          <div className="space-y-1.5">
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-56" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Bar className="h-4 w-4 rounded shrink-0" />
                <Bar className="h-3 w-2/3" />
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            <Bar className="h-4 w-28" />
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-3/4" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bh-card p-6 space-y-3">
            <Bar className="h-5 w-36" />
            <Bar className="h-3 w-full" />
            <Bar className="h-9 w-32 rounded-lg" />
          </div>
          <div className="bh-card p-6 space-y-3">
            <Bar className="h-5 w-40" />
            <Bar className="h-3 w-2/3" />
            <Bar className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
