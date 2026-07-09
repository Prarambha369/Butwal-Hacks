"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarDays } from "lucide-react";
import Link from "next/link";
import { createChapterEvent } from "@/lib/actions/events";

interface Props {
  chapterId: string;
  chapterSlug: string;
}

export default function OrgEventCreateForm({ chapterId, chapterSlug }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !startDate) {
      setError("Title and start date are required.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createChapterEvent(
        {
          chapterId,
          title: title.trim(),
          description: description.trim() || "",
          start_date: new Date(startDate).toISOString(),
          end_date: endDate ? new Date(endDate).toISOString() : "",
          location: location.trim() || null,
        },
        chapterSlug,
      );

      if (!result.success) {
        setError(result.error || "Failed to create event.");
        setSubmitting(false);
        return;
      }

      router.push(`/orgs/${chapterSlug}/events`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-primary">
          Event Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Spring HackDay 2026"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-primary">
          Description <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this event about?"
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-primary">
            Start Date
          </label>
          <input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium text-primary">
            End Date <span className="text-muted-foreground/50">(optional)</span>
          </label>
          <input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-primary">
          Location <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Butwal, Rupandehi"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
        />
      </div>

      {error && (
        <p className="text-sm text-primary-red bg-primary-red/5 rounded-lg px-3 py-2 border border-primary-red/20">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-primary-red px-6 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CalendarDays className="w-4 h-4" />
          )}
          {submitting ? "Creating..." : "Create Event"}
        </button>
        <Link
          href={`/orgs/${chapterSlug}/events`}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
