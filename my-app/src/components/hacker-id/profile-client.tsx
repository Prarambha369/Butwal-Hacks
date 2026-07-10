"use client";

import React, { useState, useEffect } from 'react';
import IdentityCard from '@/components/hacker-id/identity-card';
import CertificateList from '@/components/hacker-id/certificate-list';
import ProjectShowcase from '@/components/hacker-id/project-showcase';
import EventTimeline from '@/components/hacker-id/event-timeline';
import PhotoGallery from '@/components/hacker-id/photo-gallery';
import OwnerActionBar from '@/components/hacker-id/owner-action-bar';
import TrustMarkersList from '@/components/hacker-id/trust-markers-list';

import { Sparkles, Loader2, Code, Copy, Check } from 'lucide-react';
import { generateProfileSummary } from '@/lib/actions/generate-profile-summary';
import { useActionState } from 'react';
import type { HackerProfile, Project } from '@/lib/supabase-types';

// Extended to match both HackerProfile and additional runtime properties
type ProfileClientData = HackerProfile & {
  trust_markers?: unknown[];
  is_owner?: boolean;
  role?: string;
  ai_summary?: string | null;
};

export default function ProfileClient({ profile, projects }: { profile: ProfileClientData; projects: Project[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 px-6 md:px-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="lg-surface rounded-3xl p-10 h-64 animate-pulse border border-glass" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-surface/10 rounded-full animate-pulse" />
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 lg-surface rounded-2xl animate-pulse border border-glass" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6 md:px-20">
      <div className="max-w-5xl mx-auto space-y-12">
        <IdentityCard profile={profile} />
        <CertificateList certificates={profile.certificates} />

        {/* Trust Markers — verified achievements with GlassBadge */}
        <TrustMarkersList markers={(profile.trust_markers || []) as import('@/lib/supabase-types').TrustMarker[]} />
        
        {/* Pass isProfileView={true} to trigger the compact ContributionCard layout */}
        <ProjectShowcase projects={projects} isProfileView={true} />
        
        <EventTimeline events={profile.events} />
        <PhotoGallery photos={profile.photos} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="lg-surface rounded-2xl p-6 border border-glass">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Certificates</h3>
            <p className="text-2xl font-bold">{profile.certificates?.length || 0}</p>
          </div>
          <div className="lg-surface rounded-2xl p-6 border border-glass">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Projects</h3>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
          <div className="lg-surface rounded-2xl p-6 border border-glass">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Events</h3>
            <p className="text-2xl font-bold">{profile.events?.length || 0}</p>
          </div>
        </div>

        {/* Verify Anywhere — Embed Widget */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-bh-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">Verify Anywhere</h2>
          </div>
          <div className="lg-surface rounded-2xl border border-glass p-6">
            <p className="text-xs leading-relaxed text-secondary mb-3">
              External organizations can embed a live verification badge on their website.
              Visitors see the BH-ID holder&apos;s name, role, and XP in real-time.
            </p>
            <CopyEmbedCode bhId={profile.uniqueId} />
          </div>
        </section>

        {/* AI Profile Summary */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bh-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">AI Summary</h2>
          </div>
          <div className="lg-surface rounded-2xl border border-glass p-6">
            {profile.ai_summary ? (
              <p className="text-sm leading-relaxed text-primary/80">{profile.ai_summary}</p>
            ) : (
              <p className="text-sm italic text-secondary/60">
                No AI summary yet. Generate one to give visitors a quick overview of your profile.
              </p>
            )}
            {profile.is_owner && (
              <GenerateSummaryForm profileId={profile.id!} />
            )}
          </div>
        </section>
      </div>

      {/* Owner Action Bar - Visible if current user is the profile owner and an Organizer */}
      {profile.is_owner && (
        <OwnerActionBar role={profile.role} />
      )}
    </main>
  );
}

function CopyEmbedCode({ bhId }: { bhId: string }) {
  const [copied, setCopied] = useState(false)
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://butwalhacks.com"

  const embedCode = [
    `<iframe`,
    `  src="${siteUrl}/api/verify/${bhId}/embed"`,
    `  width="360"`,
    `  height="180"`,
    `  style="border:none;border-radius:16px;overflow:hidden"`,
    `  title="Verify BH-ID"`,
    `></iframe>`,
  ].join("\n")

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  return (
    <div className="space-y-3">
      <pre className="overflow-x-auto rounded-xl border border-glass bg-background p-3 text-[10px] font-mono leading-relaxed text-secondary">
        {embedCode}
      </pre>
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-bh-red-600 active:scale-95"
      >
        {copied ? (
          <><Check className="h-3.5 w-3.5" /> Copied!</>
        ) : (
          <><Copy className="h-3.5 w-3.5" /> Copy Embed Code</>
        )}
      </button>
    </div>
  )
}

function GenerateSummaryForm({ profileId }: { profileId: string }) {
  const [, formAction, isPending] = useActionState(
    generateProfileSummary.bind(null, profileId),
    null,
  )

  return (
    <form action={formAction} className="mt-4">
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-bh-red-600 active:scale-95 disabled:opacity-50"
      >
        {isPending ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5" /> Generate AI Summary</>
        )}
      </button>
    </form>
  );
}
