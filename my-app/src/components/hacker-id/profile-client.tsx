"use client";

import React, { useState, useEffect } from 'react';
import IdentityCard from '@/components/hacker-id/identity-card';
import CertificateList from '@/components/hacker-id/certificate-list';
import ProjectShowcase from '@/components/hacker-id/project-showcase';
import EventTimeline from '@/components/hacker-id/event-timeline';
import PhotoGallery from '@/components/hacker-id/photo-gallery';
import OwnerActionBar from '@/components/hacker-id/owner-action-bar';
import TrustMarkersList from '@/components/hacker-id/trust-markers-list';

import { Sparkles, Loader2, Code, Copy, Check, Award, Code2, Palette, Globe, Cable, Cpu, Network, Link2, Rocket, Trophy, Layers } from 'lucide-react';
import { generateProfileSummary } from '@/lib/actions/generate-profile-summary';
import { useActionState } from 'react';

const SKILL_ICONS: Record<string, React.ReactNode> = {
  react: <Code2 className="w-5 h-5" />,
  python: <Code2 className="w-5 h-5" />,
  palette: <Palette className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  cable: <Cable className="w-5 h-5" />,
  cpu: <Cpu className="w-5 h-5" />,
  network: <Network className="w-5 h-5" />,
  link: <Link2 className="w-5 h-5" />,
  rocket: <Rocket className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  zap: <Layers className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
}
import type { HackerProfile, Project } from '@/lib/supabase-types';

// Extended to match both HackerProfile and additional runtime properties
type ProfileClientData = HackerProfile & {
  trust_markers?: unknown[];
  is_owner?: boolean;
  role?: string;
  ai_summary?: string | null;
};

interface UnlockedSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  treeName: string;
  treeColor: string;
  xpReward: number;
  unlockedAt: string;
}

export default function ProfileClient({
  profile,
  projects,
  unlockedSkills = [],
  totalSkillCount = 0,
}: {
  profile: ProfileClientData;
  projects: Project[];
  unlockedSkills?: UnlockedSkill[];
  totalSkillCount?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-background pt-24 pb-12 px-6 md:px-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="bh-card p-10 h-64 animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-surface-hover rounded-full animate-pulse" />
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bh-card animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-background pt-24 pb-12 px-6 md:px-20">
      <div className="max-w-5xl mx-auto space-y-12">
        <IdentityCard profile={profile} />
        <CertificateList certificates={profile.certificates} />

        {/* Trust Markers — verified achievements with GlassBadge */}
        <TrustMarkersList markers={(profile.trust_markers || []) as import('@/lib/supabase-types').TrustMarker[]} />

        {/* Skill Trees — unlocked micro-credentials */}
        {unlockedSkills.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary-red" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Skill Trees ({unlockedSkills.length}/{totalSkillCount})
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {unlockedSkills.map((skill) => (
                <div
                  key={skill.id}
                  title={`${skill.description} - ${skill.treeName}`}
                  className="bh-card p-3 flex flex-col items-center gap-2 text-center group hover:shadow-lg transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-red/10 flex items-center justify-center text-primary-red group-hover:scale-110 transition-transform">
                    {SKILL_ICONS[skill.icon] || <Award className="w-5 h-5" />}
                  </div>
                  <p className="text-xs font-semibold text-primary leading-tight">{skill.name}</p>
                  <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                    {skill.treeName}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Pass isProfileView={true} to trigger the compact ContributionCard layout */}
        <ProjectShowcase projects={projects} isProfileView={true} />
        
        <EventTimeline events={profile.events} />
        <PhotoGallery photos={profile.photos} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bh-card p-6">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Certificates</h3>
            <p className="text-2xl font-bold">{profile.certificates?.length || 0}</p>
          </div>
          <div className="bh-card p-6">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Projects</h3>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
          <div className="bh-card p-6">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Events</h3>
            <p className="text-2xl font-bold">{profile.events?.length || 0}</p>
          </div>
        </div>

        {/* Verify Anywhere — Embed Widget */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary-red" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Verify Anywhere</h2>
          </div>
          <div className="bh-card p-6">
            <p className="text-xs leading-relaxed text-muted-foreground mb-3">
              External organizations can embed a live verification badge on their website.
              Visitors see the BH-ID holder&apos;s name, role, and XP in real-time.
            </p>
            <CopyEmbedCode bhId={profile.uniqueId} />
          </div>
        </section>

        {/* AI Profile Summary */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-red" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">AI Summary</h2>
          </div>
          <div className="bh-card p-6">
            {profile.ai_summary ? (
              <p className="text-sm leading-relaxed text-primary/80">{profile.ai_summary}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground/60">
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

type EmbedVariant = "card" | "compact" | "badge";

const VARIANT_META: Record<EmbedVariant, { label: string; desc: string; width: number; height: number }> = {
  card:    { label: "Card",    desc: "Full identity card with stats & trust markers", width: 360, height: 300 },
  compact: { label: "Compact", desc: "Horizontal profile bar for sidebars",          width: 320, height: 64 },
  badge:   { label: "Badge",   desc: "Tiny verified badge for inline embedding",     width: 140, height: 28 },
};

function CopyEmbedCode({ bhId }: { bhId: string }) {
  const [variant, setVariant] = useState<EmbedVariant>("card");
  const [copied, setCopied] = useState(false);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://butwalhacks.com";

  const meta = VARIANT_META[variant];
  const srcSuffix = variant === "card" ? "" : `?variant=${variant}`;

  const embedCode = [
    `<iframe`,
    `  src="${siteUrl}/widget/${bhId}${srcSuffix}"`,
    `  width="${meta.width}"`,
    `  height="${meta.height}"`,
    `  style="border:none;border-radius:${variant === "badge" ? 6 : variant === "compact" ? 12 : 16}px;overflow:hidden"`,
    `  title="Verify BH-ID"`,
    `></iframe>`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  return (
    <div className="space-y-4">
      {/* Variant selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(VARIANT_META) as [EmbedVariant, typeof meta][]).map(([key, v]) => (
          <button
            key={key}
            onClick={() => { setVariant(key); setCopied(false); }}
            className={`relative rounded-lg border px-3.5 py-2 text-left transition-all ${
              variant === key
                ? "border-bh-red-500/40 bg-primary-red/10 shadow-[0_0_12px_rgba(254,0,0,.15)]"
                : "border-border bg-surface/20 hover:border-[#656565]"
            }`}
          >
            <div className={`text-xs font-bold tracking-wider ${variant === key ? "text-primary-red" : "text-muted-foreground"}`}>
              {v.label}
            </div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground/60">
              {v.desc}
            </div>
            <div className="mt-1 font-mono text-[9px] text-muted-foreground/40">
              {v.width}×{v.height}px
            </div>
          </button>
        ))}
      </div>

      {/* Code preview */}
      <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-[10px] font-mono leading-relaxed text-muted-foreground select-all">
        {embedCode}
      </pre>

      {/* Copy button */}
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-deep-red active:scale-95"
      >
        {copied ? (
          <><Check className="h-3.5 w-3.5" /> Copied!</>
        ) : (
          <><Copy className="h-3.5 w-3.5" /> Copy {VARIANT_META[variant].label} Embed Code</>
        )}
      </button>
    </div>
  );
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
        className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-deep-red active:scale-95 disabled:opacity-50"
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
