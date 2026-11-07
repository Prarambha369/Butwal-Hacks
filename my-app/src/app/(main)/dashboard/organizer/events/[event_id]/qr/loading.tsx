import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for event QR check-in codes — mirrors
 * `/dashboard/organizer/events/[event_id]/qr/page.tsx` (header, QR card
 * grid). Server component; the pulse animates via `motion-safe:`
 * utilities.
 */

function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export default function EventQrLoading() {
  return (
    <div aria-busy="true" className="space-y-8">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading QR codes…
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Bar className="h-3 w-24" />
          <div className="flex items-center gap-3">
            <Bar className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Bar className="h-7 w-56" />
              <Bar className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Bar className="h-4 w-24" />
          <Bar className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-xs bh-card p-6 space-y-4 text-center">
        <Bar className="mx-auto aspect-square w-40 rounded-lg" />
        <Bar className="mx-auto h-4 w-1/2" />
        <Bar className="mx-auto h-3 w-1/3" />
      </div>
    </div>
  );
}
