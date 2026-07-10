import React from 'react';


import HackerDiscovery from '@/components/dashboard/hacker-discovery';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            Find Your <span className="text-bh-red-500">Dream Team</span>
          </h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Connect with the most talented hackers, designers, and visionaries in the Lumbini Province.
          </p>
        </div>
        
        <HackerDiscovery />
      </div>
    </div>
  );
}
