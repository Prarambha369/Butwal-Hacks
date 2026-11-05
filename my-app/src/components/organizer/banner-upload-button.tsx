"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { X, Loader2 } from "lucide-react";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { updateEventBanner } from "@/lib/actions/events";
import { cn } from "@/lib/utils";

interface BannerUploadButtonProps {
  eventId: string;
  currentBannerUrl: string | null;
  className?: string;
}

export function BannerUploadButton({
  eventId,
  currentBannerUrl,
  className,
}: BannerUploadButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleUpload = useCallback(
    async (url: string) => {
      setError(null);
      try {
        const result = await updateEventBanner(eventId, url);
        if (!result.success) {
          setError(result.error ?? "Could not save banner");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save banner",
        );
      } finally {
        // no-op: CloudinaryUpload shows its own upload progress
      }
    },
    [eventId],
  );

  const handleRemove = useCallback(async () => {
    if (!currentBannerUrl) return;
    setRemoving(true);
    setError(null);
    try {
      const result = await updateEventBanner(eventId, "");
      if (!result.success) {
        setError(result.error ?? "Could not remove banner");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove banner",
      );
    } finally {
      setRemoving(false);
    }
  }, [eventId, currentBannerUrl]);

  return (
    <div className={cn("space-y-2", className)}>
      {currentBannerUrl && (
        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-border">
          <Image
            src={currentBannerUrl}
            alt="Current event banner"
            fill
            className="object-cover"
          />
          <button
            type="button"
            disabled={removing}
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-primary hover:bg-background/90 transition-colors disabled:opacity-50"
            title="Remove banner"
          >
            {removing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      <CloudinaryUpload
        label="Upload banner"
        entityType="event_banner"
        currentImage={currentBannerUrl ?? undefined}
        onUpload={handleUpload}
        onError={setError}
        compact={false}
      />

      {error && (
        <p className="text-xs text-primary-red font-medium">{error}</p>
      )}
    </div>
  );
}
