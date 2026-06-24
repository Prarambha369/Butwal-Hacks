"use client";

import React, { useState } from 'react';
import { Save, Globe, Github, Linkedin, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { updateProfile } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { CloudinaryUpload } from '@/components/cloudinary-upload';
import { useUser } from '@auth0/nextjs-auth0/client';
import { cn } from '@/lib/utils';

const BIO_MAX = 500;
const URL_REGEX = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-./?%&=]*)?$/i;

function isValidUrl(val: string): boolean {
  if (!val) return true;
  return URL_REGEX.test(val);
}

const inputClass = "w-full bg-background/50 border border-border/30 rounded-lg px-4 py-3 outline-none transition-all duration-200 placeholder:text-muted/50 focus:border-bh-red-500/50 focus:ring-2 focus:ring-bh-red-500/20 hover:border-border/60";
const inputErrorClass = "border-bh-red-500 focus:ring-2 ring-bh-red-500/50";
const labelClass = "text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground";

export default function ProfileSettingsForm({ initialProfile }: { initialProfile: Record<string, unknown> }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    full_name: (initialProfile?.full_name as string) || '',
    bio: (initialProfile?.bio as string) || '',
    github: ((initialProfile?.socials as Record<string, string>)?.github as string) || '',
    linkedin: ((initialProfile?.socials as Record<string, string>)?.linkedin as string) || '',
    website: ((initialProfile?.socials as Record<string, string>)?.website as string) || '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string>((initialProfile?.avatar_url as string) || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const bhId = initialProfile?.bh_id as string | undefined;
  const auth0UserId = user?.sub;

  const bioCharsLeft = BIO_MAX - formData.bio.length;
  const bioOverLimit = formData.bio.length > BIO_MAX;
  const urlError = (val: string): boolean => val !== "" && !isValidUrl(val);
  const hasErrors = bioOverLimit || urlError(formData.github) || urlError(formData.linkedin) || urlError(formData.website);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(new Set(['bio', 'github', 'linkedin', 'website']));
    if (hasErrors) {
      toast.error('Please fix the highlighted fields before saving.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile(initialProfile?.id as string, {
        full_name: formData.full_name,
        bio: formData.bio,
        avatar_url: avatarUrl === '' ? null : avatarUrl || undefined,
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

  const showError = (field: string) => {
    if (!touched.has(field)) return false;
    if (field === 'bio') return bioOverLimit;
    return urlError(formData[field as 'github' | 'linkedin' | 'website']);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Avatar upload */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-bh-red-500/20 shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-hover flex items-center justify-center text-2xl font-bold text-primary/40">
              {(initialProfile?.full_name as string)?.[0] || '?'}
            </div>
          )}
        </div>
        <div className="flex-1">
          <CloudinaryUpload
            onUpload={(url) => setAvatarUrl(url)}
            label="Upload Avatar"
            currentImage={avatarUrl}
            entityType="avatar"
            bhId={bhId}
            uploaderAuth0Id={auth0UserId}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>BH-ID</label>
          <input
            type="text"
            value={(initialProfile?.bh_id as string) || ''}
            readOnly
            className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-3 opacity-50 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Bio with character counter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={labelClass}>Bio</label>
          <span className={cn(
            "text-[10px] font-mono transition-colors",
            bioCharsLeft < 0 ? "text-primary-red font-bold" : bioCharsLeft < 50 ? "text-status-yellow" : "text-muted-foreground"
          )}>
            {formData.bio.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          onBlur={() => setTouched(prev => new Set(prev).add('bio'))}
          rows={4}
          maxLength={BIO_MAX}
          className={cn(
            inputClass,
            showError('bio') && inputErrorClass
          )}
        />
        {showError('bio') && (
          <p className="flex items-center gap-1 text-[10px] text-primary-red font-medium">
            <AlertCircle size={10} />
            Bio must be {BIO_MAX} characters or fewer ({formData.bio.length} currently).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={cn(labelClass, "flex items-center gap-2")}>
            <Github size={14} /> GitHub URL
          </label>
          <input
            type="text"
            value={formData.github}
            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            onBlur={() => setTouched(prev => new Set(prev).add('github'))}
            placeholder="https://github.com/username"
            className={cn(inputClass, showError('github') && inputErrorClass)}
          />
          {showError('github') && (
            <p className="flex items-center gap-1 text-[10px] text-primary-red font-medium">
              <AlertCircle size={10} />
              Enter a valid URL (e.g., https://github.com/username).
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className={cn(labelClass, "flex items-center gap-2")}>
            <Linkedin size={14} /> LinkedIn URL
          </label>
          <input
            type="text"
            value={formData.linkedin}
            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
            onBlur={() => setTouched(prev => new Set(prev).add('linkedin'))}
            placeholder="https://linkedin.com/in/username"
            className={cn(inputClass, showError('linkedin') && inputErrorClass)}
          />
          {showError('linkedin') && (
            <p className="flex items-center gap-1 text-[10px] text-primary-red font-medium">
              <AlertCircle size={10} />
              Enter a valid URL (e.g., https://linkedin.com/in/username).
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={cn(labelClass, "flex items-center gap-2")}>
            <Globe size={14} /> Portfolio Website
          </label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            onBlur={() => setTouched(prev => new Set(prev).add('website'))}
            placeholder="https://example.com"
            className={cn(inputClass, showError('website') && inputErrorClass)}
          />
          {showError('website') && (
            <p className="flex items-center gap-1 text-[10px] text-primary-red font-medium">
              <AlertCircle size={10} />
              Enter a valid URL (e.g., https://example.com).
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting || (touched.size > 0 && hasErrors)}
          className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>
    </form>
  );
}
