import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the event photo gallery — mirrors
 * `/dashboard/organizer/events/[event_id]/photos/page.tsx` (header,
 * upload/gallery grid). Server component; the pulse animates via
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

export default function EventPhotosLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading event photos…
      </div>

      <div className="space-y-2">
        <Bar className="h-8 w-64" />
        <Bar className="h-4 w-full max-w-md" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Bar key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}
