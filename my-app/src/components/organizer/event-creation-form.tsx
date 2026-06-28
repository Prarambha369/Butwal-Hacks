"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createEvent } from '@/lib/actions/events';
import { useUser } from '@auth0/nextjs-auth0/client';

import { RoseSpinner } from '@/components/ui/rose-loader';
import { Button } from '@/components/ui/button';
import { CloudinaryUpload } from '@/components/cloudinary-upload';

export default function EventCreationForm() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    banner_url: '',
    is_published: false,
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createEvent(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create event');
      }

      toast.success('Event created successfully!');
      router.push('/dashboard/organizer/events');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create event';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bh-card p-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-accent-teal/10 text-accent-teal">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Create New Event</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Event Title
          </label>
          <input 
            required
            className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Butwal Winter Hack 2026"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider">Description</label>
          <textarea 
            required
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all resize-none"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="What is this event about? Who is it for?"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Start Date
          </label>
          <input 
            required
            type="datetime-local"
            className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all"
            value={formData.start_date}
            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> End Date
          </label>
          <input 
            required
            type="datetime-local"
            className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all"
            value={formData.end_date}
            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Location
          </label>
          <input 
            className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            placeholder="Physical address or 'Virtual'"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Event Banner
          </label>
          <CloudinaryUpload
            onUpload={(url) => setFormData({ ...formData, banner_url: url })}
            label="Upload Banner Image"
            currentImage={formData.banner_url}
            entityType="event_banner"
            uploaderAuth0Id={user?.sub}
          />
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-hover border border-border">
          <input 
            type="checkbox"
            id="is_published"
            className="w-5 h-5 accent-bh-red-500"
            checked={formData.is_published}
            onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
          />
          <label htmlFor="is_published" className="text-sm font-bold text-primary cursor-pointer">
            Publish event immediately
          </label>
        </div>

        <div className="flex items-center justify-end">
          <Button 
            type="submit"
            disabled={loading}
            variant="default"
            className="px-10 py-4"
          >
            {loading && <RoseSpinner size="sm" />}
            {loading ? 'Creating Event...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
