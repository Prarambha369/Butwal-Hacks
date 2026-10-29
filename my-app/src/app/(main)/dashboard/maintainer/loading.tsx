import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the maintainer command center.
 *
 * Mirrors `/dashboard/maintainer/page.tsx`: a PageHeader with the health
 * badge pill, a three-column StatGrid, then the 3+2 analytics grid —
 * chart cards and a system-integrity list on the left, the audit feed,
 * controls list, and platform-summary rows on the right. Server component
 * only — the pulse animates via `motion-safe:` utilities, so no client JS
 * ships with it.
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

export default function MaintainerDashboardLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-8">
      {/* PageHeader + health badge pill */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <Bar className="h-3 w-24" />
          <div className="flex items-center gap-3">
            <Bar className="h-8 w-64" />
            <Bar className="h-5 w-40 rounded-full" />
          </div>
          <Bar className="h-4 w-full max-w-lg" />
        </div>
      </div>

      {/* StatGrid cols={3} */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile valueWidth="w-14" />
        <StatTile valueWidth="w-16" />
        <StatTile valueWidth="w-12" />
      </div>

      {/* Main grid: platform analytics (3) | audit + controls (2) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: analytics + system integrity */}
        <div className="space-y-6 lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bh-card p-5 space-y-3">
                <Bar className="h-3 w-24" />
                <Bar className="h-6 w-20" />
                <div className="flex h-24 items-end gap-1.5 pt-2" aria-hidden="true">
                  <Bar className="h-1/3 flex-1" />
                  <Bar className="h-2/3 flex-1" />
                  <Bar className="h-1/2 flex-1" />
                  <Bar className="h-3/4 flex-1" />
                  <Bar className="h-2/5 flex-1" />
                </div>
              </div>
            ))}
          </div>

          <div className="bh-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bar className="h-8 w-8 rounded-lg shrink-0" />
              <Bar className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-hover px-4 py-2.5"
                >
                  <Bar className="h-3 w-28" />
                  <Bar className="h-3 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: audit feed + controls + summary */}
        <div className="space-y-6 lg:col-span-2">
          <div className="bh-card p-5 space-y-3">
            <Bar className="h-4 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5 border-b border-border pb-2">
                  <Bar className="h-3 w-3/4" />
                  <Bar className="h-2.5 w-1/4" />
                </div>
              ))}
            </div>
          </div>

          <div className="bh-card p-5 space-y-2">
            <Bar className="h-4 w-36" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg px-2 py-2">
                <div className="flex items-center gap-2">
                  <Bar className="h-4 w-4 rounded shrink-0" />
                  <Bar className="h-3 w-24" />
                </div>
                <Bar className="h-3 w-16" />
              </div>
            ))}
          </div>

          <div className="bh-card p-5 space-y-3">
            <Bar className="h-3 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Bar className="h-3 w-20" />
                <Bar className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
