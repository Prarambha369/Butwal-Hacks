import { Skeleton } from "@/components/ui/skeleton";

export default function InitiativeDetailLoading() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Skeleton className="h-4 w-48 mb-8" />

        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-12 w-3/4 mb-3" />
        <Skeleton className="h-6 w-full mb-8" />

        <div className="space-y-3 mb-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Related events skeleton */}
        <div className="mt-12 pt-12 border-t border-border">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-32 mb-1" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
