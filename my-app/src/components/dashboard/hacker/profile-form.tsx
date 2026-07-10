"use client";

import React, { useState } from 'react';
import { Save, Globe, Github } from 'lucide-react';
import { updateProfile } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { Button } from '@/components/ui/button';

export default function ProfileSettingsForm({ initialProfile }: { initialProfile: Record<string, unknown> }) {
  const [formData, setFormData] = useState({
    full_name: (initialProfile?.full_name as string) || '',
    bio: (initialProfile?.bio as string) || '',
    github: ((initialProfile?.socials as Record<string, string>)?.github as string) || '',
    linkedin: ((initialProfile?.socials as Record<string, string>)?.linkedin as string) || '',
    website: ((initialProfile?.socials as Record<string, string>)?.website as string) || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile(initialProfile?.id as string, {
        full_name: formData.full_name,
        bio: formData.bio,
        socials: {
          github: formData.github,
          linkedin: formData.linkedin,
          website: formData.website,
        }
      });
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40">Full Name</label>
          <input 
            type="text" 
            value={formData.full_name} 
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40">BH-ID (Read Only)</label>
          <input 
            type="text" 
            value={(initialProfile?.bh_id as string) || ''} 
            readOnly 
            className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 opacity-50 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest opacity-40">Bio</label>
        <textarea 
          value={formData.bio} 
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4} 
          className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
            <Github size={14} /> GitHub URL
          </label>
          <input 
            type="text" 
            value={formData.github} 
            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
            <Globe size={14} /> Portfolio Website
          </label>
          <input 
            type="text" 
            value={formData.website} 
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit"
          disabled={isSubmitting}
          variant="default"
        >
          {isSubmitting ? <RoseSpinner size="sm" /> : <><Save size={16} /> Save Changes</>}
        </Button>
      </div>
    </form>
  );
}
