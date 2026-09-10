import { notFound } from 'next/navigation';
import { createServiceClient } from '@/utils/supabase';

import { getUserProjects } from '@/lib/actions/projects';
import ProfileClient from '@/components/hacker-id/profile-client';

export const dynamic = "force-dynamic";

export default async function HackerProfilePage({ params }: { params: Promise<{ bh_id: string }> }) {
  const { bh_id } = await params;
  const supabase = createServiceClient();

  // Explicit public allowlist — never select("*") on profiles with the service
  // role key: email, is_suspended, and other private columns would be shipped
  // to the browser. Only fields the public profile renders belong here.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, bh_id, role, bio, avatar_url, social_links, ai_summary,
      trust_markers!trust_markers_profile_id_fkey (
        id, title, description, type, is_revoked, revocation_reason, created_at,
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
