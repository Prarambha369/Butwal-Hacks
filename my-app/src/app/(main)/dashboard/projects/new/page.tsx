

import ProjectSubmissionForm from '@/components/projects/project-submission-form';

export default function NewProjectPage() {
  return (
    <div className="min-h-dvh bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            Submit <span className="text-primary-red">Project</span>
          </h1>
          <p className="text-xl text-secondary">
            Fill in the details below to add your project.
          </p>
        </div>
        
        <ProjectSubmissionForm />
      </div>
    </div>
  );
}
