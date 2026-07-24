"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, ChevronLeft, ChevronRight, Users, Play, Pause,
  Volume2, VolumeX, Filter, Camera, Video, ImageIcon,
  ExternalLink,
} from "lucide-react";
import { getDiceBearPlaceholder } from "@/lib/utils";
import type { GalleryPhoto } from "./page";

// ─── Video detection ───────────────────────────────────────────────

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg|avi)$/i.test(url);
}

// ─── ScrollReveal wrapper ──────────────────────────────────────────

function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Video Thumbnail ───────────────────────────────────────────────

function VideoThumbnail({ url, alt: _alt }: { url: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play().catch(() => {});
    setPlaying(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    videoRef.current?.pause();
    setPlaying(false);
  }, []);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={url}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        poster={url + "?poster=true"}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-[#1F1F1F] ml-0.5" />
          </div>
        </div>
      )}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono flex items-center gap-1">
        <Video className="w-3 h-3" />
        Video
      </div>
      {playing && (
        <button
          onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors z-10"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
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
}: {
  photo: LightboxPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = isVideoUrl(photo.url);
  const [videoPlaying, setVideoPlaying] = useState(true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isVideo && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-red/20 text-primary-red text-[10px] font-mono font-bold uppercase tracking-wider">
                <Video className="w-3.5 h-3.5" />
                Video
              </span>
            )}
            <button
              onClick={() => setVideoPlaying(!videoPlaying)}
              className="p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              aria-label={videoPlaying ? "Pause" : "Play"}
            >
              {videoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
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
            className="shrink-0 p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative flex-1 h-[60vh] md:h-[75vh] rounded-2xl overflow-hidden shadow-2xl bg-black/40">
            {isVideo ? (
              <video
                ref={videoRef}
                src={photo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                <source src={photo.url} />
              </video>
            ) : (
              <Image
                src={photo.url}
                alt={photo.event}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 90vw, 80vw"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDiceBearPlaceholder(photo.id);
                }}
              />
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-white/20 text-xs font-medium transition-all shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Event
                  </Link>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="shrink-0 p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed z-10"
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
  onClick,
}: {
  photo: GalleryPhoto;
  index: number;
  onClick: () => void;
}) {
  const isVideo = isVideoUrl(photo.url);

  return (
    <ScrollReveal delay={Math.min(index * 60, 300)}>
      <button
        onClick={onClick}
        className="group relative overflow-hidden rounded-2xl border border-border bg-surface block w-full text-left cursor-pointer"
      >
        <div className="p-1">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[14px]">
            {isVideo ? (
              <VideoThumbnail url={photo.url} alt={photo.event} />
            ) : (
              <Image
                src={photo.url}
                alt={photo.event}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-all duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDiceBearPlaceholder(photo.id);
                }}
              />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 pointer-events-none">
          <h3 className="text-sm font-bold text-white truncate drop-shadow-sm">
            {photo.event}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] font-mono text-white/70 drop-shadow-sm">
              {new Date(photo.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            {isVideo && (
              <span className="flex items-center gap-1 text-[10px] text-primary-red font-semibold">
                <Video className="w-3 h-3" />
                {photo.duration ? `${Math.round(photo.duration)}s` : "Clip"}
              </span>
            )}
          </div>
        </div>

        {/* Media type badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm ${
            isVideo
              ? "bg-primary-red/30 text-primary-red border border-primary-red/40"
              : "bg-white/20 text-white border border-white/20"
          }`}>
            {isVideo ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
            {isVideo ? "Video" : "Photo"}
          </span>
        </div>
      </button>
    </ScrollReveal>
  );
}

// ─── Main GalleryGrid ──────────────────────────────────────────────

export default function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  // Extract unique events for filter dropdown
  const events = useMemo(() => {
    const eventSet = new Set(photos.map((p) => p.event));
    return Array.from(eventSet).sort();
  }, [photos]);

  // Filter photos by selected event
  const filtered = useMemo(
    () => (filter ? photos.filter((p) => p.event === filter) : photos),
    [photos, filter]
  );

  // Build the lightbox photo with nav fields
  const selectedPhoto: LightboxPhoto | null = useMemo(() => {
    if (selectedIdx === null) return null;
    const photo = filtered[selectedIdx];
    if (!photo) return null;
    return { ...photo, index: selectedIdx, total: filtered.length };
  }, [selectedIdx, filtered]);

  const hasPrev = selectedIdx !== null && selectedIdx > 0;
  const hasNext = selectedIdx !== null && selectedIdx < filtered.length - 1;

  const handlePrev = useCallback(() => {
    setSelectedIdx((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
  }, []);

  const handleClose = useCallback(() => setSelectedIdx(null), []);

  const handleNext = useCallback(() => {
    setSelectedIdx((prev) =>
      prev !== null ? Math.min(prev + 1, filtered.length - 1) : null
    );
  }, [filtered.length]);

  return (
    <>
      {/* Stats + Filter bar */}
      <ScrollReveal>
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="inline-flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-2.5">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary-red" />
              <span className="text-sm font-mono text-secondary">
                {photos.filter((p) => !isVideoUrl(p.url)).length} photos
              </span>
            </div>
            <span className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary-red" />
              <span className="text-sm font-mono text-secondary">
                {photos.filter((p) => isVideoUrl(p.url)).length} videos
              </span>
            </div>
            <span className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-red" />
              <span className="text-sm font-mono text-secondary">
                {events.length} events
              </span>
            </div>
          </div>

          {/* Event filter dropdown */}
          <div className="relative">
            <select
              value={filter ?? ""}
              onChange={(e) => setFilter(e.target.value || null)}
              className="appearance-none rounded-xl border border-border bg-surface px-4 py-2.5 pr-10 text-sm font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-red/30"
              aria-label="Filter by event"
            >
              <option value="">All Events</option>
              {events.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </ScrollReveal>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <ScrollReveal>
          <div className="rounded-xl border border-border bg-surface p-16 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-bold text-primary">No media found</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No photos or videos found for this event. Try selecting a different event.
            </p>
            <button
              onClick={() => setFilter(null)}
              className="inline-flex items-center gap-2 rounded-full bg-primary-red px-5 py-2 text-sm font-bold text-white hover:bg-deep-red transition-all"
            >
              <X className="w-4 h-4" />
              Clear filter
            </button>
          </div>
        </ScrollReveal>
      ) : (
        /* Masonry grid via CSS columns */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((photo, idx) => (
            <GalleryCard
              key={photo.id}
              photo={photo}
              index={idx}
              onClick={() => setSelectedIdx(idx)}
            />
          ))}
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
        />
      )}
    </>
  );
}
