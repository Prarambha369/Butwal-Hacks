"use client";

import React, { useState, useEffect } from 'react';
import { Check, X, Mail } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from "@auth0/nextjs-auth0/client";

import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';

interface TeamInviteListProps {
  onUpdate: () => void;
}

interface TeamInviteData {
  id: string;
  team_id: string;
  profile_id: string;
  status: string;
  created_at: string;
  teams: { name: string } | null;
}

export default function TeamInviteList({ onUpdate }: TeamInviteListProps) {
  const [invites, setInvites] = useState<TeamInviteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUuid, setProfileUuid] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useUser();

  // ponytail: Resolve Auth0 sub to profile UUID on mount
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

  const fetchInvites = async () => {
    setLoading(true);
    try {
      if (!user || !profileUuid) return;

      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          *,
          teams (*)
        `)
        .eq('profile_id', profileUuid)
        .eq('status', 'pending');

      if (error) throw error;
      setInvites(data || []);
    } catch {
      setError('Could not load team invitations. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setError(null);
    try {
      const { acceptTeamInvite } = await import('@/lib/actions/teams');
      if (accept) {
        await acceptTeamInvite(inviteId);
        toast.success('Welcome to the team!');
      } else {
        const { denyTeamInvite } = await import('@/lib/actions/teams');
        if (denyTeamInvite) {
          await denyTeamInvite(inviteId);
          toast.info('Invitation declined');
        } else {
          setError('Unable to decline invitation at this time');
        }
      }
      await fetchInvites();
      onUpdate();
    } catch (err: unknown) {
      // ponytail: inline error so user sees it in context, not as a fleeting toast
      setError(err instanceof Error ? err.message : 'Operation failed. Try again.');
    }
  };

  if (loading) return <div className="flex justify-center p-4"><RoseSpinner size="sm" /></div>;
  if (invites.length === 0 && !error) return null;

  return (
    <div className="space-y-4 p-6 rounded-3xl bg-surface/10 border border-glass mb-8">
      <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
        <Mail className="w-4 h-4" /> Pending Invitations
      </h3>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-bh-red-500/10 border border-bh-red-500/30 text-bh-red-500 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-bh-red-500/60 hover:text-bh-red-500 text-xs">Dismiss</button>
        </div>
      )}
      <div className="space-y-3">
        {invites.map(invite => (
          <div key={invite.id} className="flex items-center justify-between p-3 rounded-2xl bg-background border border-glass">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bh-red-500/20 flex items-center justify-center text-bh-red-500">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{invite.teams?.name || 'Unnamed Team'}</p>
                <p className="text-[10px] font-mono text-secondary">Team ID: {invite.team_id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleRespond(invite.id, false)}
                className="p-2 rounded-lg bg-surface/10 text-secondary hover:text-bh-red-500 transition-colors"
                title="Decline"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleRespond(invite.id, true)}
                className="p-2 rounded-lg bg-bh-red-500 text-primary hover:bg-bh-red-500/90 transition-colors"
                title="Accept"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Necessary to import Users since I used it in the JSX
import { Users } from 'lucide-react';
