"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {Trophy, Link as LinkIcon, Settings, Trash2, ShieldCheck, UserPlus} from 'lucide-react';
import TeamRequestList from '@/components/dashboard/team-request-list';
import TeamInviteList from '@/components/dashboard/team-invite-list';
import InviteHackerModal from '@/components/dashboard/invite-hacker-modal';
import LinkProjectModal from '@/components/dashboard/link-project-modal';

import { createClient } from '@/utils/supabase/client';
import { useUser } from "@auth0/nextjs-auth0/client";
import { Team, TeamMember, Profile } from '@/lib/supabase-types';

import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';

export default function TeamManagement() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useUser();
  const [profileUuid, setProfileUuid] = useState<string | null>(null);

  // ponytail: Resolve Auth0 sub to profile UUID once on mount
  useEffect(() => {
    const userId = user?.sub;
    if (!userId) return;
    supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) setProfileUuid(data.id);
      });
  }, [user?.sub]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      if (!user || !profileUuid) { setLoading(false); return; }

      // Find the user's team
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('profile_id', profileUuid)
        .single();

      if (memberError || !memberData) {
        setTeam(null);
        setLoading(false);
        return;
      }

      const teamId = memberData.team_id;

      // Fetch team details
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      // Fetch all team members
      const { data: membersData } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      // Fetch profiles for members
      const memberProfileIds = membersData?.map(m => m.profile_id) || [];
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberProfileIds);

      const profileMap: Record<string, Profile> = {};
      profileData?.forEach(p => {
        profileMap[p.id] = p;
      });

      setTeam(teamData || null);
      setMembers(membersData || []);
      setProfiles(profileMap);
    } catch {
      setError('Could not load team data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchTeamData();

  useEffect(() => {
    fetchTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemoveMember = async (profileId: string) => {
    setError(null);
    try {
      if (!user) return;
      if (!user) return;

      if (!profileUuid) { setError('Profile not loaded yet'); return; }
      const { data: captainCheck } = await supabase
        .from('team_members')
        .select('is_captain')
        .eq('team_id', team!.id)
        .eq('profile_id', profileUuid)
        .single();

      if (!captainCheck?.is_captain) {
        setError('Only the team captain can remove members.');
        return;
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team!.id)
        .eq('profile_id', profileId);

      if (error) throw error;
      setError(null);
      toast.success('Member removed from team');
      fetchTeamData();
    } catch (err: unknown) {
      // ponytail: inline error so user sees it in context, not as a fleeting toast
      setError(err instanceof Error ? err.message : 'Failed to remove member. Try again.');
    }
  };    if (loading) return <div className="flex justify-center p-20"><RoseSpinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-bh-red-500/10 border border-bh-red-500/30 text-bh-red-500 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-bh-red-500/60 hover:text-bh-red-500 text-xs">Dismiss</button>
        </div>
      )}
      <TeamInviteList onUpdate={refresh} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Team Details</h3>
              <Settings className="w-5 h-5 text-secondary" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-mono text-secondary uppercase tracking-widest">Team Name</p>
              <p className="text-2xl font-bold">{team?.name ?? 'Unnamed Team'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-secondary uppercase tracking-widest">Team ID</p>
              <p className="text-sm font-mono text-secondary">{team?.id ?? '—'}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-glass space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Status</span>
                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Members</span>
                <span className="font-medium">{members.length} / 5</span>
              </div>
            </div>
          </div>

          <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-bh-red-500" /> Project Linkage
            </h3>
            <p className="text-sm text-secondary">
              Connect your team to a project submission to make it official.
            </p>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="w-full py-3 rounded-xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all text-sm font-bold flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" /> Link Project
            </button>
          </div>

          {isLinkModalOpen && (
            <LinkProjectModal
              teamId={team?.id ?? ''}
              onClose={() => setIsLinkModalOpen(false)}
              onSuccess={refresh}
            />
          )}
        </div>

        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <TeamRequestList teamId={team?.id ?? ''} onUpdate={refresh} />
          <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Squad Members</h3>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="p-2 rounded-xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all text-xs font-bold flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Invite Hacker
              </button>
            </div>

            {isInviteModalOpen && (
              <InviteHackerModal
                teamId={team?.id ?? ''}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={refresh}
              />
            )}

            <div className="space-y-4">
              {members.map((member) => {
                const profile = profiles[member.profile_id];
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass hover:bg-background/[0.07] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10">
                        <Image
                          src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`}
                          alt={profile?.full_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{profile?.full_name}</p>
                        <p className="text-[10px] font-mono text-secondary">{profile?.bh_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.is_captain && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-bh-red-500/10 text-bh-red-500 text-[10px] font-bold uppercase">
                          <ShieldCheck className="w-3 h-3" /> Captain
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member.profile_id)}
                        className="p-2 rounded-lg text-secondary hover:text-bh-red-500 transition-colors"
                        title="Remove from Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
