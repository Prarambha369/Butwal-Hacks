import React from 'react';
import Image from 'next/image';
import SiteHeader from '@/components/site-header';
import Footer from '@/components/sections/Footer';
import ActivityFeed from '@/components/dashboard/activity-feed';
import LevelBadge from '@/components/dashboard/level-badge';
import RewardsStore from '@/components/dashboard/rewards-store';
import ClaimedBanner from '@/components/dashboard/claimed-banner';
import { auth0 } from "@/lib/auth0";
import { createClient } from '@/utils/supabase/server';

export default async function DashboardPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) return null;

  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth0_user_id', userId)
    .single();

  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <SiteHeader />
      <div className="max-w-7xl mx-auto space-y-6">
        <ClaimedBanner />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: User Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="lg-surface p-8 rounded-3xl border border-glass text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto overflow-hidden rounded-full ring-4 ring-bh-red-500/20">
              {profile?.avatar_url || profile?.full_name ? (
                <Image 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} 
                  alt={profile?.full_name || 'Avatar'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface/10 flex items-center justify-center text-2xl font-bold text-primary/40">
                  ?
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-bh-red-500 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                {profile?.role}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
              <p className="text-xs font-mono text-secondary">{profile?.bh_id}</p>
            </div>
            <LevelBadge xp={profile?.xp || 0} />
          </div>
          
          <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Quick Links</h3>
            <div className="grid grid-cols-1 gap-2">
              <a href="/dashboard/explore" className="p-3 rounded-xl bg-surface/10 hover:bg-surface/10 transition-all text-xs font-medium flex items-center justify-between group">
                Explore Hackers <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </a>
              <a href="/dashboard/teams" className="p-3 rounded-xl bg-surface/10 hover:bg-surface/10 transition-all text-xs font-medium flex items-center justify-between group">
                My Team <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </a>
              <a href="/dashboard/projects/new" className="p-3 rounded-xl bg-bh-red-500/10 text-bh-red-500 hover:bg-bh-red-500/20 transition-all text-xs font-bold flex items-center justify-between group">
                Submit Project <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tight font-heading">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
            <div className="text-xs font-mono text-secondary">Lumbini Province, Nepal</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
                Live Community Activity
              </h3>
              <ActivityFeed />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Daily Mission</h3>
              <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-status-yellow/10 text-status-yellow">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold">Collaborate with a new hacker</p>
                </div>
                <p className="text-xs text-secondary">
                  Find a teammate with complementary skills and send an invite to earn 20 XP.
                </p>
                <a href="/dashboard/explore" className="text-xs font-bold text-bh-red-500 hover:underline">Start Exploring →</a>
              </div>
            </div>
          </div>
          <RewardsStore />
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.9C10 13.7 11 12.5 12 12.5s2 .8 2 2.4a2.5 2.5 0 0 1-2.5 2.5H10a2.5 2.5 0 0 1-2.5-2.5c0-1.6 1-2.4 2-2.4z"></path>
      <path d="M12 2v12"></path>
      <path d="M8 22v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
    </svg>
  );
}
