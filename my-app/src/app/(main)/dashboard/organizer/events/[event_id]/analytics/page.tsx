import React from 'react';


import ProjectAnalyticsGrid from '@/components/dashboard/organizer/project-analytics-grid';

export default async function ProjectAnalyticsPage({ params }: { params: Promise<{ event_id: string }> }) {
  const { event_id } = await params;

  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            Project <span className="text-bh-red-500">Analytics</span>
          </h1>
          <p className="text-xl text-secondary">
            Monitor the impact and engagement of projects submitted for this event.
          </p>
        </div>
        
        <ProjectAnalyticsGrid eventId={event_id} />
      </div>
    </div>
  );
}
