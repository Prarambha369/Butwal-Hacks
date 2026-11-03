import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the certificate roster — mirrors
 * `/dashboard/organizer/events/[event_id]/certificates/page.tsx` (header,
 * issued-certificates list, template card). Server component; the pulse
 * animates via `motion-safe:` utilities.
 */

function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export default function EventCertificatesLoading() {
  return (
    <div aria-busy="true" className="space-y-8">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading certificates…
      </div>

      <div className="space-y-2">
        <Bar className="h-8 w-48" />
        <Bar className="h-4 w-72" />
      </div>

      <div className="bh-card p-6 space-y-4">
        <Bar className="h-4 w-36" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border pb-3">
            <Bar className="h-9 w-9 rounded-lg shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bar className="h-4 w-1/3" />
              <Bar className="h-3 w-24" />
            </div>
            <Bar className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>

      <div className="bh-card p-6 space-y-3">
        <Bar className="h-4 w-28" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-2/3" />
        <Bar className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}
