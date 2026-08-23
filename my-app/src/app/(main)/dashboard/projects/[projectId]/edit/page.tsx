import { notFound, redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import { createClient } from '@/utils/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import EditProjectForm from './edit-form';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> => {
  const { projectId } = await params;
  return buildPageMetadata({
    title: `Edit Project | Butwal Hacks`,
    description: `Edit your submitted project on Butwal Hacks. Update your project title, description, tech stack, and links.`,
    path: `/dashboard/projects/${projectId}/edit`,
  });
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();

  // Resolve profile UUID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  if (!profile) redirect('/sign-in');

  // Fetch project and verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!project || project.profile_id !== profile.id) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/dashboard/hacker/projects"
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to My Projects
        </Link>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight font-heading">
            Edit <span className="text-primary-red">Project</span>
          </h1>
          <p className="text-lg text-secondary">
            Update your project details below.
          </p>
        </div>

        <EditProjectForm project={project} />
      </div>
    </div>
  );
}
