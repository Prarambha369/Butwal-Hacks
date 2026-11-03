import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the QR check-in scanner — mirrors
 * `/dashboard/organizer/events/[event_id]/scan/page.tsx` (header,
 * centered scanner viewport). Server component; the pulse animates
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

export default function EventScanLoading() {
  return (
    <div
      aria-busy="true"
      className="min-h-dvh bg-background pt-28 pb-16 px-6 md:px-20"
    >
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading the QR scanner…
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-3">
          <Bar className="h-3 w-24" />
          <div className="flex items-center gap-3">
            <Bar className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Bar className="h-7 w-48" />
              <Bar className="h-4 w-32" />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-4">
          <div className="aspect-square rounded-2xl border border-border bg-surface p-4">
            <Bar className="h-full w-full rounded-xl" />
          </div>
          <Bar className="mx-auto h-4 w-1/2" />
          <Bar className="mx-auto h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}
