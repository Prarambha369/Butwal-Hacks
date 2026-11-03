import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for team formation — mirrors
 * `/dashboard/organizer/events/[event_id]/teams/page.tsx` (header,
 * team-card grid). Server component; the pulse animates via
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

export default function EventTeamsLoading() {
  return (
    <div
      aria-busy="true"
      className="min-h-dvh bg-background pt-28 pb-16 px-6 md:px-20"
    >
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading team formation…
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Bar className="h-3 w-24" />
            <div className="flex items-center gap-3">
              <Bar className="h-10 w-10 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Bar className="h-7 w-44" />
                <Bar className="h-4 w-32" />
              </div>
            </div>
          </div>
          <Bar className="h-4 w-28" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bh-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Bar className="h-4 w-28" />
                <Bar className="h-5 w-14 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Bar className="h-8 w-8 rounded-full" />
                <Bar className="h-8 w-8 rounded-full" />
                <Bar className="h-8 w-8 rounded-full" />
              </div>
              <Bar className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
