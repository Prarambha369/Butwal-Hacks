"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { updateEventSlug } from "@/lib/actions/events";
import { SlugField } from "@/components/organizer/slug-field";

/**
 * Editor for the event's public URL segment.
 *
 * Presented as a card rather than an inline field because changing a slug is
 * destructive in a way users do not expect: every existing link to the event
 * stops resolving. The warning is stated before the input, not after a
 * failure, because by then the damage is already done.
 */
export function EventSlugEditor({
  eventId,
  currentSlug,
  title,
}: {
  eventId: string;
  currentSlug: string | null;
  title: string;
}) {
  const [slug, setSlug] = useState(currentSlug ?? "");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const dirty = slug !== (currentSlug ?? "");
  const backToOriginal = () => {
    setSlug(currentSlug ?? "");
    setConfirming(false);
  };

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateEventSlug(eventId, slug);
      if (!result.success) {
        throw new Error(result.error || "Failed to update URL");
      }
      if (result.unchanged) {
        toast.success("URL unchanged.");
      } else {
        toast.success(`URL updated to /events/${result.slug}`);
      }
      setConfirming(false);
      // Keep local state aligned with what the server settled on, including any
      // collision suffix the server appended.
      setSlug(result.slug ?? slug);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update URL");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bh-card p-6 space-y-4">
      <h2 className="text-base font-bold text-primary">Public URL</h2>

      <SlugField
        value={slug}
        onChange={(next) => {
          setSlug(next);
          setConfirming(false);
        }}
        fallbackTitle={title}
        label="Event slug"
      />

      {!dirty ? (
        <button
          disabled
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
        >
          {currentSlug ? "Saved" : "Saved"}
        </button>
      ) : confirming ? (
        <div className="space-y-3 rounded-lg border border-primary-red/40 bg-primary-red/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-primary-red shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              Links already shared for this event will stop working.{" "}
              {currentSlug && (
                <>
                  Anything pointing at{" "}
                  <span className="font-mono">/events/{currentSlug}</span> will 404.
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-primary-red px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Yes, change it"}
            </button>
            <button
              onClick={backToOriginal}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={!slug}
          className="w-full rounded-lg bg-primary-red px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Change URL
        </button>
      )}
    </div>
  );
}