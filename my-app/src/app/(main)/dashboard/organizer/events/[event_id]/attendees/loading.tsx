import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the attendee roster — mirrors
 * `/dashboard/organizer/events/[event_id]/attendees/page.tsx` (header,
 * stat bar, registration table). Server component; the pulse animates
 * via `motion-safe:` utilities.
 */

function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export default function EventAttendeesLoading() {
  return (
    <div aria-busy="true" className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading the attendee list…
      </div>

      <div className="space-y-2">
        <Bar className="h-3 w-24" />
        <Bar className="h-8 w-56" />
        <Bar className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bh-card p-4 text-center space-y-2">
            <Bar className="mx-auto h-7 w-14" />
            <Bar className="mx-auto h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="bh-card overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-6 py-4"
          >
            <Bar className="h-9 w-9 rounded-full shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bar className="h-4 w-40" />
              <Bar className="h-3 w-24" />
            </div>
            <Bar className="h-5 w-16 rounded-full" />
            <Bar className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
