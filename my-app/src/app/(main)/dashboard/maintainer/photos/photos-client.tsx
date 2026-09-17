"use client";

import { useState } from "react";
import { PhotoModerationGrid } from "@/components/photo-moderation-grid";
import {
  getPendingPhotos,
  type GalleryPhotoRow,
} from "@/lib/actions/photos";

export function MaintainerPhotosClient({
  initialQueue,
}: {
  initialQueue: GalleryPhotoRow[];
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [error, setError] = useState<string | null>(null);

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
        onChanged={refresh}
      />
    </div>
  );
}
