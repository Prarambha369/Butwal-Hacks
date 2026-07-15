"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryPhoto } from "./page";

export default function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIdx === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
      if (e.key === "ArrowRight") setSelectedIdx((prev) => prev !== null ? Math.min(prev + 1, photos.length - 1) : null);
      if (e.key === "ArrowLeft") setSelectedIdx((prev) => prev !== null ? Math.max(prev - 1, 0) : null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIdx, photos.length]);

  const selectedPhoto = selectedIdx !== null ? photos[selectedIdx] : null;

  return (
    <>
      {/* Stats bar */}
      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center gap-6 rounded-xl border border-border bg-surface px-6 py-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-red" />
            <span className="text-sm font-mono text-secondary">
              {new Set(photos.map((p) => p.event)).size} events
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-red" />
            <span className="text-sm font-mono text-secondary">
              {photos.length} captures
            </span>
          </div>
        </div>
      </div>

      {/* Masonry grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIdx(idx)}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface block w-full text-left break-inside-avoid cursor-pointer"
          >
            <div className="p-1">
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[16px]">
                <Image
                  src={photo.url}
                  alt={photo.event}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${photo.id}`;
                  }}
                />
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent p-4 md:p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none">
              <h3 className="text-sm font-bold text-primary truncate">
                {photo.event}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-mono text-secondary/80">
                  {new Date(photo.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {photo.uploader && (
                  <span className="text-[10px] text-secondary/60 truncate ml-2">
                    by {photo.uploader}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-background/95"
            onClick={() => setSelectedIdx(null)}
          />

          <div className="relative max-w-5xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <div className="flex items-center justify-end mb-3">
              <button
                onClick={() => setSelectedIdx(null)}
                className="p-2 text-secondary hover:text-primary-red transition-colors"
                aria-label="Close lightbox"
              >
                <X size={28} />
              </button>
            </div>

            {/* Image container with nav arrows */}
            <div className="relative w-full flex-1 min-h-0 flex items-center gap-3">
              {/* Previous */}
              <button
                onClick={() => setSelectedIdx((prev) => prev !== null ? Math.max(prev - 1, 0) : null)}
                disabled={selectedIdx === 0}
                className="shrink-0 p-2 rounded-full bg-surface border border-border text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Image */}
              <div className="relative flex-1 h-full rounded-xl overflow-hidden shadow-lg border border-border bg-surface">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.event}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 90vw, 80vw"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${selectedPhoto.id}`;
                  }}
                />

                {/* Caption */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-lg font-bold text-white">{selectedPhoto.event}</h4>
                      <p className="text-white/70 font-mono text-sm">
                        {new Date(selectedPhoto.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {selectedPhoto.uploader && ` · by ${selectedPhoto.uploader}`}
                      </p>
                    </div>
                    {selectedPhoto.event_slug && (
                      <Link
                        href={`/events/${selectedPhoto.event_slug}`}
                        onClick={() => setSelectedIdx(null)}
                        className="px-3 py-1.5 rounded-lg bg-surface/90 border border-border text-[10px] font-medium text-primary hover:text-primary-red transition-colors shrink-0"
                      >
                        View Event
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Next */}
              <button
                onClick={() => setSelectedIdx((prev) => prev !== null ? Math.min(prev + 1, photos.length - 1) : null)}
                disabled={selectedIdx === photos.length - 1}
                className="shrink-0 p-2 rounded-full bg-surface border border-border text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-10"
                aria-label="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Counter */}
            <p className="text-center text-xs font-mono text-secondary/60 mt-3">
              {selectedIdx! + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
