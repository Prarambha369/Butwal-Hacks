import React from 'react';


import ReviewQueue from '@/components/dashboard/maintainer/review-queue';

export default function ReviewQueuePage() {
  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            Review <span className="text-bh-red-500">Queue</span>
          </h1>
          <p className="text-xl text-secondary">
            Review and verify new project submissions to maintain the quality of the showcase.
          </p>
        </div>
        
        <ReviewQueue />
      </div>
    </div>
  );
}
