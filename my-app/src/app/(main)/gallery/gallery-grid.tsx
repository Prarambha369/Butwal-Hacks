"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, ChevronLeft, ChevronRight, Users, Play, Pause,
  Camera, Video, ImageIcon, Loader2,
  ExternalLink, Download, LogIn,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDiceBearPlaceholder } from "@/lib/utils";
import {
  cloudinaryDownloadUrl,
  cloudinaryImageLoader,
  isVideoUrl,
  videoPosterUrl,
  videoSources,
} from "@/lib/cloudinary-url";
// Server actions live in `lib`; the page's types are re-exported there, so
// import both from one place rather than through `./page`.
import { fetchGalleryPage } from "@/lib/actions/gallery";
import type { GalleryPhoto, GalleryTotals } from "@/lib/actions/gallery";

// ─── Loading skeleton ──────────────────────────────────────────────
// Same box as a real card (4:3 inside a 1px-padded rounded frame), so tiles
// swap in without the grid jumping.

export function GallerySkeletonTiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-1" aria-hidden="true">
          <Skeleton className="w-full aspect-[4/3] rounded-[14px]" />
        </div>
      ))}
    </>
  );
}

// ─── Video Thumbnail ───────────────────────────────────────────────

function VideoThumbnail({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // Only flip to "playing" once play() actually resolves, so the play badge
  // never disappears over a video that failed to start.
  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    videoRef.current?.pause();
    setPlaying(false);
  }, []);

  return (
    <div
      className="relative w-full h-full bg-surface-inverse"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        // The poster already paints the tile; don't fetch every clip's
        // metadata on page load. Bytes start on hover.
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        poster={videoPosterUrl(url, 640) ?? undefined}
      >
        {videoSources(url, 640).map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          playing ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <Play className="w-5 h-5 text-surface-inverse ml-0.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Photo thumbnail with fade-in ──────────────────────────────────
// Pulses until the bytes arrive, then fades in. Replaces the old scroll-reveal
// wrapper, which kept every tile invisible until it was scrolled into view.

function PhotoThumbnail({ photo }: { photo: GalleryPhoto }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <Image
        // Stored URL + loader: each srcset width is a Cloudinary transform
        // served from its CDN, not a round trip through /_next/image.
        src={photo.url}
        loader={cloudinaryImageLoader(photo.optimize, 800)}
        alt={photo.event}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        className={`object-cover transition-[opacity,transform] duration-500 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          (e.target as HTMLImageElement).src = getDiceBearPlaceholder(photo.id);
        }}
      />
    </>
  );
}

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
      <Link
        href="/sign-in"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-primary hover:bg-surface-hover text-xs font-medium transition-all shrink-0"
      >
        <LogIn className="w-3.5 h-3.5" />
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
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 border border-white/20 text-white/80 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <Download className="w-4 h-4" />
      </a>
    );
  }
  return (
    <a
      href={cloudinaryDownloadUrl(url)}
      download
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-primary hover:bg-surface-hover text-xs font-medium transition-all shrink-0"
    >
      <Download className="w-3.5 h-3.5" />
      Download
    </a>
  );
}

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
  const mediaLoading = loadedId !== photo.id;
  const markLoaded = () => setLoadedId(photo.id);

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
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => {});
    });
  }, [isVideo, photo.id]);

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

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.event} — ${isVideo ? "video" : "photo"} preview`}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 outline-none"
    >
      <div className="absolute inset-0 bg-surface-inverse" onClick={onClose} />

      <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isVideo && (
              <>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-red/20 text-primary-red text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Video className="w-3.5 h-3.5" />
                  Video
                </span>
                <button
                  onClick={toggleVideo}
                  className="p-1.5 rounded-full bg-surface text-primary hover:bg-surface-hover transition-colors"
                  aria-label={videoPlaying ? "Pause" : "Play"}
                >
                  {videoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X size={28} />
          </button>
        </div>

        {/* Media container */}
        <div className="relative w-full flex-1 min-h-0 flex items-center gap-2 md:gap-4">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="shrink-0 p-2 rounded-full bg-surface text-primary hover:bg-surface-hover transition-all disabled:opacity-20 disabled:cursor-not-allowed z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative flex-1 h-[60vh] md:h-[75vh] rounded-2xl overflow-hidden bg-surface-inverse">
            {isVideo ? (
              <video
                // Fresh element per item: no stale playback state or
                // half-buffered src carried across prev/next.
                key={photo.id}
                ref={videoRef}
                poster={videoPosterUrl(photo.url, 1600) ?? undefined}
                controls
                playsInline
                preload="auto"
                onLoadedData={markLoaded}
                onPlay={() => setVideoPlaying(true)}
                onPause={() => setVideoPlaying(false)}
                onEnded={() => setVideoPlaying(false)}
                className="w-full h-full object-contain"
              >
                {/* With <source> children a failed load fires `error` on the
                    source, not the <video>, so the last one clears the spinner. */}
                {videoSources(photo.url, 1600).map((s, i, all) => (
                  <source
                    key={s.src}
                    src={s.src}
                    type={s.type}
                    onError={i === all.length - 1 ? markLoaded : undefined}
                  />
                ))}
              </video>
            ) : (
              <Image
                key={photo.id}
                src={photo.url}
                loader={cloudinaryImageLoader(photo.optimize, 1600)}
                alt={photo.event}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 90vw, 80vw"
                onLoad={markLoaded}
                onError={(e) => {
                  markLoaded();
                  (e.target as HTMLImageElement).src = getDiceBearPlaceholder(photo.id);
                }}
              />
            )}

            {mediaLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <Loader2 className="w-8 h-8 animate-spin text-white/70" />
              </div>
            )}

            {/* Bottom caption overlay */}
            <div className="absolute bottom-0 inset-x-0 p-5 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg md:text-xl font-bold text-white truncate">
                    {photo.event}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    <span className="text-white/60 text-xs font-mono">
                      {new Date(photo.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {photo.uploader && (
                      <span className="text-white/50 text-xs">
                        by {photo.uploader}
                      </span>
                    )}
                    {isVideo && photo.duration && (
                      <span className="text-primary-red text-xs font-semibold">
                        {Math.round(photo.duration)}s
                      </span>
                    )}
                  </div>
                </div>
                {photo.event_slug && (
                  <Link
                    href={`/events/${photo.event_slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-primary hover:bg-surface-hover text-xs font-medium transition-all shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Event
                  </Link>
                )}
                <DownloadControl url={photo.url} isVideo={isVideo} canDownload={canDownload} variant="lightbox" />
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="shrink-0 p-2 rounded-full bg-surface text-primary hover:bg-surface-hover transition-all disabled:opacity-20 disabled:cursor-not-allowed z-10"
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Counter */}
        <p className="text-center text-xs font-mono text-white/40 mt-3">
          {photo.index + 1} / {photo.total}
        </p>
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
  const date = new Date(photo.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    // Wrapper keeps valid HTML: the download control is a sibling of the card
    // link, not nested inside it.
    <div className="group relative">
      <Link
        href={`/gallery/${photo.id}`}
        onClick={(event) => onOpen(event, index, photo.id)}
        aria-label={`${photo.event}, ${isVideo ? "video" : "photo"}, ${date}`}
        className="block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="p-1">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[14px]">
            {isVideo ? <VideoThumbnail url={photo.url} /> : <PhotoThumbnail photo={photo} />}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 md:p-4">
          <h3 className="text-sm font-bold text-white truncate drop-shadow-sm">{photo.event}</h3>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-white/75 drop-shadow-sm">{date}</span>
            {isVideo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                <Video className="w-3 h-3" />
                {photo.duration ? `${Math.round(photo.duration)}s` : "Video"}
              </span>
            )}
          </div>
        </div>
      </Link>
      <DownloadControl url={photo.url} isVideo={isVideo} canDownload={canDownload} variant="card" />
    </div>
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
    setFilter(nextFilter);
    setSelectedIdx(null);
    setLoadError(false);
    // Shareable, reload-safe filter without a server round trip for the shell.
    window.history.replaceState(window.history.state, "", galleryHref(nextFilter));
    const cached = pageCacheRef.current.get(nextFilter ?? "");
    if (cached) {
      setPhotos(cached.photos);
      setHasMore(cached.hasMore);
      setFiltering(false);
      return;
    }
    setFiltering(true);
    try {
      const page = await fetchGalleryPage(0, nextFilter ?? undefined);
      if (ticket !== requestRef.current) return;
      setPhotos(page.photos);
      setHasMore(page.hasMore);
    } catch {
      if (ticket === requestRef.current) {
        // Don't leave the previous filter's photos labelled as this one's.
        setPhotos([]);
        setHasMore(false);
        setLoadError("filter");
      }
    } finally {
      if (ticket === requestRef.current) setFiltering(false);
    }
  }, [filter, loadError, filtering, photos, hasMore]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || filtering || !hasMore) return;
    const ticket = requestRef.current;
    const pageTicket = ++pageRequestRef.current;
    setLoadingMore(true);
    setLoadError(false);
    try {
      const next = await fetchGalleryPage(photos.length, filter ?? undefined);
      if (ticket !== requestRef.current) return;
      // Dedupe by id in case a new upload shifted the page boundary.
      setPhotos((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...next.photos.filter((p) => !seen.has(p.id))];
      });
      setHasMore(next.hasMore);
    } catch {
      if (ticket === requestRef.current) setLoadError("page");
    } finally {
      if (pageTicket === pageRequestRef.current) setLoadingMore(false);
    }
  }, [loadingMore, filtering, hasMore, photos.length, filter]);

  // Infinite scroll: start the next page ~one screen before the end. The
  // button below stays as the keyboard / no-IntersectionObserver fallback.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadError || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) void handleLoadMore(); },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadError, handleLoadMore]);

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
      if (index >= photos.length - 3 && hasMore) void handleLoadMore();
    },
    [photos.length, hasMore, handleLoadMore]
  );

  const goTo = useCallback((next: number) => {
    const photo = photos[next];
    if (!photo) return;
    setSelectedIdx(next);
    window.history.replaceState({ bhGallery: true }, "", `/gallery/${photo.id}`);
    // Reaching the end of what's loaded inside the lightbox pulls the next page.
    if (next >= photos.length - 3 && hasMore) void handleLoadMore();
  }, [photos, hasMore, handleLoadMore]);

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
        ? "border-primary-red bg-primary-red text-white"
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

      {loadError && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-primary">
          Couldn&apos;t load media. Check your connection.
          <button
            type="button"
            onClick={() => (loadError === "page" ? handleLoadMore() : applyFilter(filter))}
            className="rounded-full border border-border px-4 py-1.5 font-semibold hover:bg-surface-hover"
          >
            Try again
          </button>
        </div>
      )}

      {filtering ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true">
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
        // Row-major grid, not CSS columns: with columns, appending a page
        // reflowed every existing tile into a different column.
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {photos.map((photo, idx) => (
            <GalleryCard
              key={photo.id}
              photo={photo}
              index={idx}
              onOpen={handleOpen}
              canDownload={canDownload}
            />
          ))}
          {loadingMore && <GallerySkeletonTiles count={4} />}
        </div>
      )}

      {/* Pagination: auto-loads near the bottom; the button is the fallback. */}
      {hasMore && !filtering && !loadError && (
        <div ref={sentinelRef} className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
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
