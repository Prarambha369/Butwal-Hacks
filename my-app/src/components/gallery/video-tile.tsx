"use client";

import { videoPlaybackUrl, videoPosterUrl } from "@/lib/cloudinary-url";

/**
 * Poster-only presentation of a video. No interactivity.
 *
 * A gallery tile is sometimes already a <button> (the event gallery grid is),
 * and nesting interactive elements is invalid HTML and breaks keyboard
 * navigation. This renders the poster with no interactivity so such a caller
 * can drop it inside its own button and open the lightbox from there.
 */
export function VideoPoster({
  url,
  width,
  alt,
  className = "",
}: {
  url: string;
  width: number;
  alt: string;
  className?: string;
}) {
  const poster = videoPosterUrl(url, width);
  if (!poster) return <div className={`h-full w-full bg-surface-hover ${className}`} />;
  return (
    // The poster is already a Cloudinary-derived still at the exact width this
    // tile wants (see videoPosterUrl). next/image would re-optimize an
    // already-optimized transform and add a loader hop for no gain.
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={poster}
      alt={alt}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/**
 * Lightweight inline player for the full-screen/lightbox view.
 *
 * Separate from VideoPoster because the lightbox is already the user's explicit
 * "I want to see this one" action, so controls can be on and metadata preload
 * is fine there.
 */
export function VideoPlayer({
  url,
  width,
  alt,
}: {
  url: string;
  width: number;
  alt: string;
}) {
  const poster = videoPosterUrl(url, width);
  return (
    <video
      src={videoPlaybackUrl(url, width)}
      poster={poster ?? undefined}
      controls
      autoPlay
      playsInline
      preload="metadata"
      aria-label={alt}
      className="max-h-[80vh] w-full bg-black object-contain"
    />
  );
}
