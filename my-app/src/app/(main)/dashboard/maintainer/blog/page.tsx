import { getAllPosts } from "@/lib/actions/blog";
import { BlogClient } from "./blog-client";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = { ...buildPageMetadata({ title: "Blog", description: "Write and publish posts", path: "/dashboard/maintainer/blog", keywords: [] }), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function MaintainerBlogPage() {
  let posts: Awaited<ReturnType<typeof getAllPosts>> = [];
  let missing = false;
  try {
    posts = await getAllPosts();
  } catch {
    missing = true;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Write once, publish everywhere ({posts.filter((p) => p.is_published).length} live)
        </p>
      </div>
      {missing && (
        <p className="rounded-xl border border-status-yellow/30 bg-status-yellow/5 p-4 text-sm text-muted-foreground" role="alert">
          The blog_posts table is missing here (migration 122 not applied). Apply migrations to publish; the public blog uses the built-in posts until then.
        </p>
      )}
      <BlogClient initialPosts={posts} />
    </div>
  );
}
