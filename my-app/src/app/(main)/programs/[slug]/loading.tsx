import { Skeleton } from "@/components/ui/skeleton";

export default function ProgramDetailLoading() {
  return (
    <div className="min-h-dvh pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Skeleton */}
        <div className="rounded-xl bh-card p-4 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="w-full lg:w-1/2 aspect-video rounded-xl bg-surface-hover animate-pulse" />
            <div className="w-full lg:w-1/2 space-y-6">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-6 border-y border-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-12 w-36 rounded-full" />
                <Skeleton className="h-12 w-40 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-96 rounded-full" />
        </div>
      </div>
    </div>
  );
}
