"use client";

import React, { useState } from 'react';
import { Save, Globe, Github, Linkedin, AlertCircle, Loader2, ZoomIn, GraduationCap, Calendar } from 'lucide-react';
import Image from 'next/image';
import { updateProfile } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { CloudinaryUpload } from '@/components/cloudinary-upload';
import CameraCapture from '@/components/camera-capture';
import { useUser } from '@auth0/nextjs-auth0/client';
import { cn, getAvatarUrl } from '@/lib/utils';
import { getSocialLinkError } from '@/lib/validation';
import AvatarPreviewModal from './avatar-preview-modal';

const BIO_MAX = 500;

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
    open_to_mentor: (initialProfile?.open_to_mentor as boolean) || false,
    cal_com_url: ((initialProfile?.cal_com_url as string) || ''),
  });
  const [avatarUrl, setAvatarUrl] = useState<string>((initialProfile?.avatar_url as string) || '');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFile, setCameraFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  const bhId = initialProfile?.bh_id as string | undefined;
  const fullName = initialProfile?.full_name as string | undefined;
  const auth0UserId = user?.sub;
  const avatarSeed = fullName || bhId || auth0UserId || undefined;

  const bioCharsLeft = BIO_MAX - formData.bio.length;
  const bioOverLimit = formData.bio.length > BIO_MAX;
  const urlError = (field: 'github' | 'linkedin' | 'website'): boolean => {
    const val = formData[field];
    if (!val) return false;
    const platform = field === 'github' ? 'github' : field === 'linkedin' ? 'linkedin' : 'website';
    return getSocialLinkError(platform, val) !== null;
  };
  const hasErrors = bioOverLimit || urlError('github') || urlError('linkedin') || urlError('website');

  /** Auto-save avatar when it changes (upload or remove). */
  const handleAvatarChange = async (url: string) => {
    setAvatarUrl(url);
    setAvatarSaving(true);
    setAvatarSaved(false);

    if (!auth0UserId) {
      toast.error('Session not found. Please sign in again.');
      setAvatarSaving(false);
      return;
    }

    try {
      await updateProfile(auth0UserId, {
        avatar_url: url === '' ? null : url,
      });
      setAvatarSaved(true);
      toast.success(url ? 'Avatar uploaded!' : 'Avatar removed.');
      setTimeout(() => setAvatarSaved(false), 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save avatar';
      toast.error(message);
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(new Set(['bio', 'github', 'linkedin', 'website']));
    if (hasErrors) {
      toast.error('Please fix the highlighted fields before saving.');
      return;
    }
    if (!auth0UserId) {
      toast.error('Session not found. Please sign in again.');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      // Only save non-avatar fields — avatar is already auto-saved
      await updateProfile(auth0UserId, {
        full_name: formData.full_name,
        bio: formData.bio,
        avatar_url: undefined, // Don't touch avatar; already saved
        open_to_mentor: formData.open_to_mentor,
        cal_com_url: formData.cal_com_url || undefined,
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
    return urlError(field as 'github' | 'linkedin' | 'website');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Avatar upload */}
      <div className="flex items-center gap-6">
        {/* Clickable avatar preview with DiceBear fallback */}
        <button
          type="button"
          onClick={() => setShowAvatarPreview(true)}
          className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-bh-red-500/20 shrink-0 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
          aria-label="Preview avatar"
        >
          <Image
            src={getAvatarUrl(avatarUrl, avatarSeed)}
            alt="Avatar"
            fill
            className="object-cover transition-all group-hover:brightness-75"
            sizes="96px"
            unoptimized={!avatarUrl} // Only optimize uploaded Cloudinary images; DiceBear serves ready-to-use images
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-full bg-black/40 p-2">
              <ZoomIn className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>
        <div className="flex-1">
          <CloudinaryUpload
            onUpload={handleAvatarChange}
            onOpenCamera={() => setShowCamera(true)}
            externalFile={cameraFile}
            label={avatarSaving ? 'Saving...' : avatarSaved ? 'Saved!' : 'Upload Avatar'}
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
              {getSocialLinkError('github', formData.github)}
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
              {getSocialLinkError('linkedin', formData.linkedin)}
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
              {getSocialLinkError('website', formData.website)}
            </p>
          )}
        </div>
      </div>

      {/* Mentor settings section */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap size={16} className="text-primary-red" />
          <span className={cn(labelClass)}>Mentorship</span>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.open_to_mentor}
                onChange={(e) => setFormData({ ...formData, open_to_mentor: e.target.checked })}
                className="sr-only peer"
              />
              <div className={cn(
                "w-10 h-6 rounded-full transition-colors duration-200",
                formData.open_to_mentor ? "bg-primary-red" : "bg-border"
              )}>
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 absolute top-1",
                  formData.open_to_mentor ? "translate-x-5" : "translate-x-1"
                )} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary group-hover:text-primary-red transition-colors">
                Available for Mentorship
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                Show your profile in the Mentor Directory so hackers can request 1:1 chats.
              </span>
            </div>
          </label>

          {formData.open_to_mentor && (
            <div className="space-y-2 pl-13">
              <label className={cn(labelClass, "flex items-center gap-2")}>
                <Calendar size={14} /> Cal.com Booking Link
              </label>
              <input
                type="text"
                value={formData.cal_com_url}
                onChange={(e) => setFormData({ ...formData, cal_com_url: e.target.value })}
                placeholder="https://cal.com/username/15min"
                className={cn(inputClass)}
              />
              <p className="text-[10px] text-muted-foreground/40">
                Create a free 15-min booking page at Cal.com and paste the link here. Hackers will use it to schedule mentorship sessions.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting || (touched.size > 0 && hasErrors)}
          className={cn("inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95", (isSubmitting || (touched.size > 0 && hasErrors)) && "bh-btn-disabled")}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {/* Avatar Preview Modal */}
      {showAvatarPreview && (
        <AvatarPreviewModal
          avatarUrl={avatarUrl || null}
          seed={avatarSeed || null}
          fullName={fullName || null}
          onClose={() => setShowAvatarPreview(false)}
        />
      )}

      {/* Camera Capture */}
      {showCamera && (
        <CameraCapture
          onCapture={(file) => {
            setCameraFile(file);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </form>
  );
}
