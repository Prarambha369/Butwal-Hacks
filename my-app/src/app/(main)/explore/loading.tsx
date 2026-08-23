import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <main className="min-h-dvh bg-background">
      {/* ── HERO SKELETON ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/20">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Eyebrow */}
            <Skeleton className="h-5 w-28 rounded-full mb-6" />
            {/* Title */}
            <Skeleton className="h-12 md:h-14 w-72 md:w-80 mx-auto mb-4" />
            {/* Subtitle */}
            <Skeleton className="h-5 w-64 md:w-72 mx-auto" />
            {/* Search bar */}
            <Skeleton className="h-12 w-full max-w-xl mx-auto mt-8 rounded-xl" />
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bh-card rounded-xl p-4 text-center space-y-2">
                <Skeleton className="h-4 w-4 mx-auto" />
                <Skeleton className="h-7 w-16 mx-auto" />
                <Skeleton className="h-3 w-14 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEMBER DIRECTORY SKELETON ──────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          {/* Section heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-20 rounded-xl" />
          </div>

          {/* Member cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`bh-card p-5 space-y-3 ${i === 0 ? "md:col-span-2 lg:col-span-2" : ""}`}>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-4 w-14 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-4 w-12 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INITIATIVES SKELETON ───────────────────────────────── */}
      <section className="bg-surface-hover border-y border-border/20 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`bh-card p-6 space-y-3 ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className={`h-6 w-3/4 ${i === 0 ? "md:h-8" : ""}`} />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SKELETON ───────────────────────────────────────── */}
      <section className="py-24 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-4">
          <Skeleton className="h-5 w-32 rounded-full mx-auto" />
          <Skeleton className="h-10 md:h-12 w-72 md:w-80 mx-auto" />
          <Skeleton className="h-5 w-80 md:w-96 mx-auto max-w-full" />
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Skeleton className="h-12 w-44 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
        </div>
      </section>
    </main>
  );
}
