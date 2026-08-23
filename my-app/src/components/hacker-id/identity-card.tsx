"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Github, Linkedin, Twitter, Globe, Trophy } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cloudinaryUrl, cn, getAvatarUrl } from '@/lib/utils';
import { HackerProfile } from '@/lib/supabase-types';
import { usePresence } from '@/hooks/use-presence';
import { LiveDot } from '@/components/hacker-id/live-dot';
import AvatarPreviewModal from '@/components/dashboard/hacker/avatar-preview-modal';

interface IdentityCardProps {
  profile: HackerProfile;
}

export default function IdentityCard({ profile }: IdentityCardProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ponytail: hooks must be called before early return — moved usePresence here
  const onlineIds = usePresence();

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy!', err);
    }
  };

  if (!mounted) return <div className="h-80 w-full bh-card animate-pulse" />;
  const isOnline = !!(profile.auth0_user_id && onlineIds.has(profile.auth0_user_id))

  const isOrganizer = profile.role === 'organizer';
  const hasGoldBorder = profile.trustMarkers?.some(tm => tm.title === 'Golden Profile Border');

  return (
    <div className="relative group">
      {/* Profile Banner */}
      <div className="h-32 md:h-48 w-full rounded-t-3xl overflow-hidden relative">
        {profile.bannerUrl ? (
          <Image 
            src={cloudinaryUrl(profile.bannerUrl, 1200)} 
            alt="Profile Banner" 
            fill 
            className="object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-red/20 via-background to-status-blue-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 [backgroundImage:radial-gradient(circle,var(--text-primary)_1px,transparent_1px)] [backgroundSize:20px_20px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Identity Content */}
      <div className="bh-card rounded-b-3xl p-6 md:p-10 border-x border-b border-border shadow-2xl relative">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end -mt-16 md:-mt-20 relative z-10">
          
          {/* Avatar with Concentric Ring */}
          <div className="relative mx-auto md:mx-0">
            <button
              type="button"
              onClick={() => setShowAvatarPreview(true)}
              className="text-left cursor-pointer"
              aria-label="Preview avatar"
            >
              <div className={`
                p-1 rounded-full transition-all duration-500
                ${isOrganizer || hasGoldBorder ? 'bg-primary-red ring-4 ring-primary-red/20 shadow-[0_0_20px_rgba(254,0,0,0.2)]' : 'bg-background/20 ring-4 ring-glass'}
              `}>
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-inner bg-background transition-transform group-hover:scale-105">
                  <Image 
                    src={getAvatarUrl(profile.avatar, profile.name)}
                    alt={profile.name} 
                    width={160} 
                    height={160} 
                    className="w-full h-full object-cover"
                    unoptimized={!profile.avatar}
                  />
                </div>
              </div>
            </button>
            {/* Live presence dot — visible on the avatar rim */}
            <div className="absolute -bottom-0.5 -right-0.5 z-20">
              <LiveDot online={isOnline} size="lg" />
            </div>
          </div>

          {/* Info Block */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            <div className="space-y-1">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-primary">
                  {profile.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                  <div className={`
                    px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest
                    ${isOrganizer ? 'bg-primary-red text-white border-deep-red' : 'bg-surface-hover text-muted-foreground border-border'}
                  `}>
                    {profile.role}
                  </div>
                  {/* Online / Offline badge */}
                  <div className={cn(
                    "px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all",
                    isOnline
                      ? 'bg-status-green/10 border-status-green/30 text-status-green shadow-[0_0_10px_var(--glow-status-green)]'
                      : 'bg-surface/5 border-border/30 text-muted-foreground/50',
                  )}>
                    <LiveDot online={isOnline} size="sm" showLabel />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed opacity-80">
                {profile.bio}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              {/* Achievement Badges Summary */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-yellow/10 border border-status-yellow/20 text-status-yellow text-xs font-bold">
                <Trophy size={14} />
                <span>{profile.trustMarkers?.length || 0} Achievements</span>
              </div>

              {/* Unique ID Capsule */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-hover border border-border font-mono text-xs text-muted-foreground group/id">
                <span className="opacity-50">ID:</span>
                <span className="font-bold">{profile.uniqueId}</span>
                <button 
                  onClick={copyId}
                  className="p-1 hover:text-primary-red transition-colors"
                >
                  {copied ? <Check size={14} className="text-status-green" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Socials */}
              <div className="flex items-center gap-2">
                {profile.socials.github && (
                  <a href={profile.socials.github} target="_blank" className="p-2 rounded-full bg-surface-hover border border-border hover:text-primary-red hover:border-primary-red/50 transition-all">
                    <Github size={16} />
                  </a>
                )}
                {profile.socials.linkedin && (
                  <a href={profile.socials.linkedin} target="_blank" className="p-2 rounded-full bg-surface-hover border border-border hover:text-primary-red hover:border-primary-red/50 transition-all">
                    <Linkedin size={16} />
                  </a>
                )}
                {profile.socials.twitter && (
                  <a href={profile.socials.twitter} target="_blank" className="p-2 rounded-full bg-surface-hover border border-border hover:text-primary-red hover:border-primary-red/50 transition-all">
                    <Twitter size={16} />
                  </a>
                )}
                {profile.socials.website && (
                  <a href={profile.socials.website} target="_blank" className="p-2 rounded-full bg-surface-hover border border-border hover:text-primary-red hover:border-primary-red/50 transition-all">
                    <Globe size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Preview Modal */}
      {showAvatarPreview && (
        <AvatarPreviewModal
          avatarUrl={profile.avatar || null}
          seed={profile.name || null}
          fullName={profile.name || null}
          onClose={() => setShowAvatarPreview(false)}
        />
      )}
    </div>
  );
}
