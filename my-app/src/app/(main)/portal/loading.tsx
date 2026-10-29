import { cn } from "@/lib/utils";

/**
 * Route loading skeleton for the sponsor portal.
 *
 * Renders inside `/portal/layout.tsx`'s content area (the sidebar has
 * already loaded) and mirrors `/portal/sponsors/page.tsx`: the dashboard
 * heading with the sponsor pill, a row of three summary cards, then the
 * 3+2 analytics grid — chart cards on the left, the talent-search CTA and
 * action cards on the right. Server component only — the pulse animates
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

function SummaryCard({ iconTile }: { iconTile: string }) {
  return (
    <div className="bh-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Bar className={cn("h-10 w-10 rounded-xl", iconTile)} />
        <Bar className="h-2.5 w-16" />
      </div>
      <Bar className="h-9 w-16" />
      <Bar className="h-3 w-3/4" />
    </div>
  );
}

export default function PortalLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-8">
      {/* Heading + sponsor pill */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Bar className="h-8 w-64" />
          <Bar className="h-5 w-20 rounded-full" />
        </div>
        <Bar className="h-4 w-full max-w-md" />
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard iconTile="w-12" />
        <SummaryCard iconTile="w-14" />
        <SummaryCard iconTile="w-16" />
      </div>

      {/* Analytics + navigation grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: charts */}
        <div className="space-y-6 lg:col-span-3">
          <div className="bh-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bar className="h-8 w-8 rounded-lg shrink-0" />
              <Bar className="h-4 w-32" />
            </div>
            <div className="space-y-2 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Bar className="h-3 w-16 shrink-0" />
                  <Bar
                    className={cn(
                      "h-4 flex-1 rounded",
                      i % 2 === 0 ? "w-2/3" : "w-1/2",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

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
        </div>

        {/* Right: CTA + action cards */}
        <div className="space-y-6 lg:col-span-2">
          <div className="bh-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bar className="h-4 w-4 rounded shrink-0" />
              <Bar className="h-4 w-36" />
            </div>
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-2/3" />
            <Bar className="h-9 w-36 rounded-full" />
          </div>

          <div className="bh-card p-5 space-y-2">
            <Bar className="h-4 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Bar className="h-4 w-4 rounded shrink-0" />
                <Bar className={cn("h-3", i % 2 === 0 ? "w-24" : "w-20")} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
