import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function OrganizerApiKeysLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-11 w-44 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
        <div className="space-y-6">
          <CardSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
