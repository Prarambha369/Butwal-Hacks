"use client";

import { useState } from "react";
import NextDynamic from "next/dynamic";
import { PhotoModerationGrid } from "@/components/photo-moderation-grid";
import {
  getPendingPhotos,
  type GalleryPhotoRow,
} from "@/lib/actions/photos";

// Lazy: keeps the Cloudinary Admin SDK (used for optimization previews)
// out of the initial module graph — it loads only when a maintainer
// opens the dialog.
const PhotoOptimizeDialog = NextDynamic(() =>
  import("@/components/photo-optimize-dialog").then((m) => m.PhotoOptimizeDialog),
  { ssr: false },
);

export function MaintainerPhotosClient({
  initialQueue,
}: {
  initialQueue: GalleryPhotoRow[];
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState<GalleryPhotoRow | null>(null);

  async function refresh() {
    try {
      setError(null);
      setQueue(await getPendingPhotos());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload queue");
    }
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
        Member uploads from every event land here as pending. Approve to
        publish to the gallery — then <strong className="text-primary">Set as cover</strong> on
        one photo per event to feature it on the homepage.
      </p>
      {error && <p className="text-sm text-primary-red" role="alert">{error}</p>}
      <PhotoModerationGrid
        photos={queue}
        showEvent
        allowCover
        allowOptimize
        onOptimize={setOptimizing}
        onChanged={refresh}
      />
      {optimizing && (
        <PhotoOptimizeDialog
          photo={optimizing}
          onClose={() => setOptimizing(null)}
          onApplied={refresh}
        />
      )}
    </div>
  );
}
