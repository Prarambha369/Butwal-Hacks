import { auth0 } from "@/lib/auth0";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import OrgEventCreationForm from "@/components/organizer/org-event-creation-form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `Create Event — ${slug}`,
    description: `Create a new event for the ${slug} chapter.`,
    path: `/orgs/${slug}/events/new`,
  });
}

export default async function NewOrgEventPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect("/sign-in");

  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!chapter) notFound();

  // Check admin role via chapter_members table
  const { data: membershipProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single();

  const { data: membership } = await supabase
    .from("chapter_members")
    .select("org_role")
    .eq("chapter_id", chapter.id)
    .eq("profile_id", membershipProfile?.id ?? 'none')
    .single();

  if (!membership || membership.org_role !== "admin") {
    redirect(`/orgs/${slug}/events`);
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <OrgEventCreationForm
        chapterId={chapter.id}
        chapterSlug={slug}
        chapterName={chapter.name}
      />
    </div>
  );
}
