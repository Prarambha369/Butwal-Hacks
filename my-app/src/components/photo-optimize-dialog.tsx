"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import {
  getOptimizationPreview,
  applyOptimization,
  type OptimizationPreview,
} from "@/lib/actions/photo-optimize";
import type { OptimizeRecipe } from "@/lib/cloudinary-url";
import type { GalleryPhotoRow } from "@/lib/actions/photos";

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Maintainer-only experiment panel: original stats vs three delivery
 * recipes with live previews, sizes, and % reduction. Applying pins the
 * recipe to the photo (delivery-time only — the stored asset is untouched).
 * Preview generation costs ~1 transformation per variant, CDN-cached after.
 */
export function PhotoOptimizeDialog({
  photo,
  onClose,
  onApplied,
}: {
  photo: GalleryPhotoRow;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [preview, setPreview] = useState<OptimizationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<OptimizeRecipe | "none" | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    setError(null);
    getOptimizationPreview(photo.id).then(
      (p) => { if (!cancelled) setPreview(p); },
      (err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load preview"); },
    );
    return () => { cancelled = true; };
  }, [photo.id]);

  async function apply(recipe: OptimizeRecipe | "none") {
    setApplying(recipe);
    setError(null);
    try {
      await applyOptimization(photo.id, recipe);
      onApplied();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Optimize photo">
      <div className="absolute inset-0 bg-background/90" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-primary">Optimize delivery</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {photo.event_title ?? "Event photo"}
              {preview && (
                <> · original {formatBytes(preview.original.bytes)} {preview.original.format.toUpperCase()} {preview.original.width}×{preview.original.height}</>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-secondary hover:text-primary-red transition-colors">
            <X size={24} />
          </button>
        </div>

        {error && <p className="text-sm text-primary-red" role="alert">{error}</p>}
        {!preview && !error && (
          <p className="text-sm text-muted-foreground">Generating previews — each variant costs one transformation, cached after…</p>
        )}

        {preview && (
          <div className="grid gap-4 md:grid-cols-3">
            {preview.variants.map((v) => (
              <div key={v.recipe} className="rounded-xl border border-border bg-background overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.url} alt={v.label} className="aspect-video w-full object-cover" loading="lazy" />
                <div className="space-y-2 p-4">
                  <p className="text-sm font-bold text-primary">{v.label}</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">{v.transform}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(v.bytes)}
                    {v.reductionPct !== null && v.reductionPct > 0 && (
                      <span className="ml-2 inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md text-status-green bg-status-green/8">
                        −{v.reductionPct}%
                      </span>
                    )}
                  </p>
                  <button
                    type="button" disabled={applying !== null}
                    onClick={() => apply(v.recipe)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-red px-4 py-2 text-xs font-bold text-white hover:bg-deep-red disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {applying === v.recipe ? "Applying…" : "Apply to photo"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-[11px] text-muted-foreground max-w-md">
            Applying changes delivery only — the stored original is untouched and the choice is
            reversible at any time. Previews are generated once, then served from cache.
          </p>
          <button
            type="button" disabled={applying !== null}
            onClick={() => apply("none")}
            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
          >
            {applying === "none" ? "Reverting…" : "Revert to default"}
          </button>
        </div>
      </div>
    </div>
  );
}
