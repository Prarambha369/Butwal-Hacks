"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { events } from "@/lib/content";

// Static gallery photos mapped to events — replace with DB photos when available
const galleryPhotos = events.flatMap((event) => {
  const images: { url: string; event: string; slug: string; alt: string }[] = [];
  if (event.slug === "daydream-butwal-september-2024") {
    images.push(
      { url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800", event: event.title, slug: event.slug, alt: "Game development workshop" },
      { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800", event: event.title, slug: event.slug, alt: "Students coding together" },
      { url: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800", event: event.title, slug: event.slug, alt: "Team collaboration" },
    );
  }
  if (event.slug === "hackday-butwal-2024") {
    images.push(
      { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800", event: event.title, slug: event.slug, alt: "Hackathon workspace" },
      { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800", event: event.title, slug: event.slug, alt: "Team presenting project" },
      { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800", event: event.title, slug: event.slug, alt: "Event venue" },
    );
  }
  return images;
});

export default function EventGallery() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIdx === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
      if (e.key === "ArrowRight") setSelectedIdx((prev) => prev !== null ? Math.min(prev + 1, galleryPhotos.length - 1) : null);
      if (e.key === "ArrowLeft") setSelectedIdx((prev) => prev !== null ? Math.max(prev - 1, 0) : null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIdx, galleryPhotos.length]);

  const selectedPhoto = selectedIdx !== null ? galleryPhotos[selectedIdx] : null;

  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section header */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
              Event Gallery
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Moments captured at hackathons, game jams, and community meetups across Lumbini Province.
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-red hover:text-primary-red/80 transition-colors shrink-0"
          >
            View full gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {galleryPhotos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`group relative overflow-hidden rounded-xl border border-border bg-surface cursor-pointer ${
                idx === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <div className="absolute inset-1 overflow-hidden rounded-[10px]">
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <p className="text-white text-sm font-bold truncate">{photo.event}</p>
                </div>
              </div>

              {/* Aspect ratio spacer */}
              <div className={`${idx === 0 ? "pb-[100%]" : "pb-[75%]"}`} />
            </button>
          ))}
        </div>

        {/* Empty state */}
        {galleryPhotos.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-16 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-bold text-primary">No photos yet</p>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Photos from events will appear here once they are uploaded. Check the full gallery for updates.
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full bg-primary-red px-6 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all mt-4"
            >
              <Camera className="h-4 w-4" />
              Browse gallery
            </Link>
          </div>
        )}

        {/* Lightbox modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-background/95" onClick={() => setSelectedIdx(null)} />

            <div className="relative max-w-5xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
              {/* Close + nav bar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono text-secondary/60">
                  {selectedIdx! + 1} / {galleryPhotos.length}
                </p>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="p-2 text-secondary hover:text-primary-red transition-colors"
                  aria-label="Close lightbox"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Image */}
              <div className="relative w-full flex-1 min-h-0 flex items-center gap-3">
                <button
                  onClick={() => setSelectedIdx((prev) => prev !== null ? Math.max(prev - 1, 0) : null)}
                  disabled={selectedIdx === 0}
                  className="shrink-0 p-3 min-w-[44px] min-h-[44px] rounded-full bg-surface border border-border text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-10"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="relative flex-1 h-[60vh] rounded-xl overflow-hidden shadow-lg border border-border bg-surface">
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 90vw, 80vw"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-lg font-bold text-white">{selectedPhoto.event}</h4>
                      </div>
                      <Link
                        href={`/events/${selectedPhoto.slug}`}
                        onClick={() => setSelectedIdx(null)}
                        className="px-3 py-1.5 rounded-lg bg-surface/90 border border-border text-[10px] font-medium text-primary hover:text-primary-red transition-colors shrink-0"
                      >
                        View Event
                      </Link>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedIdx((prev) => prev !== null ? Math.min(prev + 1, galleryPhotos.length - 1) : null)}
                  disabled={selectedIdx === galleryPhotos.length - 1}
                  className="shrink-0 p-3 min-w-[44px] min-h-[44px] rounded-full bg-surface border border-border text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-10"
                  aria-label="Next photo"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-8 py-3 text-sm font-bold text-primary hover:bg-surface-hover transition-all"
          >
            <Camera className="h-4 w-4" />
            Browse all event photos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
