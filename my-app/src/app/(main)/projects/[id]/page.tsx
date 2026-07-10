import React from 'react';
import { notFound } from 'next/navigation';
import { getProjectDetails } from '@/lib/actions/project-details';
import ProjectDetailView from '@/components/projects/project-detail-view';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectDetails(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 md:px-6 lg:px-12">
      <ProjectDetailView project={project} />
    </div>
  );
}
