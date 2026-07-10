import React from 'react';


import ProjectSubmissionForm from '@/components/projects/project-submission-form';

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            Submit <span className="text-bh-red-500">Project</span>
          </h1>
          <p className="text-xl text-secondary">
            Showcase your hard work to the world. Fill in the details below to add your project to the gallery.
          </p>
        </div>
        
        <ProjectSubmissionForm />
      </div>
    </div>
  );
}
