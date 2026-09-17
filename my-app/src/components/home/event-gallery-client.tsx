"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export interface CoverPhoto {
  url: string;
  event: string;
  slug: string | null;
}

export default function EventGalleryClient({ photos }: { photos: CoverPhoto[] }) {
  const { locale } = useLanguage();
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
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section header */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
              {t('home.gallery.title', locale)}
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {t('home.gallery.subtitle', locale)}
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-red hover:text-primary-red/80 transition-colors shrink-0"
          >
            {t('home.gallery.view_full', locale)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {photos.map((photo, idx) => (
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
                  alt={photo.event}
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

        {/* Lightbox modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-background/95" onClick={() => setSelectedIdx(null)} />

            <div className="relative max-w-5xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
              {/* Close + nav bar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono text-secondary/60">
                  {selectedIdx! + 1} / {photos.length}
                </p>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-secondary hover:text-primary-red transition-colors"
                  aria-label={t('home.gallery.close', locale)}
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
                  aria-label={t('home.gallery.prev', locale)}
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="relative flex-1 h-[60vh] rounded-xl overflow-hidden shadow-lg border border-border bg-surface">
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.event}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 90vw, 80vw"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-lg font-bold text-white">{selectedPhoto.event}</h4>
                      </div>
                      {selectedPhoto.slug && (
                        <Link
                          href={`/events/${selectedPhoto.slug}`}
                          onClick={() => setSelectedIdx(null)}
                          className="px-3 py-1.5 rounded-lg bg-surface/90 border border-border text-[10px] font-medium text-primary hover:text-primary-red transition-colors shrink-0"
                        >
                          {t('home.gallery.view_event', locale)}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedIdx((prev) => prev !== null ? Math.min(prev + 1, photos.length - 1) : null)}
                  disabled={selectedIdx === photos.length - 1}
                  className="shrink-0 p-3 min-w-[44px] min-h-[44px] rounded-full bg-surface border border-border text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-10"
                  aria-label={t('home.gallery.next', locale)}
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
            {t('home.gallery.browse_all', locale)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
