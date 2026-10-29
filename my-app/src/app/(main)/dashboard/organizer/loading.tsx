import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the organizer dashboard.
 *
 * Mirrors `/dashboard/organizer/page.tsx` + `organizer-dashboard-client.tsx`
 * (default "overview" view): a PageHeader with the segmented view toggle, a
 * three-column StatGrid, then the 3+2 grid — event calendar card and the
 * "Your Events" list on the left, the notices feed and task checklist on the
 * right. Server component only — the pulse animates via `motion-safe:`
 * utilities, so no client JS ships with it.
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

export default function OrganizerDashboardLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-8">
      {/* PageHeader + segmented view toggle */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <Bar className="h-5 w-24 rounded-full" />
          <Bar className="h-8 w-64" />
          <Bar className="h-4 w-full max-w-md" />
        </div>
        <Bar className="h-9 w-48 rounded-xl" />
      </div>

      {/* StatGrid cols={3} */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile valueWidth="w-14" />
        <StatTile valueWidth="w-12" />
        <StatTile valueWidth="w-10" />
      </div>

      {/* Overview grid: calendar + events (3) | notices + tasks (2) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: calendar + event list */}
        <div className="space-y-6 lg:col-span-3">
          <div className="bh-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bar className="h-4 w-4 rounded shrink-0" />
              <Bar className="h-4 w-28" />
            </div>
            {/* calendar control row */}
            <div className="flex items-center justify-between">
              <Bar className="h-4 w-4 rounded" />
              <Bar className="h-4 w-40" />
              <Bar className="h-4 w-4 rounded" />
            </div>
            {/* weekday row */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Bar key={i} className="h-3 flex-1" />
              ))}
            </div>
            {/* day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Bar key={i} className="h-9 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Your Events list rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Bar className="h-4 w-28" />
              <Bar className="h-3 w-20" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bh-card flex items-center gap-3 p-4">
                  <Bar className="h-2 w-2 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bar className={cn("h-4", i % 2 === 0 ? "w-2/3" : "w-1/3")} />
                    <Bar className="h-3 w-24" />
                  </div>
                  <Bar className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: notices + task checklist */}
        <div className="space-y-6 lg:col-span-2">
          <div className="bh-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bar className="h-4 w-4 rounded shrink-0" />
              <Bar className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5 rounded-lg border border-border p-3">
                  <Bar className={cn("h-3", i % 2 === 0 ? "w-full" : "w-3/4")} />
                  <Bar className="h-2.5 w-1/3" />
                </div>
              ))}
            </div>
          </div>

          <div className="bh-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Bar className="h-4 w-4 rounded shrink-0" />
              <Bar className="h-4 w-28" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                <Bar className="h-4 w-4 rounded-full shrink-0" />
                <Bar className={cn("h-3", i % 2 === 0 ? "w-2/5" : "w-1/3")} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
