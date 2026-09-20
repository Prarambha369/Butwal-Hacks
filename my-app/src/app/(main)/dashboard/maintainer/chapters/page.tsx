import { getAllChapters } from "@/lib/actions/chapters";
import { ChaptersClient } from "./chapters-client";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = { ...buildPageMetadata({ title: "Chapters", description: "Manage school chapters", path: "/dashboard/maintainer/chapters", keywords: [] }), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function MaintainerChaptersPage() {
  let chapters: Awaited<ReturnType<typeof getAllChapters>> = [];
  let missing = false;
  try {
    chapters = await getAllChapters();
  } catch {
    // Preview/dev DB behind on migration 121: show the editor empty with
    // a notice instead of crashing.
    missing = true;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Chapters</h1>
        <p className="text-sm text-muted-foreground">
          School chapters ({chapters.filter((c) => c.is_active).length} visible)
        </p>
      </div>
      {missing && (
        <p className="rounded-xl border border-status-yellow/30 bg-status-yellow/5 p-4 text-sm text-muted-foreground" role="alert">
          The chapters table is missing here (migration 121 not applied). Apply migrations to manage chapters; the public page uses the built-in list until then.
        </p>
      )}
      <ChaptersClient initialChapters={chapters} />
    </div>
  );
}
