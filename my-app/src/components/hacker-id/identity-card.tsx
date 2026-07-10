"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Github, Linkedin, Twitter, Globe, Trophy } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cloudinaryUrl } from '@/lib/utils';
import { HackerProfile } from '@/lib/supabase-types';
import { usePresence } from '@/hooks/use-presence';
import { LiveDot } from '@/components/hacker-id/live-dot';

interface IdentityCardProps {
  profile: HackerProfile;
}

export default function IdentityCard({ profile }: IdentityCardProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy!', err);
    }
  };

  if (!mounted) return <div className="h-80 w-full lg-surface rounded-3xl animate-pulse" />;

  const onlineIds = usePresence();
  const isOnline = !!(profile.clerk_user_id && onlineIds.has(profile.clerk_user_id))

  const isOrganizer = profile.role === 'Organizer';
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
          <div className="w-full h-full bg-gradient-to-r from-bh-red-500/20 via-background to-status-blue-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 [backgroundImage:radial-gradient(circle,var(--text-primary)_1px,transparent_1px)] [backgroundSize:20px_20px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Identity Content */}
      <div className="lg-surface rounded-b-3xl p-6 md:p-10 border-x border-b border-glass shadow-2xl relative">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end -mt-16 md:-mt-20 relative z-10">
          
          {/* Avatar with Concentric Ring */}
          <div className="relative mx-auto md:mx-0">
            <div className={`
              p-1 rounded-full transition-all duration-500
              ${isOrganizer || hasGoldBorder ? 'bg-bh-red-500 ring-4 ring-bh-red-500/20 shadow-[0_0_20px_var(--glow-bh-red)]' : 'bg-background/20 ring-4 ring-glass'}
            `}>
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-inner bg-background">
                <Image 
                  src={profile.avatar} 
                  alt={profile.name} 
                  width={160} 
                  height={160} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Live presence dot */}
            <div className="absolute -bottom-0.5 -right-0.5 z-20">
              <LiveDot online={isOnline} />
            </div>
          </div>

          {/* Info Block */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            <div className="space-y-1">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-primary">
                  {profile.name}
                </h1>
                <div className={`
                  px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest
                  ${isOrganizer ? 'bg-bh-red-500 text-primary border-bh-red-600' : 'bg-surface/10 text-secondary border-glass'}
                `}>
                  {profile.role}
                </div>
              </div>
              <p className="text-secondary text-sm md:text-base max-w-2xl leading-relaxed opacity-80">
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/10 border border-glass font-mono text-xs text-secondary group/id">
                <span className="opacity-50">ID:</span>
                <span className="font-bold">{profile.uniqueId}</span>
                <button 
                  onClick={copyId}
                  className="p-1 hover:text-bh-red-500 transition-colors"
                >
                  {copied ? <Check size={14} className="text-status-green" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Socials */}
              <div className="flex items-center gap-2">
                {profile.socials.github && (
                  <a href={profile.socials.github} target="_blank" className="p-2 rounded-full bg-surface/10 border border-glass hover:text-bh-red-500 hover:border-bh-red-500/50 transition-all">
                    <Github size={16} />
                  </a>
                )}
                {profile.socials.linkedin && (
                  <a href={profile.socials.linkedin} target="_blank" className="p-2 rounded-full bg-surface/10 border border-glass hover:text-bh-red-500 hover:border-bh-red-500/50 transition-all">
                    <Linkedin size={16} />
                  </a>
                )}
                {profile.socials.twitter && (
                  <a href={profile.socials.twitter} target="_blank" className="p-2 rounded-full bg-surface/10 border border-glass hover:text-bh-red-500 hover:border-bh-red-500/50 transition-all">
                    <Twitter size={16} />
                  </a>
                )}
                {profile.socials.website && (
                  <a href={profile.socials.website} target="_blank" className="p-2 rounded-full bg-surface/10 border border-glass hover:text-bh-red-500 hover:border-bh-red-500/50 transition-all">
                    <Globe size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
