import { cn } from "@/lib/utils";

/**
 * Route loading skeleton — a generic dashboard shell. This boundary is the
 * fallback for every /dashboard child route that lacks its own loading.tsx,
 * so it must stay an uncommitted shell shape rather than mirror any single
 * page. Its proportions follow `/dashboard/page.tsx` only as a neutral
 * template: a PageHeader (eyebrow / title / description), the BH-ID
 * identity card, a row of stat tiles, the onboarding steps list, and the
 * closing CTA card. Server component only — the pulse animates via
 * `motion-safe:` utilities, so no client JS ships with it.
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

export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" className="pt-16 pb-20 px-4">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* PageHeader: eyebrow, title, description */}
        <div className="space-y-2">
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-72" />
          <Bar className="h-4 w-full max-w-xl" />
        </div>

        {/* BH-ID identity claim card */}
        <div className="bh-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bar className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Bar className="h-4 w-32" />
              <Bar className="h-3 w-48" />
            </div>
          </div>
          <Bar className="h-3 w-2/3" />
          <Bar className="h-9 w-40 rounded-full" />
        </div>

        {/* Stats & activity tiles */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile valueWidth="w-12" />
          <StatTile valueWidth="w-16" />
          <StatTile valueWidth="w-10" />
          <StatTile valueWidth="w-14" />
        </div>

        {/* Onboarding steps */}
        <div className="bh-card p-6 space-y-4">
          <Bar className="h-4 w-44" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Bar className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Bar className={cn("h-3", i % 2 === 0 ? "w-1/3" : "w-1/4")} />
                  <Bar className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tool guide */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bh-card p-5 space-y-3">
              <Bar className="h-8 w-8 rounded-lg" />
              <Bar className="h-4 w-3/4" />
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-2/3" />
            </div>
          ))}
        </div>

        {/* Quick-start CTA card */}
        <div className="bh-card p-6 text-center space-y-4 md:p-8">
          <Bar className="mx-auto h-5 w-48" />
          <Bar className="mx-auto h-4 w-3/4 max-w-md" />
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Bar className="h-11 w-44 rounded-full" />
            <Bar className="h-11 w-44 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
