"use client";

import React, { useState, useEffect } from 'react';
import { Check, X, Mail } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from "@auth0/nextjs-auth0/client";

import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';

interface TeamInvite {
  id: string;
  profile_id: string;
  team_id: string;
  status: string;
  created_at: string;
  teams: { name: string } | null;
}

export default function PendingInvites() {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
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
        .select('*, teams(name)')
        .eq('profile_id', profileUuid)
        .eq('status', 'pending');

      if (error) throw error;
      setInvites(data || []);
    } catch {
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRespond = async (inviteId: string, accept: boolean) => {
    try {
      const { acceptTeamInvite } = await import('@/lib/actions/teams');
      if (accept) {
        const result = await acceptTeamInvite(inviteId);
        if (result.success) toast.success('Joined team successfully!');
      } else {
        await supabase
          .from('team_invites')
          .update({ status: 'declined' })
          .eq('id', inviteId);
        toast.info('Invitation declined');
      }
      fetchInvites();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      toast.error(message);
    }
  };

  if (loading) return <div className="flex justify-center p-4"><RoseSpinner size="sm" /></div>;
  if (invites.length === 0) return null;

  return (
    <div className="space-y-4 p-4 rounded-3xl bg-surface/10 border border-glass">
      <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
        <Mail className="w-4 h-4" /> Team Invitations
      </h3>
      <div className="space-y-3">
        {invites.map(invite => (
          <div key={invite.id} className="flex items-center justify-between p-3 rounded-2xl bg-background border border-glass">
            <div>
              <p className="text-sm font-bold">{invite.teams?.name || 'Unnamed Team'}</p>
              <p className="text-[10px] text-secondary font-mono">Invite ID: {invite.id.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleRespond(invite.id, false)}
                className="p-2 rounded-lg bg-surface/10 text-secondary hover:text-bh-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleRespond(invite.id, true)}
                className="p-2 rounded-lg bg-bh-red-500 text-primary hover:bg-bh-red-500/90 transition-colors"
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
