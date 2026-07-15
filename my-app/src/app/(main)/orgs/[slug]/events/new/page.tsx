import { auth0 } from "@/lib/auth0";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import OrgEventCreateForm from "./event-create-form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `New Event — ${slug}`,
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

  // Verify the user is an admin of this chapter
  const { data: membershipProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single();

  const { data: membership } = await supabase
    .from("chapter_members")
    .select("org_role")
    .eq("chapter_id", chapter.id)
    .eq("profile_id", membershipProfile?.id ?? "none")
    .single();

  if (membership?.org_role !== "admin") {
    redirect(`/orgs/${slug}/events`);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          New Event — {chapter.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new event for your chapter members.
        </p>
      </div>

      <OrgEventCreateForm chapterId={chapter.id} chapterSlug={slug} />
    </div>
  );
}
