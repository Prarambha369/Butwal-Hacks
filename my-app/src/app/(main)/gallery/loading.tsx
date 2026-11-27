import { Skeleton } from "@/components/ui/skeleton";
import { GallerySkeletonTiles } from "./gallery-grid";

// Shown while the gallery renders (first request after a revalidation, or a
// client navigation before the RSC payload arrives).
export default function GalleryLoading() {
  return (
    <main className="min-h-dvh bg-background pt-28 pb-20 px-6 md:px-20" aria-busy="true">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-center space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-72 md:h-12 md:w-80" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <div className="mb-6 flex justify-center gap-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="mb-8 flex justify-center gap-2 overflow-hidden py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <GallerySkeletonTiles count={8} />
        </div>
        <span className="sr-only" role="status">Loading gallery</span>
      </div>
    </main>
  );
}
