"use client";

import { useState } from "react";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { PhotoModerationGrid } from "@/components/photo-moderation-grid";
import {
  addEventPhotos,
  getEventPhotos,
  type GalleryPhotoRow,
} from "@/lib/actions/photos";

export function EventPhotosClient({
  eventId,
  eventSlug,
  initialPhotos,
}: {
  eventId: string;
  eventSlug?: string;
  initialPhotos: GalleryPhotoRow[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function refresh() {
    try {
      setPhotos(await getEventPhotos(eventId));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to reload photos");
    }
  }

  async function handleUpload(url: string) {
    setUploadError(null);
    setNotice(null);
    const res = await addEventPhotos(eventId, [url]);
    if (!res.success) {
      setUploadError(res.error ?? "Upload failed");
      return;
    }
    setNotice("Photo uploaded — pending review before it appears publicly.");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="bh-card space-y-3 p-6">
        <h2 className="text-base font-bold text-primary">Add photos</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Any member can upload moments from this event. New uploads stay
          pending until you or a maintainer approves them.
        </p>
        <CloudinaryUpload
          entityType="gallery_photo"
          eventSlug={eventSlug}
          onUpload={handleUpload}
          onError={setUploadError}
        />
        {uploadError && <p className="text-sm text-primary-red" role="alert">{uploadError}</p>}
        {notice && <p className="text-sm text-status-green">{notice}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-primary">
          Photos ({photos.length})
        </h2>
        <PhotoModerationGrid photos={photos} onChanged={refresh} />
      </div>
    </div>
  );
}
