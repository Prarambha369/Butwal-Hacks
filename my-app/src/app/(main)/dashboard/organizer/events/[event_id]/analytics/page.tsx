

import ProjectAnalyticsGrid from '@/components/dashboard/organizer/project-analytics-grid';

export default async function ProjectAnalyticsPage({ params }: { params: Promise<{ event_id: string }> }) {
  const { event_id } = await params;

  return (
    <div>
      <div className="space-y-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Project Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor the impact and engagement of projects submitted for this event.
        </p>
      </div>
      
      <ProjectAnalyticsGrid eventId={event_id} />
    </div>
  );
}
