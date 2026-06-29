"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Github, Linkedin, Twitter, Globe } from 'lucide-react';
import { HackerProfile } from '@/lib/hacker-id';

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
      console.error('Failed to copy!', err);
    }
  };

  if (!mounted) return <div className="h-80 w-full bh-glass-surface rounded-3xl animate-pulse" />;

  const isOrganizer = profile.role === 'Organizer';

  return (
    <div className="relative group">
      {/* Profile Banner */}
      <div className="h-32 md:h-48 w-full rounded-t-3xl overflow-hidden relative">
        {profile.bannerUrl ? (
          <Image 
            src={profile.bannerUrl} 
            alt="Profile Banner" 
            fill 
            className="object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-red-500/20 via-bg-primary to-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />
      </div>

      {/* Identity Content */}
      <div className="bh-glass-surface rounded-b-3xl p-6 md:p-10 border-x border-b border-white/10 shadow-2xl relative">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end -mt-16 md:-mt-20 relative z-10">
          
          {/* Avatar with Concentric Ring */}
          <div className="relative mx-auto md:mx-0">
            <div className={`
              p-1 rounded-full transition-all duration-500
              ${isOrganizer ? 'bg-red-500 ring-4 ring-red-500/20 shadow-[0_0_20px_rgba(230,57,70,0.4)]' : 'bg-white/20 ring-4 ring-white/10'}
            `}>
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-bg-primary shadow-inner bg-bg-primary">
                <Image 
                  src={profile.avatar} 
                  alt={profile.name} 
                  width={160} 
                  height={160} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Info Block */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            <div className="space-y-1">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary">
                  {profile.name}
                </h1>
                <div className={`
                  px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest
                  ${isOrganizer ? 'bg-red-500 text-white border-red-600' : 'bg-white/10 text-text-secondary border-white/20'}
                `}>
                  {profile.role}
                </div>
              </div>
              <p className="text-text-secondary text-sm md:text-base max-w-2xl leading-relaxed opacity-80">
                {profile.bio}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              {/* Unique ID Capsule */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-text-secondary group/id">
                <span className="opacity-50">ID:</span>
                <span className="font-bold">{profile.uniqueId}</span>
                <button 
                  onClick={copyId}
                  className="p-1 hover:text-red-500 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Socials */}
              <div className="flex items-center gap-2">
                {profile.socials.github && (
                  <a href={profile.socials.github} target="_blank" className="p-2 rounded-full bg-white/5 border border-white/10 hover:text-red-500 hover:border-red-500/50 transition-all">
                    <Github size={16} />
                  </a>
                )}
                {profile.socials.linkedin && (
                  <a href={profile.socials.linkedin} target="_blank" className="p-2 rounded-full bg-white/5 border border-white/10 hover:text-red-500 hover:border-red-500/50 transition-all">
                    <Linkedin size={16} />
                  </a>
                )}
                {profile.socials.twitter && (
                  <a href={profile.socials.twitter} target="_blank" className="p-2 rounded-full bg-white/5 border border-white/10 hover:text-red-500 hover:border-red-500/50 transition-all">
                    <Twitter size={16} />
                  </a>
                )}
                {profile.socials.website && (
                  <a href={profile.socials.website} target="_blank" className="p-2 rounded-full bg-white/5 border border-white/10 hover:text-red-500 hover:border-red-500/50 transition-all">
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
