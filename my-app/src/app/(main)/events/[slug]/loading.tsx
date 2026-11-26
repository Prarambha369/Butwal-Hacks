import { Skeleton } from "@/components/ui/skeleton"

/**
 * The event page's own loading state, so opening an event shows its hero's
 * shape (title block beside a 16:9 banner) instead of inheriting the list
 * skeleton from /events/loading.tsx.
 */
export default function EventLoading() {
  return (
    <div className="border-b border-border" aria-busy="true" aria-label="Loading event">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:pb-14">
        <Skeleton className="h-3 w-48 motion-reduce:animate-none" />
        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
          <div className="order-2 space-y-4 lg:order-1">
            <Skeleton className="h-6 w-32 rounded-full motion-reduce:animate-none" />
            <Skeleton className="h-12 w-4/5 motion-reduce:animate-none" />
            <Skeleton className="h-5 w-3/5 motion-reduce:animate-none" />
            <Skeleton className="h-5 w-2/5 motion-reduce:animate-none" />
            <Skeleton className="h-11 w-52 rounded-full motion-reduce:animate-none" />
          </div>
          <Skeleton className="order-1 aspect-video w-full rounded-2xl motion-reduce:animate-none lg:order-2" />
        </div>
      </div>
    </div>
  )
}
