import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { buildPageMetadata } from "@/lib/seo";
import { Metadata } from "next";
import ProfileClient from "@/components/hacker-id/profile-client";
import { getUserProjects } from "@/lib/actions/projects";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ uniqueId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uniqueId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bh_id")
    .eq("bh_id", uniqueId)
    .single();

  if (!profile) {
    return buildPageMetadata({
      title: "Profile Not Found",
      description: "The requested Hacker ID does not exist.",
      path: `/p/${uniqueId}`,
    });
  }

  return buildPageMetadata({
    title: `${profile.full_name} | Hacker ID ${profile.bh_id}`,
    description: `Official verification profile for ${profile.full_name} (${profile.bh_id}) — Butwal Hacks.`,
    path: `/p/${uniqueId}`,
  });
}

export default async function ProfilePage({ params }: Props) {
  const { uniqueId } = await params;
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
    .eq("bh_id", uniqueId)
    .single();

  if (error || !profile) {
    notFound();
  }

  const projects = await getUserProjects(profile.id);

  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6 md:px-20">
      <ProfileClient profile={profile} projects={projects} />
    </main>
  );
}
