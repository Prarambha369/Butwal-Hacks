"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, FileText, Image as ImageIcon, ArrowLeft, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createChapterEvent } from "@/lib/actions/events";
import { RoseSpinner } from "@/components/ui/rose-loader";
import { Button } from "@/components/ui/button";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { useAnalytics } from "@/hooks/use-analytics";

interface OrgEventCreationFormProps {
  chapterId: string;
  chapterSlug: string;
  chapterName: string;
}

export default function OrgEventCreationForm({
  chapterId,
  chapterSlug,
  chapterName,
}: OrgEventCreationFormProps) {
  const router = useRouter();
  const { capture } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    banner_url: "",
    is_published: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createChapterEvent(
      {
        chapterId,
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location || null,
        banner_url: formData.banner_url || null,
        is_published: formData.is_published,
      },
      chapterSlug
    );

    if (!result.success) {
      toast.error(result.error ?? "Failed to create event");
    } else {
      capture('event_created', {
        chapter_id: chapterId,
        is_published: formData.is_published,
        has_location: !!formData.location,
        has_banner: !!formData.banner_url,
      });
      toast.success("Event created successfully!");
      router.push(`/orgs/${chapterSlug}/events`);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <a
        href={`/orgs/${chapterSlug}/events`}
        className="flex items-center gap-2 text-xs text-primary/50 hover:text-primary/80 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to {chapterName} Events
      </a>

      <div className="lg-surface p-8 rounded-3xl border border-glass space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Create New Event</h2>
            <p className="text-xs text-primary/50 flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3" />
              Chapter: {chapterName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Event Title
            </label>
            <input
              required
              className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all text-primary"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Butwal Winter Hack 2026"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-secondary uppercase tracking-wider">
              Description
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all resize-none text-primary"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What is this event about? Who is it for?"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Start Date
            </label>
            <input
              required
              type="datetime-local"
              className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all text-primary"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" /> End Date
            </label>
            <input
              required
              type="datetime-local"
              className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all text-primary"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all text-primary"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Physical address or 'Virtual'"
            />
          </div>

          {/* Banner Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Event Banner
            </label>
            <CloudinaryUpload
              onUpload={(url) => setFormData({ ...formData, banner_url: url })}
              label="Upload Banner Image"
              currentImage={formData.banner_url}
            />
          </div>

          {/* Publish toggle */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface/10 border border-glass">
            <input
              type="checkbox"
              id="is_published"
              className="w-5 h-5 accent-bh-red-500"
              checked={formData.is_published}
              onChange={(e) =>
                setFormData({ ...formData, is_published: e.target.checked })
              }
            />
            <label
              htmlFor="is_published"
              className="text-sm font-bold text-primary cursor-pointer"
            >
              Publish event immediately
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end md:col-span-2">
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              className="px-10 py-4"
            >
              {loading && <RoseSpinner size="sm" />}
              {loading ? "Creating Event..." : "Create Chapter Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
