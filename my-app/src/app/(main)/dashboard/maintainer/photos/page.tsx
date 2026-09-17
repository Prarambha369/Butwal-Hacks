import { getPendingPhotos } from "@/lib/actions/photos";
import { MaintainerPhotosClient } from "./photos-client";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = { ...buildPageMetadata({ title: "Photos", description: "Review member photo uploads and pick homepage covers", path: "/dashboard/maintainer/photos", keywords: [] }), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function MaintainerPhotosPage() {
  const queue = await getPendingPhotos();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Photos</h1>
        <p className="text-sm text-muted-foreground">
          Review queue ({queue.length} pending)
        </p>
      </div>
      <MaintainerPhotosClient initialQueue={queue} />
    </div>
  );
}
