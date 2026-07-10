"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {Search, Filter, UserPlus, ExternalLink, Award, Sparkles} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Profile } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';
import { RoseSpinner } from '@/components/ui/rose-loader';
import Link from 'next/link';
import { toast } from 'sonner';

interface AIMatch {
  profileId: string;
  name: string;
  bh_id: string;
  skills: string[];
  reason: string;
}



export default function HackerDiscovery() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showTrustedOnly, setShowTrustedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AIMatch[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const supabase = createClient();

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let finalQuery = supabase
        .from('profiles')
        .select(`*, trust_markers(count)`)
        .order('full_name', { ascending: true });

      if (showTrustedOnly) {
        finalQuery = supabase
          .from('trusted_profiles')
          .select(`*, trust_markers(count)`)
          .order('full_name', { ascending: true });
      }

      if (searchQuery) {
        finalQuery = finalQuery.or(`full_name.ilike.%${searchQuery}%,bh_id.ilike.%${searchQuery}%`);
      }

      if (selectedSkill) {
        finalQuery = finalQuery.contains('skills', [selectedSkill]);
      }

      const { data } = await finalQuery;
      setProfiles(data || []);
    } catch {
      toast.error('Failed to load hackers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(fetchProfiles, 300);
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedSkill]);

  const [allSkills, setAllSkills] = useState<string[]>([]);
  useEffect(() => {
    const loadSkills = async () => {
      const { data } = await supabase.from('profiles').select('skills');
      const skillSet = new Set<string>();
      data?.forEach(p => p.skills?.forEach((s: string) => skillSet.add(s)));
      setAllSkills(Array.from(skillSet).sort());
    };
    loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAIMatch = async () => {
    setAiLoading(true);
    setAiRecommendations(null);
    try {
      const { getAITeamRecommendations } = await import('@/lib/actions/ai-team-match');
      const results = await getAITeamRecommendations();
      setAiRecommendations(results);
      if (results.length === 0) {
        toast.info('No good AI matches found. Try adding more skills to your profile.');
      }
    } catch {
      toast.error('Failed to get AI recommendations. Check your GROQ_API_KEY.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Match Section */}
      {aiRecommendations !== null && aiRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bh-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">AI Recommended Teammates</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiRecommendations.map((match) => {
              const profile = profiles.find((p) => p.id === match.profileId);
              return (
                <div
                  key={match.profileId}
                  className="relative lg-surface p-5 rounded-3xl border border-bh-red-500/40 shadow-[0_0_15px_rgba(254,0,0,0.1)] transition-all hover:border-bh-red-500/70"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden ring-2 ring-bh-red-500/30">
                      <Image
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.name}`}
                        alt={match.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{match.name}</p>
                      <p className="text-[10px] font-mono text-secondary">{match.bh_id}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-secondary mb-3">{match.reason}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {match.skills.slice(0, 4).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[9px] font-medium text-secondary">{s}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/profile/${match.bh_id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-surface/10 border border-glass text-[10px] font-medium hover:bg-surface/10 transition-colors"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => {
                        const teamId = prompt('Enter your Team ID to send an invite:');
                        if (!teamId) return;
                        import('@/lib/actions/teams').then(({ sendTeamInvite }) =>
                          sendTeamInvite(match.profileId, teamId).then((r) => {
                            if (r.success) toast.success(`Invite sent to ${match.name}!`);
                          }),
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-bh-red-500 text-primary text-[10px] font-bold hover:bg-bh-red-500/90 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 inline-block mr-1" />
                      Invite
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface/10 p-4 rounded-2xl border border-glass">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-glass focus:border-bh-red-500 outline-none transition-all text-sm"
            placeholder="Search by name or Hacker ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button
          onClick={handleAIMatch}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-bh-red-500 text-primary text-xs font-bold hover:bg-bh-red-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {aiLoading ? (
            <><RoseSpinner size="sm" /> Finding…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> AI Match</>
          )}
        </button>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <Filter className="w-4 h-4 text-secondary mr-2 shrink-0" />
          <button 
            onClick={() => setShowTrustedOnly(!showTrustedOnly)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1",
              showTrustedOnly ? "bg-bh-red-500 text-primary" : "bg-surface/10 text-secondary hover:bg-background/20"
            )}
          >
            <Award className="w-3 h-3" /> {showTrustedOnly ? 'Trusted Only' : 'Show All'}
          </button>
          <div className="w-px h-4 bg-surface/10 mx-2" />
          <button 
            onClick={() => setSelectedSkill(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
              !selectedSkill ? "bg-bh-red-500 text-primary" : "bg-surface/10 text-secondary hover:bg-background/20"
            )}
          >
            All Skills
          </button>
          {allSkills.map(skill => (
            <button 
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                selectedSkill === skill ? "bg-bh-red-500 text-primary" : "bg-surface/10 text-secondary hover:bg-background/20"
              )}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Grid */}
      {loading ? (
        <div className="flex justify-center p-20">
          <RoseSpinner size="lg" />
        </div>
      ) : profiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map(profile => (
            <div key={profile.id} className="group relative lg-surface p-6 rounded-3xl border border-glass transition-all hover:border-bh-red-500/50 hover:-translate-y-1 duration-300 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-bh-red-500/50 transition-all">
                  <Image 
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} 
                    alt={profile.full_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <div className="w-2 h-2 bg-background rounded-full" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-primary group-hover:text-bh-red-500 transition-colors">
                {profile.full_name}
              </h3>
              {profile.trust_markers && profile.trust_markers.length > 0 && (
                <div className="flex items-center gap-1 mb-1">
                  <Award className="w-3 h-3 text-bh-red-500" />
                  <span className="text-[10px] font-bold text-bh-red-500 uppercase tracking-tighter">
                    Verified Expert
                  </span>
                </div>
              )}
              <p className="text-xs font-mono text-secondary mb-4">{profile.bh_id}</p>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {profile.skills?.slice(0, 3).map(skill => (
                  <span key={skill} className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] font-medium text-secondary">
                    {skill}
                  </span>
                ))}
                {profile.skills && profile.skills.length > 3 && (
                  <span className="text-[10px] text-secondary font-mono">+{profile.skills.length - 3} more</span>
                )}
              </div>

              <div className="mt-auto w-full flex gap-2">
                <Link 
                  href={`/profile/${profile.bh_id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface/10 border border-glass text-xs font-medium hover:bg-surface/10 transition-colors"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </Link>
                <button 
                  onClick={async () => {
                    try {
                      // In a real app, we would have the user's active teamId here
                      // For now, we simulate the flow by prompting for teamId or using a default
                      const teamId = prompt("Enter your Team ID to send an invite:");
                      if (!teamId) return;
                      
                      const { sendTeamInvite } = await import('@/lib/actions/teams');
                      const result = await sendTeamInvite(profile.id, teamId);
                      if (result.success) toast.success(`Invite sent to ${profile.full_name}!`);
                    } catch (error: unknown) {
                      toast.error(error instanceof Error ? error.message : 'Failed to send invite');
                    }
                  }}
                  className="p-2 rounded-xl bg-bh-red-500 text-primary hover:bg-bh-red-500/90 transition-colors"
                  title="Invite to Team"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-surface/10 flex items-center justify-center text-secondary">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xl font-bold text-primary">No hackers found</p>
            <p className="text-secondary">Try adjusting your search or filters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
