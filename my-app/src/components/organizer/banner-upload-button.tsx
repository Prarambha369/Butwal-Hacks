"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageIcon, Loader2 } from "lucide-react";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { updateEventBanner } from "@/lib/actions/events";
import {
  BANNER_ACCEPT,
  BANNER_RECOMMENDED,
  bannerFileError,
  bannerLoader,
  isCloudinaryImage,
} from "@/lib/event-banner";
import { cn } from "@/lib/utils";

interface BannerUploadButtonProps {
  eventId: string;
  eventTitle?: string;
  currentBannerUrl: string | null;
  className?: string;
}

/**
 * Upload, replace or remove an event's banner.
 *
 * Flow: pick a JPG/PNG/WebP (≤ 5 MB) → crop to 16:9 → signed upload to the
 * caller's Cloudinary folder → `updateEventBanner(eventId, public_id)`, which
 * re-checks ownership and the asset server-side → refresh, so this page and
 * the public pages show the new banner.
 *
 * Before this, a successful save never refreshed the page (the action
 * revalidated a different path), so the old banner stayed on screen and the
 * upload looked broken; and once a banner existed there was no way to replace
 * it, only remove it.
 */
export function BannerUploadButton({
  eventId,
  eventTitle,
  currentBannerUrl,
  className,
}: BannerUploadButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  // Shown immediately after a save, before the refreshed server props arrive.
  const [localUrl, setLocalUrl] = useState<string | null | undefined>(undefined);
  const shownUrl = localUrl === undefined ? currentBannerUrl : localUrl;

  const save = useCallback(
    async (publicId: string) => {
      setError(null);
      setStatus(null);
      setSaving(true);
      try {
        const result = await updateEventBanner(eventId, publicId);
        if (!result.success) {
          setError(result.error ?? "Could not save the banner.");
          return;
        }
        const url = "banner_url" in result ? (result.banner_url ?? null) : null;
        setLocalUrl(publicId === "" ? null : url);
        setStatus(publicId === "" ? "Banner removed." : "Banner saved. It now shows on the event page.");
        startTransition(() => router.refresh());
      } catch {
        setError("Could not save the banner. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [eventId, router],
  );

  const alt = eventTitle ? `${eventTitle} banner` : "Event banner";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
        {shownUrl ? (
          <Image
            src={shownUrl}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover"
            {...(isCloudinaryImage(shownUrl) ? { loader: bannerLoader } : {})}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs font-medium">No banner yet</span>
          </div>
        )}
        {saving && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            <span className="sr-only">Saving banner</span>
          </div>
        )}
      </div>

      <CloudinaryUpload
        label="Upload banner"
        replaceLabel="Replace banner"
        entityType="event_banner"
        currentImage={shownUrl ?? undefined}
        accept={BANNER_ACCEPT}
        validateFile={bannerFileError}
        onUploadResult={({ publicId }) => void save(publicId)}
        // Compact mode's Remove calls onUpload(""); uploads go through onUploadResult.
        onUpload={(url) => {
          if (url === "") void save("");
        }}
        onError={(message) => {
          setStatus(null);
          setError(message);
        }}
        compact
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        16:9, ideally {BANNER_RECOMMENDED}px. JPG, PNG or WebP, up to 5 MB. You can crop
        after choosing a file; keep text away from the edges so it survives smaller cards.
      </p>

      <div aria-live="polite" className="min-h-[1rem]">
        {error ? (
          <p role="alert" className="text-xs font-medium text-status-red">
            {error}
          </p>
        ) : status ? (
          <p className="text-xs font-medium text-status-green">{status}</p>
        ) : null}
      </div>
    </div>
  );
}
