"use client";

import React, { useState, useEffect } from 'react';
import { notFound } from "next/navigation";
import { getHackerProfile, currentUser } from "@/lib/hacker-id";
import IdentityCard from "@/components/hacker-id/identity-card";
import CertificateList from "@/components/hacker-id/certificate-list";
import ProjectShowcase from "@/components/hacker-id/project-showcase";
import EventTimeline from "@/components/hacker-id/event-timeline";
import PhotoGallery from "@/components/hacker-id/photo-gallery";
import OwnerActionBar from "@/components/hacker-id/owner-action-bar";

// We create a Client wrapper to handle hydration perfectly
export default function ProfileClient({ profile }: { profile: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-6 md:px-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="bh-glass-surface rounded-3xl p-10 h-64 animate-pulse border border-white/10" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bh-glass-surface rounded-2xl animate-pulse border border-white/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary pt-24 pb-12 px-6 md:px-20">
      <div className="max-w-5xl mx-auto space-y-12">
        <IdentityCard profile={profile} />
        <CertificateList certificates={profile.certificates} />
        <ProjectShowcase projects={profile.projects} />
        <EventTimeline events={profile.events} />
        <PhotoGallery photos={profile.photos} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bh-glass-surface rounded-2xl p-6 border border-white/10">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Certificates</h3>
            <p className="text-2xl font-bold">{profile.certificates.length}</p>
          </div>
          <div className="bh-glass-surface rounded-2xl p-6 border border-white/10">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Projects</h3>
            <p className="text-2xl font-bold">{profile.projects.length}</p>
          </div>
          <div className="bh-glass-surface rounded-2xl p-6 border border-white/10">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Events</h3>
            <p className="text-2xl font-bold">{profile.events.length}</p>
          </div>
        </div>
      </div>

      {/* Owner Action Bar - Visible if current user is the profile owner and an Organizer */}
      {currentUser && currentUser.uniqueId === profile.uniqueId && (
        <OwnerActionBar role={profile.role} />
      )}
    </main>
  );
}
