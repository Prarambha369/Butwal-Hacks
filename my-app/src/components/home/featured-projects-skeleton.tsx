import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeaturedProjectsSkeleton() {
  return (
    <section className="py-20 space-y-12">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="lg-surface rounded-[20px] p-4">
            <Skeleton variant="image" className="h-48 rounded-2xl mb-6" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center justify-between pt-4 border-t border-glass">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
