"use client";

import { useState } from "react";
import { Check, X, Trash2, Star } from "lucide-react";
import {
  setPhotoStatus,
  setPhotoCover,
  deletePhoto,
  type GalleryPhotoRow,
} from "@/lib/actions/photos";

function StatusPill({ status }: { status: string }) {
  const color = status === "approved"
    ? "text-status-green bg-status-green/8"
    : status === "rejected"
      ? "text-primary-red bg-primary-red/8"
      : "text-status-yellow bg-status-yellow/8";
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md ${color}`}>
      {status}
    </span>
  );
}

/**
 * Shared moderation grid for event photos.
 * Organizer view: per-event, approve/reject/delete (no cover toggle).
 * Maintainer view: cross-event queue + "Set as cover" (home top image).
 */
export function PhotoModerationGrid({
  photos,
  showEvent = false,
  allowCover = false,
  onChanged,
}: {
  photos: GalleryPhotoRow[];
  showEvent?: boolean;
  allowCover?: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing here. Member uploads land as pending for review.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-primary-red" role="alert">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <div key={p.id} className="bh-card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.event_title ?? "Event photo"} className="aspect-video w-full object-cover" loading="lazy" />
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <StatusPill status={p.status} />
                {p.is_cover && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md text-status-yellow bg-status-yellow/8">
                    <Star className="h-3 w-3" /> home cover
                  </span>
                )}
              </div>
              {showEvent && p.event_title && (
                <p className="truncate text-xs text-muted-foreground">{p.event_title}</p>
              )}
              {p.uploader_name && (
                <p className="truncate text-xs text-muted-foreground">by {p.uploader_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {p.status !== "approved" && (
                  <button
                    type="button" disabled={busy === p.id}
                    onClick={() => act(p.id, () => setPhotoStatus(p.id, "approved"))}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                )}
                {p.status !== "rejected" && (
                  <button
                    type="button" disabled={busy === p.id}
                    onClick={() => act(p.id, () => setPhotoStatus(p.id, "rejected"))}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                )}
                {allowCover && p.status === "approved" && !p.is_cover && (
                  <button
                    type="button" disabled={busy === p.id}
                    onClick={() => act(p.id, () => setPhotoCover(p.id))}
                    className="inline-flex items-center gap-1 rounded-lg border border-status-yellow/30 bg-surface px-3 py-1.5 text-xs font-bold text-status-yellow hover:bg-surface-hover disabled:opacity-50"
                  >
                    <Star className="h-3.5 w-3.5" /> Set as cover
                  </button>
                )}
                <button
                  type="button" disabled={busy === p.id}
                  onClick={() => {
                    if (confirm("Delete this photo permanently?")) {
                      act(p.id, () => deletePhoto(p.id));
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-primary-red hover:bg-surface-hover disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
