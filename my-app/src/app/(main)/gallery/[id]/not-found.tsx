import Link from "next/link";
import { ArrowLeft, ImageOff } from "lucide-react";

/**
 * Neutral 404 for a gallery photo.
 *
 * It must not hint at what the photo was: the id may belong to a rejected or
 * deleted upload, and "removed" details would leak moderation state. One
 * sentence covers both cases without confirming either.
 */
export default function GalleryPhotoNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 pt-24 pb-16">
      <div className="bh-card w-full max-w-md p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
          <ImageOff className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-primary">
          This photo isn&apos;t available
        </h1>
        <p className="text-sm leading-relaxed text-secondary">
          It may have been removed, or it hasn&apos;t been approved for the
          public gallery yet.
        </p>
        <Link href="/gallery" className="bh-btn-secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to gallery
        </Link>
      </div>
    </div>
  );
}
