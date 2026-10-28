import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import { BlogDraftClient, type DraftRow } from "./blog-draft-client";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = {
  ...buildPageMetadata({
    title: "Blog drafts",
    description: "Write a draft post for the Butwal Hacks blog.",
    path: "/dashboard/blog",
    keywords: [],
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const COLUMNS =
  "id, slug, title, excerpt, body, tags, cover_image, is_published, published_at, created_at";

export default async function BlogDraftsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  const supabase = createServiceClient();

  // Authorization before any service-role read: the profile lookup is what
  // proves this session belongs to a member.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (!profile) redirect("/dashboard");

  const { data: drafts } = await supabase
    .from("blog_posts")
    .select(COLUMNS)
    .eq("author_id", profile.id)
    .eq("is_published", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Write a post</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Drafts are private until a maintainer reviews and publishes them. You can edit or delete
          your own drafts at any time.
        </p>
      </div>
      <BlogDraftClient initialDrafts={(drafts ?? []) as DraftRow[]} />
    </div>
  );
}
