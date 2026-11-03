import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the hacker dashboard — mirrors
 * `/dashboard/hacker/page.tsx` (PageHeader with actions, three-tile
 * StatGrid, 3+2 content grid). Server component; the pulse animates
 * via `motion-safe:` utilities, so no client JS ships with it.
 */

function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
    />
  );
}

function StatTile({ valueWidth }: { valueWidth: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <Bar className="h-3 w-20" />
        <Bar className="h-8 w-8 rounded-lg shrink-0" />
      </div>
      <Bar className={cn("mt-3 h-6", valueWidth)} />
      <Bar className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export default function HackerDashboardLoading() {
  return (
    <div aria-busy="true" className="space-y-8 pb-20">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading the hacker dashboard…
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-64" />
          <Bar className="h-4 w-full max-w-md" />
        </div>
        <div className="flex gap-2">
          <Bar className="h-10 w-36 rounded-lg" />
          <Bar className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile valueWidth="w-14" />
        <StatTile valueWidth="w-12" />
        <StatTile valueWidth="w-16" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <Bar className="h-5 w-44" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bh-card flex items-center gap-3 p-4">
              <Bar className="h-10 w-10 rounded-lg shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bar className="h-4 w-2/3" />
                <Bar className="h-3 w-1/3" />
              </div>
              <Bar className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="bh-card p-6 space-y-3">
            <Bar className="h-4 w-32" />
            <Bar className="h-6 w-20" />
            <Bar className="h-3 w-full" />
          </div>
          <div className="bh-card p-6 space-y-3">
            <Bar className="h-4 w-28" />
            <Bar className="h-3 w-2/3" />
            <Bar className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
