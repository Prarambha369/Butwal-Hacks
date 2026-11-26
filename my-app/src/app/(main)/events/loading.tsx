import { Skeleton } from "@/components/ui/skeleton"

/**
 * /events renders per request (Supabase + session). While it does, the
 * skeleton holds the same boxes the page will fill: a 16:9 featured banner
 * beside its details, then a row of 16:9 cards, so nothing jumps on arrival.
 */
export default function EventsLoading() {
  return (
    <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Loading events">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:pt-14">
        <Skeleton className="h-3 w-32 motion-reduce:animate-none" />
        <Skeleton className="mt-6 h-14 w-56 motion-reduce:animate-none" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl motion-reduce:animate-none" />
        <Skeleton className="mt-2 h-5 w-4/5 max-w-xl motion-reduce:animate-none" />
        <div className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-video w-full rounded-none motion-reduce:animate-none lg:aspect-auto lg:min-h-[20rem]" />
          <div className="space-y-4 p-6 sm:p-8">
            <Skeleton className="h-6 w-32 rounded-full motion-reduce:animate-none" />
            <Skeleton className="h-10 w-4/5 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-2/5 motion-reduce:animate-none" />
            <Skeleton className="h-11 w-36 rounded-full motion-reduce:animate-none" />
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
              <Skeleton className="aspect-video w-full rounded-none motion-reduce:animate-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-6 w-28 rounded-full motion-reduce:animate-none" />
                <Skeleton className="h-5 w-3/4 motion-reduce:animate-none" />
                <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
