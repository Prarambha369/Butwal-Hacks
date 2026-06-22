import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { buildPageMetadata } from "@/lib/seo";
import { Metadata } from "next";
import ProfileClient from "@/components/hacker-id/profile-client";
import { getUserProjects } from "@/lib/actions/projects";

// ISR: cache profile for 60s, revalidate on next request if stale.
// Gives static speed for recruiters browsing profiles while keeping
// data fresh enough for recent Trust Marker changes.
export const revalidate = 60;

type Props = {
  params: Promise<{ slug_id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug_id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bh_id")
    .eq("bh_id", slug_id)
    .single();

  if (!profile) {
    return buildPageMetadata({
      title: "Profile Not Found",
      description: "The requested Hacker ID does not exist.",
      path: `/p/${slug_id}`,
    });
  }

  return buildPageMetadata({
    title: `${profile.full_name} | Hacker ID ${profile.bh_id}`,
    description: `Official verification profile for ${profile.full_name} (${profile.bh_id}) — Butwal Hacks.`,
    path: `/p/${slug_id}`,
  });
}

export default async function ProfilePage({ params }: Props) {
  const { slug_id } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      *,
      trust_markers (
        id, title, description, type, is_revoked, created_at,
        events ( title, start_date ),
        issuer:profiles!trust_markers_issuer_id_fkey ( full_name, bh_id )
      )
    `)
    .eq("bh_id", slug_id)
    .single();

  if (error || !profile) {
    notFound();
  }

  const projects = await getUserProjects(profile.id);

  return (
    <main className="min-h-dvh bg-background pt-24 pb-12 px-6 md:px-20">
      <ProfileClient profile={profile} projects={projects} />
    </main>
  );
}
