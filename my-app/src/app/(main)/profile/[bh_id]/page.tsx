import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

import { getUserProjects } from '@/lib/actions/projects';
import ProfileClient from '@/components/hacker-id/profile-client';

export const dynamic = "force-dynamic";

export default async function HackerProfilePage({ params }: { params: Promise<{ bh_id: string }> }) {
  const { bh_id } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      trust_markers (
        id, title, description, type, is_revoked, created_at,
        events ( title, start_date ),
        issuer:profiles!trust_markers_issuer_id_fkey ( full_name, bh_id )
      )
    `)
    .eq('bh_id', bh_id)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Fetch actual projects for the profile view
  const userProjects = await getUserProjects(profile.id);

  return <ProfileClient profile={profile} projects={userProjects} />;
}
