"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, ChevronLeft, ChevronRight, Users, Play, Pause,
  Camera, Video, ImageIcon, Loader2,
  ExternalLink, Download, LogIn, Share2, Check, AlertCircle, RotateCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cloudinaryDownloadUrl,
  cloudinaryImageLoader,
  fallBackToWebmOnDecodeError,
  isVideoUrl,
  videoPosterUrl,
  videoSources,
} from "@/lib/cloudinary-url";
// Server actions live in `lib`; the page's types are re-exported there, so
// import both from one place rather than through `./page`.
import { fetchGalleryPage } from "@/lib/actions/gallery";
import type { GalleryPhoto, GalleryTotals } from "@/lib/actions/gallery";

// ─── Text helpers ──────────────────────────────────────────────────

/**
 * Event date, pinned to Nepal time so the server render and the browser agree
 * (a visitor's own timezone could otherwise shift a late-evening start by a
 * day and cause a hydration mismatch). Empty when the value is unparseable.
 */
export function formatGalleryDate(value: string, month: "short" | "long" = "short"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month,
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  });
}

/** What the item shows: its caption, or the event title when it has none. */
export function galleryAlt(photo: Pick<GalleryPhoto, "caption" | "event">): string {
  return photo.caption ?? photo.event;
}

const GRID_CLASS = "grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4";

export interface GalleryGroup {
  /** Stable React key: event title plus the index of its first item. */
  key: string;
  event: string;
  eventSlug: string | null;
  date: string;
  location: string | null;
  items: { photo: GalleryPhoto; index: number }[];
}

/**
 * Consecutive items of the same event become one section with its own date
 * header. Each item keeps its index in the flat list, so the lightbox can
 * still step across section boundaries. Runs are split only where the event
 * changes, so appending a page extends the last section instead of starting
 * a new one.
 */
export function groupByEvent(photos: GalleryPhoto[]): GalleryGroup[] {
  const groups: GalleryGroup[] = [];
  photos.forEach((photo, index) => {
    const last = groups[groups.length - 1];
    if (last && last.event === photo.event) {
      last.items.push({ photo, index });
      return;
    }
    groups.push({
      key: `${photo.event}-${index}`,
      event: photo.event,
      eventSlug: photo.event_slug,
      date: photo.date,
      location: photo.location,
      items: [{ photo, index }],
    });
  });
  return groups;
}

// ─── Failure handling ──────────────────────────────────────────────
// Nothing in the gallery retries on its own. A failed request is retried only
// when the visitor presses a Retry button, and repeated failures back off, so
// a broken connection or a rate-limited server never turns into a request
// loop (the edge firewall caps page-path requests per IP per minute, and
// pagination runs as a server action posted to the page path).

/** Seconds to wait before the next retry after `failures` failures in a row. */
export function retryDelaySeconds(failures: number): number {
  if (failures <= 1) return 0;
  return Math.min(2 ** (failures - 1), 30);
}

/**
 * Counts consecutive failures and holds the Retry button disabled for the
 * backoff delay. `fail()` after an error, `succeed()` after a good response.
 */
export function useRetryBackoff() {
  const failuresRef = useRef(0);
  const [readyAt, setReadyAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const waiting = readyAt > now;
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [waiting]);
  const fail = useCallback(() => {
    failuresRef.current += 1;
    const at = Date.now();
    setNow(at);
    setReadyAt(at + retryDelaySeconds(failuresRef.current) * 1000);
  }, []);
  const succeed = useCallback(() => {
    failuresRef.current = 0;
    setReadyAt(0);
  }, []);
  const secondsLeft = waiting ? Math.ceil((readyAt - now) / 1000) : 0;
  return { secondsLeft, fail, succeed };
}

/**
 * Error panel for a failed grid request (first page of a filter, or the next
 * page). It sits where the next items would have appeared, below everything
 * already loaded, so a visitor who scrolled down sees it in place instead of
 * having to scroll back to the top. The message is announced politely and the
 * Retry button comes after it.
 */
function GalleryLoadError({
  message,
  onRetry,
  secondsLeft,
  busy,
}: {
  message: string;
  onRetry: () => void;
  secondsLeft: number;
  busy: boolean;
}) {
  // aria-disabled rather than disabled: a disabled button drops keyboard
  // focus to the page body, and the visitor would lose their place.
  const unavailable = busy || secondsLeft > 0;
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 text-center">
      <AlertCircle className="h-6 w-6 text-primary-red" aria-hidden="true" />
      <p className="text-sm text-primary" role="alert">
        {message}
      </p>
      <button
        type="button"
        onClick={() => {
          if (!unavailable) onRetry();
        }}
        aria-disabled={unavailable}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-bold text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-disabled:cursor-not-allowed aria-disabled:opacity-60 motion-reduce:transition-none"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <RotateCw className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Trying again" : secondsLeft > 0 ? `Try again in ${secondsLeft}s` : "Try again"}
      </button>
    </div>
  );
}

/**
 * `onError` for a gallery `<video>`: an H.264 decode failure falls back to the
 * WebM; once there is nothing left to fall back to, report the failure so the
 * tile or lightbox can show its Retry state instead of a dead black box.
 */
export function handleVideoError(
  event: { currentTarget: HTMLVideoElement },
  onFail: () => void,
): void {
  const video = event.currentTarget;
  if (!video.error) return;
  const canFallBack =
    /\.mp4(\?|$)/.test(video.currentSrc) &&
    video.querySelector('source[type^="video/mp4"]') !== null;
  if (canFallBack) fallBackToWebmOnDecodeError(event);
  else onFail();
}

// ─── Loading skeleton ──────────────────────────────────────────────
// Same box as a real card (a 4:3 rounded tile), so tiles swap in without the
// grid jumping.

export function GallerySkeletonTiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="aspect-[4/3] w-full rounded-xl motion-reduce:animate-none"
        />
      ))}
    </>
  );
}

// ─── Video Thumbnail ───────────────────────────────────────────────

function VideoThumbnail({ url, onFail }: { url: string; onFail: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // The badge follows the element's own `playing`/`pause` events rather than
  // the play() promise: when the WebM fallback reloads the element, the first
  // promise rejects even though the clip then plays from the WebM.
  const handleMouseEnter = useCallback(() => {
    // A hover preview is motion the viewer did not ask for. With reduced
    // motion the tile stays on its poster; clicking still opens the player.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const poster = videoPosterUrl(url, 640);
  return (
    <div
      className="relative w-full h-full bg-surface-inverse"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* The poster is an <img> under the video rather than the video's
          poster attribute: a poster attribute that fails to load fires no
          error event, so the tile could never offer Retry. The video stays
          transparent until its first frame, then covers it. */}
      {poster && (
        // A Cloudinary-derived still at the tile's width; next/image would
        // only re-optimize it (same reasoning as VideoPoster).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          // A server-rendered image can fail before hydration attaches
          // onError; a broken image is `complete` with no natural width.
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) onFail();
          }}
          src={poster}
          alt=""
          loading="lazy"
          onError={onFail}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        // The poster already paints the tile; don't fetch every clip's
        // metadata on page load. Bytes start on hover.
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={(e) => handleVideoError(e, onFail)}
      >
        {/* With <source> children a failed load fires `error` on the source,
            not the <video>, so the last one reports the failure. */}
        {videoSources(url, 640).map((s, i, all) => (
          <source
            key={s.src}
            src={s.src}
            type={s.type}
            onError={i === all.length - 1 ? onFail : undefined}
          />
        ))}
      </video>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          playing ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Phones have no hover preview and the corner chip already marks the
            tile as a video, so the badge would only cover the caption. */}
        <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/40 backdrop-blur-sm sm:flex">
          <Play className="ml-0.5 h-5 w-5 fill-white text-white" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// ─── Photo thumbnail with fade-in ──────────────────────────────────
// Pulses until the bytes arrive, then fades in. Replaces the old scroll-reveal
// wrapper, which kept every tile invisible until it was scrolled into view.

function PhotoThumbnail({ photo, onFail }: { photo: GalleryPhoto; onFail: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none motion-reduce:animate-none" />}
      <Image
        // Stored URL + loader: each srcset width is a Cloudinary transform
        // served from its CDN, not a round trip through /_next/image.
        src={photo.url}
        loader={cloudinaryImageLoader(photo.optimize, 800)}
        alt={galleryAlt(photo)}
        fill
        sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        className={`object-cover transition-[opacity,transform] duration-500 ease-out motion-safe:group-hover:scale-[1.04] motion-reduce:transition-none ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        // The card shows its own error state with a Retry button. An avatar
        // placeholder here used to pass a failed photo off as a real one.
        onError={onFail}
      />
    </>
  );
}

/**
 * Covers a tile whose media failed: the message first, Retry at the bottom.
 * Rendered beside the card link, not inside it, because a button nested in a
 * link is invalid and unreachable by keyboard.
 */
function TileError({ label, isVideo, onRetry }: { label: string; isVideo: boolean; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-end gap-2 rounded-xl bg-muted p-3 text-center ring-1 ring-border">
      <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-xs font-medium text-primary sm:text-sm" aria-live="polite">
        Couldn&apos;t load this {isVideo ? "video" : "photo"}.
      </p>
      <button
        type="button"
        onClick={onRetry}
        aria-label={`Retry loading ${label}`}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-bold text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm motion-reduce:transition-none"
      >
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

// ─── Lightbox button styles ────────────────────────────────────────
// The lightbox is always a dark stage, in light and dark mode alike, so its
// controls are white-on-black rather than surface tokens. Every control is at
// least 44px tall (WCAG 2.5.5 target size).

const LIGHTBOX_ACTION =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none";
const LIGHTBOX_ICON =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none";

// ─── Download control ──────────────────────────────────────────────
// Best-quality download (stored original bytes via fl_attachment) for
// signed-in users only. Videos stream natively — no download control.
// Anonymous viewers get a sign-in nudge instead of the file URL.

function DownloadControl({
  url,
  isVideo,
  canDownload,
  variant,
}: {
  url: string;
  isVideo: boolean;
  canDownload: boolean;
  variant: "card" | "lightbox";
}) {
  if (isVideo) return null;
  if (!canDownload) {
    if (variant === "card") return null;
    return (
      <Link href="/sign-in" prefetch={false} onClick={(e) => e.stopPropagation()} className={LIGHTBOX_ACTION}>
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Sign in to download
      </Link>
    );
  }
  if (variant === "card") {
    return (
      <a
        href={cloudinaryDownloadUrl(url)}
        download
        onClick={(e) => e.stopPropagation()}
        aria-label="Download photo at full quality"
        title="Download full quality"
        className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 ring-1 ring-white/20 backdrop-blur-sm transition-opacity hover:bg-black/75 hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
      </a>
    );
  }
  return (
    <a
      href={cloudinaryDownloadUrl(url)}
      download
      onClick={(e) => e.stopPropagation()}
      className={LIGHTBOX_ACTION}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Download
    </a>
  );
}

// ─── Share control ─────────────────────────────────────────────────
// The lightbox already sits on the item's canonical URL, so a link to it would
// be a no-op. Native share sheet where the browser has one; otherwise copy the
// link. If the clipboard is refused too, open the item's own page, which has
// the full copy/share fallback.

function ShareControl({ id, title, className }: { id: string; title: string; className: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  // Reset when moving to another item.
  useEffect(() => setCopied(false), [id]);

  const handleClick = () => {
    const url = `${window.location.origin}/gallery/${id}`;
    const copy = () =>
      navigator.clipboard
        .writeText(url)
        .then(() => setCopied(true))
        .catch(() => window.location.assign(`/gallery/${id}`));
    // share() must run synchronously inside the click to keep user activation.
    if (typeof navigator.share === "function") {
      navigator.share({ title, url }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        void copy();
      });
      return;
    }
    void copy();
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}

/** Height of the native video control bar plus slack; swipes starting here scrub instead. */
const VIDEO_CONTROLS_HEIGHT = 96;

// ─── LightboxPhoto (extends GalleryPhoto with nav fields) ──────────

interface LightboxPhoto extends GalleryPhoto {
  index: number;
  total: number;
}

// ─── Lightbox ──────────────────────────────────────────────────────

function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  canDownload,
}: {
  photo: LightboxPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  canDownload: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isVideo = isVideoUrl(photo.url);
  // Mirrors the element's real state via onPlay/onPause — never set it
  // optimistically, because autoplay can be blocked by the browser.
  const [videoPlaying, setVideoPlaying] = useState(false);
  // Full-size image/video still loading: show a spinner over the dark stage
  // instead of an empty black box. Reset per item.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  // Failed media shows a message with Retry below it. Keyed by item, so
  // stepping to the next photo clears it; `attempt` remounts the element.
  const [failedId, setFailedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mediaFailed = failedId === photo.id;
  const mediaLoading = loadedId !== photo.id && !mediaFailed;
  const markLoaded = () => setLoadedId(photo.id);
  const markFailed = () => setFailedId(photo.id);
  const retryMedia = () => {
    setFailedId(null);
    setLoadedId(null);
    setAttempt((n) => n + 1);
  };

  const toggleVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, []);

  // Autoplay with sound is often blocked (Safari, iOS, some Chrome cases).
  // If it is, retry muted so the clip still starts; the native controls let
  // the viewer unmute.
  useEffect(() => {
    const el = videoRef.current;
    if (!isVideo || !el) return;
    el.play().catch((err: unknown) => {
      // Only an autoplay-policy refusal is fixed by muting. An AbortError from
      // the WebM fallback's reload (which resumes playback itself) or a source
      // that failed must not silently mute the clip the viewer opened.
      if (!(err instanceof DOMException) || err.name !== "NotAllowedError") return;
      el.muted = true;
      el.play().catch(() => {});
    });
  }, [isVideo, photo.id, attempt]);

  // Move focus into the dialog on open and hand it back to the card that
  // opened it on close. Without the restore, closing drops the caret onto the
  // document body and keyboard users lose their place in the grid.
  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlayRef.current?.focus();
    // Lock background scroll while the modal is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Keep Tab / Shift+Tab inside the dialog (aria-modal promises this).
      if (e.key === "Tab" && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) {
          e.preventDefault();
          overlayRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        const inside = overlayRef.current.contains(active);
        if (e.shiftKey && (active === first || active === overlayRef.current || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === "Escape") onClose();
      // Arrows on the focused <video> seek it; don't also jump to another item.
      if (e.target instanceof HTMLVideoElement) return;
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  // Swipe left/right on the stage to move between items. The video fills the
  // stage, so a swipe over it still navigates, except when it starts on the
  // native control bar along its bottom edge, where a horizontal drag scrubs.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (e.target instanceof HTMLVideoElement) {
      const box = e.target.getBoundingClientRect();
      if (t.clientY > box.bottom - VIDEO_CONTROLS_HEIGHT) return;
    }
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && hasNext) onNext();
    if (dx > 0 && hasPrev) onPrev();
  };

  const date = formatGalleryDate(photo.date, "long");
  const navButton =
    "absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15 backdrop-blur transition-[opacity,background-color] hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-0 md:h-12 md:w-12 motion-reduce:transition-none";

  return (
    // Full-bleed: the media gets the whole viewport, with a slim bar above
    // (position, close) and the details below, so nothing sits on the photo.
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${galleryAlt(photo)}: ${isVideo ? "video" : "photo"} preview`}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col bg-black text-white outline-none animate-in fade-in duration-200 motion-reduce:animate-none"
    >
      {/* Top bar: position, media type, close */}
      <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
        <div className="flex min-w-0 items-center gap-2 pl-2">
          <span className="font-mono text-sm tabular-nums text-white/80" aria-live="polite">
            {photo.index + 1} / {photo.total}
          </span>
          {isVideo && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
                Video
              </span>
              <button
                type="button"
                onClick={toggleVideo}
                className={LIGHTBOX_ICON}
                aria-label={videoPlaying ? "Pause" : "Play"}
              >
                {videoPlaying ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
              </button>
            </>
          )}
        </div>
        <button type="button" onClick={onClose} className={LIGHTBOX_ICON} aria-label="Close lightbox">
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Stage: prev/next float over the media so phones do not lose width
          to two side buttons. A swipe does the same on touch. */}
      <div className="relative min-h-0 flex-1" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Keyed per item: each photo fades in on its own instead of the old
            one being swapped in place. */}
        <div
          key={photo.id}
          className={`absolute inset-0 animate-in fade-in duration-300 motion-reduce:animate-none ${mediaFailed ? "invisible" : ""}`}
        >
          {isVideo ? (
            <video
              // Fresh element per item (and per retry): no stale playback
              // state or half-buffered src carried across prev/next.
              key={`${photo.id}-${attempt}`}
              ref={videoRef}
              poster={videoPosterUrl(photo.url, 1600) ?? undefined}
              controls
              playsInline
              preload="auto"
              onLoadedData={markLoaded}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => setVideoPlaying(false)}
              // WebM fallback first (Firefox without an H.264 decoder, #63);
              // the failure state only once no source is left.
              onError={(e) => handleVideoError(e, markFailed)}
              className="h-full w-full object-contain"
            >
              {/* With <source> children a failed load fires `error` on the
                  source, not the <video>, so the last one reports it. */}
              {videoSources(photo.url, 1600).map((s, i, all) => (
                <source
                  key={s.src}
                  src={s.src}
                  type={s.type}
                  onError={i === all.length - 1 ? markFailed : undefined}
                />
              ))}
            </video>
          ) : (
            <Image
              key={`${photo.id}-${attempt}`}
              src={photo.url}
              loader={cloudinaryImageLoader(photo.optimize, 1600)}
              alt={galleryAlt(photo)}
              fill
              className="object-contain"
              sizes="100vw"
              onLoad={markLoaded}
              onError={markFailed}
            />
          )}
        </div>

        {mediaFailed && (
          // Centered on the stage, message first and Retry under it. Clear of
          // the prev/next buttons, which sit on the side edges.
          <div className="absolute inset-0 flex items-center justify-center px-16">
            <div className="flex max-w-xs flex-col items-center gap-4 text-center">
              <AlertCircle className="h-8 w-8 text-white/70" aria-hidden="true" />
              <p className="text-sm text-white/90 md:text-base" role="alert">
                Couldn&apos;t load this {isVideo ? "video" : "photo"}. Check your connection.
              </p>
              <button type="button" onClick={retryMedia} className={LIGHTBOX_ACTION}>
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        )}

        {mediaLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Loader2 className="h-8 w-8 animate-spin text-white/70 motion-reduce:animate-none" />
          </div>
        )}

        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className={`${navButton} left-2 md:left-6`}
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`${navButton} right-2 md:right-6`}
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Details sit under the media, not over it, so the caption never
          covers the photo and is readable on any image. */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:flex-row md:items-end md:justify-between md:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-white md:text-lg">
            {galleryAlt(photo)}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70 md:text-sm">
            {photo.caption && <span className="font-semibold text-white/90">{photo.event}</span>}
            {date && <span className="font-mono">{date}</span>}
            {photo.location && <span>{photo.location}</span>}
            {photo.uploader && <span>by {photo.uploader}</span>}
            {isVideo && photo.duration && (
              <span className="font-semibold text-white/90">{Math.round(photo.duration)}s</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareControl id={photo.id} title={`${galleryAlt(photo)} · ${photo.event}`} className={LIGHTBOX_ACTION} />
          {photo.event_slug && (
            <Link href={`/events/${photo.event_slug}`} prefetch={false} onClick={(e) => e.stopPropagation()} className={LIGHTBOX_ACTION}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View event
            </Link>
          )}
          <DownloadControl url={photo.url} isVideo={isVideo} canDownload={canDownload} variant="lightbox" />
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Card ──────────────────────────────────────────────────

function GalleryCard({
  photo,
  index,
  onOpen,
  canDownload,
}: {
  photo: GalleryPhoto;
  index: number;
  onOpen: (event: React.MouseEvent<HTMLAnchorElement>, index: number, id: string) => void;
  canDownload: boolean;
}) {
  const isVideo = isVideoUrl(photo.url);
  const date = formatGalleryDate(photo.date);
  const title = galleryAlt(photo);
  // A retry remounts the media element (new key), which makes the browser
  // request the bytes again. Only on a click: nothing here retries by itself.
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const markFailed = useCallback(() => setFailed(true), []);
  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  return (
    // Wrapper keeps valid HTML: the download control is a sibling of the card
    // link, not nested inside it.
    <div className="group relative">
      <Link
        href={`/gallery/${photo.id}`}
        // No viewport prefetch: a grid of N cards would fire N page-path
        // requests while scrolling, and the click opens the lightbox in place
        // anyway, so the prefetched route was never used.
        prefetch={false}
        onClick={(event) => onOpen(event, index, photo.id)}
        aria-label={[title, photo.caption ? photo.event : null, isVideo ? "video" : "photo", date]
          .filter(Boolean)
          .join(", ")}
        // The 4:3 box is fixed before any byte arrives, so nothing shifts
        // while thumbnails load.
        className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border transition-shadow duration-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
      >
        {isVideo ? (
          <VideoThumbnail key={attempt} url={photo.url} onFail={markFailed} />
        ) : (
          <PhotoThumbnail key={attempt} photo={photo} onFail={markFailed} />
        )}

        {isVideo && (
          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm sm:text-[11px]">
            <Video className="h-3 w-3" aria-hidden="true" />
            {photo.duration ? `${Math.round(photo.duration)}s` : "Video"}
          </span>
        )}

        {/* Caption: always shown on touch screens, which have no hover; on
            pointer devices it rises in on hover or keyboard focus. The
            section header above already names the event and date. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-2.5 pt-8 transition-[opacity,transform] duration-200 ease-out sm:p-3 sm:pt-10 motion-reduce:transition-none [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-sm">{title}</h3>
          <p className="mt-0.5 truncate font-mono text-[10px] text-white/80 sm:text-[11px]">
            {photo.caption ? <span className="hidden sm:inline">{photo.event} · </span> : null}
            {date}
          </p>
        </div>
      </Link>
      {failed ? (
        <TileError label={title} isVideo={isVideo} onRetry={retry} />
      ) : (
        <DownloadControl url={photo.url} isVideo={isVideo} canDownload={canDownload} variant="card" />
      )}
    </div>
  );
}

// ─── Event section ─────────────────────────────────────────────────

function GallerySection({
  group,
  headingId,
  children,
}: {
  group: GalleryGroup;
  headingId: string;
  children: React.ReactNode;
}) {
  const date = formatGalleryDate(group.date, "long");
  return (
    <section aria-labelledby={headingId}>
      <header className="mb-3 flex items-end justify-between gap-3 border-b border-border pb-3 md:mb-5">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-lg font-bold leading-tight text-primary md:text-2xl">
            {group.event}
          </h2>
          <p className="mt-1 flex min-w-0 items-center gap-x-2 text-xs text-secondary md:text-sm">
            {date && (
              <time dateTime={group.date} className="shrink-0 font-mono">
                {date}
              </time>
            )}
            {date && group.location && <span aria-hidden="true">·</span>}
            {group.location && (
              <span className="truncate" title={group.location}>
                {group.location}
              </span>
            )}
          </p>
        </div>
        {group.eventSlug && (
          <Link
            href={`/events/${group.eventSlug}`}
            // One per section; with many sections these add up on scroll.
            prefetch={false}
            className="-mr-3 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-primary-red hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red"
          >
            View event
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

// ─── Main GalleryGrid ──────────────────────────────────────────────

function galleryHref(filter: string | null): string {
  return filter ? `/gallery?event=${encodeURIComponent(filter)}` : "/gallery";
}

export default function GalleryGrid({
  photos: initialPhotos,
  canDownload,
  totals,
  hasMore: initialHasMore,
  events: initialEvents,
  initialFilter = null,
}: {
  photos: GalleryPhoto[];
  canDownload: boolean;
  totals: GalleryTotals;
  hasMore: boolean;
  events?: string[];
  initialFilter?: string | null;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(initialFilter);

  // Pagination state. The server hands over page 1 plus the true totals; the
  // rest is appended as the visitor asks for it.
  const [photos, setPhotos] = useState(initialPhotos);
  const [hasMore, setHasMore] = useState(initialHasMore);
  // Two separate flags: a filter change replaces the grid (show skeletons in
  // its place), a load-more appends (show skeletons after it).
  const [filtering, setFiltering] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Which request failed, so "Try again" repeats that request: a failed filter
  // is re-applied, never retried as the next page of the previous filter.
  const [loadError, setLoadError] = useState<false | "filter" | "page">(false);
  // Stable callbacks (not the object) go into hook deps, so a backoff tick
  // never re-creates loadNextPage and re-arms the scroll observer.
  const { fail: backoffFail, succeed: backoffSucceed, secondsLeft: retrySecondsLeft } = useRetryBackoff();
  // Set when a page came back with nothing new (the boundary shifted under
  // a new upload). Auto-loading then stops, so a page that keeps returning
  // rows already shown cannot become a request loop; Load more still works.
  const [stalled, setStalled] = useState(false);
  // Every request gets a ticket; a response whose ticket is stale is dropped,
  // so tapping two chips quickly can never leave the first event's photos
  // under the second event's label.
  const requestRef = useRef(0);
  // Load-more requests are owned separately: a filter change abandons any
  // pending page, and only the newest page request may clear `loadingMore`.
  const pageRequestRef = useRef(0);
  // Latest photos for the popstate handler, which is registered once.
  const photosRef = useRef(initialPhotos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  // Pages already loaded, per filter ("" = all events). Switching back to a
  // filter you have seen restores it instantly with no request at all.
  const pageCacheRef = useRef(new Map<string, { photos: GalleryPhoto[]; hasMore: boolean }>());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const events = useMemo(() => {
    const base = initialEvents && initialEvents.length
      ? initialEvents
      : Array.from(new Set(initialPhotos.map((p) => p.event)));
    return [...base].sort((a, b) => a.localeCompare(b));
  }, [initialEvents, initialPhotos]);

  // The lightbox is layered on top of a real history entry, so Back closes it
  // instead of leaving the gallery. On any popstate the selection is derived
  // from the destination URL: Forward onto /gallery/<id> reopens that photo,
  // anything else (or an id no longer loaded) closes the lightbox. prev/next
  // use replaceState so they do not stack entries.
  useEffect(() => {
    const handlePopState = () => {
      const match = /^\/gallery\/([^/]+)\/?$/.exec(window.location.pathname);
      if (!match) return setSelectedIdx(null);
      const id = decodeURIComponent(match[1]);
      const index = photosRef.current.findIndex((p) => p.id === id);
      setSelectedIdx(index === -1 ? null : index);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch a server-filtered first page whenever the event filter changes, so
  // selecting an event that is not yet represented in the loaded photos still
  // renders its media instead of an empty grid.
  const applyFilter = useCallback(async (nextFilter: string | null) => {
    if (nextFilter === filter && !loadError) return;
    const ticket = ++requestRef.current;
    // Abandon any in-flight page of the previous filter so its pending state
    // cannot keep this filter's Load more disabled.
    pageRequestRef.current++;
    setLoadingMore(false);
    // Stash what is on screen (including pages appended by scrolling) before
    // swapping it out — unless it is an error/empty state worth refetching.
    if (!loadError && !filtering) {
      pageCacheRef.current.set(filter ?? "", { photos, hasMore });
    }
    // Retrying the filter that failed keeps its error panel (and the focused
    // Retry button) in place until the answer arrives.
    const retryingSame = nextFilter === filter && loadError === "filter";
    setFilter(nextFilter);
    setSelectedIdx(null);
    if (!retryingSame) setLoadError(false);
    // Shareable, reload-safe filter without a server round trip for the shell.
    window.history.replaceState(window.history.state, "", galleryHref(nextFilter));
    const cached = pageCacheRef.current.get(nextFilter ?? "");
    if (cached) {
      setPhotos(cached.photos);
      setHasMore(cached.hasMore);
      setFiltering(false);
      setLoadError(false);
      setStalled(false);
      return;
    }
    setFiltering(true);
    try {
      const page = await fetchGalleryPage(0, nextFilter ?? undefined);
      if (ticket !== requestRef.current) return;
      setPhotos(page.photos);
      setHasMore(page.hasMore);
      setStalled(false);
      setLoadError(false);
      backoffSucceed();
    } catch {
      if (ticket === requestRef.current) {
        // Don't leave the previous filter's photos labelled as this one's.
        setPhotos([]);
        setHasMore(false);
        setLoadError("filter");
        backoffFail();
      }
    } finally {
      if (ticket === requestRef.current) setFiltering(false);
    }
  }, [filter, loadError, filtering, photos, hasMore, backoffFail, backoffSucceed]);

  // "auto" is everything the visitor did not ask for by pressing a button:
  // infinite scroll, and nearing the end in the lightbox. Those never run
  // after a failure (or a page that added nothing), so only Retry, with its
  // backoff, can send the next request. A retry keeps the error panel
  // mounted until it succeeds, so focus stays on the button.
  const loadNextPage = useCallback(async (mode: "auto" | "manual") => {
    if (loadingMore || filtering || !hasMore) return;
    if (mode === "auto" && (loadError || stalled)) return;
    const ticket = requestRef.current;
    const pageTicket = ++pageRequestRef.current;
    setLoadingMore(true);
    try {
      const next = await fetchGalleryPage(photos.length, filter ?? undefined);
      if (ticket !== requestRef.current) return;
      // Dedupe by id in case a new upload shifted the page boundary.
      const seen = new Set(photos.map((p) => p.id));
      const fresh = next.photos.filter((p) => !seen.has(p.id));
      setPhotos((prev) => [...prev, ...fresh]);
      setHasMore(next.hasMore);
      setStalled(fresh.length === 0);
      setLoadError(false);
      backoffSucceed();
    } catch {
      if (ticket === requestRef.current) {
        setLoadError("page");
        backoffFail();
      }
    } finally {
      if (pageTicket === pageRequestRef.current) setLoadingMore(false);
    }
  }, [loadingMore, filtering, hasMore, loadError, stalled, photos, filter, backoffFail, backoffSucceed]);
  const autoLoadMore = useCallback(() => void loadNextPage("auto"), [loadNextPage]);
  const manualLoadMore = useCallback(() => void loadNextPage("manual"), [loadNextPage]);

  // Infinite scroll: start the next page ~one screen before the end. The
  // button below stays as the keyboard / no-IntersectionObserver fallback.
  // Never after a failure (the visitor retries with the button, with backoff)
  // and never after a page that added nothing.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadError || stalled || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) autoLoadMore(); },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadError, stalled, autoLoadMore]);

  const groups = useMemo(() => groupByEvent(photos), [photos]);

  // Build the lightbox photo with nav fields
  const selectedPhoto: LightboxPhoto | null = useMemo(() => {
    if (selectedIdx === null) return null;
    const photo = photos[selectedIdx];
    if (!photo) return null;
    return { ...photo, index: selectedIdx, total: photos.length };
  }, [selectedIdx, photos]);

  const hasPrev = selectedIdx !== null && selectedIdx > 0;
  const hasNext = selectedIdx !== null && selectedIdx < photos.length - 1;

  // Modified clicks (new tab, new window, download) must fall through to the
  // browser; a plain left click opens the lightbox and pushes the photo's
  // canonical URL so the address bar and the visible photo agree.
  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, index: number, id: string) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      setSelectedIdx(index);
      window.history.pushState({ bhGallery: true }, "", `/gallery/${id}`);
      // Same near-end check as goTo: without IntersectionObserver, opening the
      // last loaded card would otherwise leave Next disabled with more to load.
      if (index >= photos.length - 3 && hasMore) autoLoadMore();
    },
    [photos.length, hasMore, autoLoadMore]
  );

  const goTo = useCallback((next: number) => {
    const photo = photos[next];
    if (!photo) return;
    setSelectedIdx(next);
    window.history.replaceState({ bhGallery: true }, "", `/gallery/${photo.id}`);
    // Reaching the end of what's loaded inside the lightbox pulls the next page.
    if (next >= photos.length - 3 && hasMore) autoLoadMore();
  }, [photos, hasMore, autoLoadMore]);

  const handlePrev = useCallback(() => {
    if (selectedIdx !== null && selectedIdx > 0) goTo(selectedIdx - 1);
  }, [selectedIdx, goTo]);

  const handleNext = useCallback(() => {
    if (selectedIdx !== null) goTo(selectedIdx + 1);
  }, [selectedIdx, goTo]);

  const handleClose = useCallback(() => {
    // Back out of the pushed photo entry so the browser's Back button and the
    // close control agree. If the lightbox was restored without our state,
    // rewrite the URL to the gallery instead of navigating away.
    const state: unknown = window.history.state;
    const fromGallery =
      typeof state === "object" &&
      state !== null &&
      (state as { bhGallery?: unknown }).bhGallery === true;
    if (fromGallery) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", galleryHref(filter));
    }
    setSelectedIdx(null);
  }, [filter]);

  const chipClass = (active: boolean) =>
    `shrink-0 inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red ${
      active
        // bh-red-action, not the brand red: white text-sm on #FE0000 is 4.03:1
        // and fails WCAG AA (see --bh-red-action in globals.css).
        ? "border-bh-red-action bg-bh-red-action text-white"
        : "border-border bg-surface text-primary hover:bg-surface-hover"
    }`;

  return (
    <>
      {/* Stats */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-mono text-secondary">
        <span className="inline-flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary-red" aria-hidden="true" />
          {totals.photos} {totals.photos === 1 ? "photo" : "photos"}
        </span>
        <span className="inline-flex items-center gap-2">
          <Video className="w-4 h-4 text-primary-red" aria-hidden="true" />
          {totals.videos} {totals.videos === 1 ? "video" : "videos"}
        </span>
        <span className="inline-flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-red" aria-hidden="true" />
          {totals.events} {totals.events === 1 ? "event" : "events"}
        </span>
      </div>

      {/* Event filter: chips, horizontally scrollable on phones. */}
      {events.length > 0 && (
        <div className="sticky top-16 z-20 -mx-6 mb-8 bg-background/90 px-6 py-3 backdrop-blur md:-mx-20 md:px-20">
          <div
            role="group"
            aria-label="Filter by event"
            className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center md:overflow-visible [scrollbar-width:none]"
          >
            <button type="button" aria-pressed={filter === null} onClick={() => applyFilter(null)} className={chipClass(filter === null)}>
              All events
            </button>
            {events.map((event) => (
              <button
                key={event}
                type="button"
                aria-pressed={filter === event}
                onClick={() => applyFilter(event)}
                className={chipClass(filter === event)}
              >
                {event}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen-reader status for filter / paging results. */}
      <p className="sr-only" role="status" aria-live="polite">
        {filtering || loadingMore
          ? "Loading media"
          : `Showing ${photos.length}${hasMore ? "+" : ""} items${filter ? ` from ${filter}` : ""}`}
      </p>

      {filtering ? (
        <div className={GRID_CLASS} aria-busy="true">
          <GallerySkeletonTiles count={8} />
        </div>
      ) : photos.length === 0 && !loadError ? (
        <div className="rounded-xl border border-border bg-surface p-16 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          {/* An empty page with more to come is not "no media": say so, and
              let the Load more button below fetch the next page. */}
          <p className="text-lg font-bold text-primary">
            {hasMore ? "Nothing loaded yet" : "No media found"}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {hasMore
              ? "More photos and videos are available. Use Load more below to see them."
              : filter
                ? "No photos or videos found for this event. Try selecting a different event."
                : "No photos or videos have been published yet."}
          </p>
          {filter && (
            <button
              type="button"
              onClick={() => applyFilter(null)}
              className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-5 py-2 text-sm font-bold text-white hover:bg-deep-red transition-all"
            >
              <X className="w-4 h-4" />
              Show all events
            </button>
          )}
        </div>
      ) : (
        // Row-major grids, not CSS columns: with columns, appending a page
        // reflowed every existing tile into a different column.
        <div className="space-y-10 md:space-y-14">
          {groups.map((group, groupIdx) => (
            <GallerySection key={group.key} group={group} headingId={`gallery-section-${groupIdx}`}>
              <div className={GRID_CLASS}>
                {group.items.map(({ photo, index }) => (
                  <GalleryCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onOpen={handleOpen}
                    canDownload={canDownload}
                  />
                ))}
                {loadingMore && groupIdx === groups.length - 1 && <GallerySkeletonTiles count={4} />}
              </div>
            </GallerySection>
          ))}
        </div>
      )}

      {/* A failed request reports at the bottom, after whatever is already
          loaded: that is where the visitor is looking when the next page
          fails, and for a failed filter it sits right under the chips. */}
      {loadError && (
        <GalleryLoadError
          message={
            loadError === "page"
              ? "Couldn't load more media. Check your connection."
              : "Couldn't load media. Check your connection."
          }
          onRetry={() => (loadError === "page" ? manualLoadMore() : void applyFilter(filter))}
          busy={loadError === "page" ? loadingMore : filtering}
          secondsLeft={retrySecondsLeft}
        />
      )}

      {/* Pagination: auto-loads near the bottom; the button is the fallback. */}
      {hasMore && !filtering && !loadError && (
        <div ref={sentinelRef} className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={manualLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-bold text-primary hover:bg-surface-hover transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {loadingMore ? "Loading" : "Load more"}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <Lightbox
          photo={selectedPhoto}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          canDownload={canDownload}
        />
      )}
    </>
  );
}
