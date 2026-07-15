"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, X, UserPlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';


import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';

interface TeamRequestListProps {
  teamId: string;
  onUpdate: () => void;
}

interface JoinRequest {
  id: string;
  team_id: string;
  status: string;
  profiles: { full_name?: string; bh_id?: string; avatar_url?: string } | null;
}

export default function TeamRequestList({ teamId, onUpdate }: TeamRequestListProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          *,
          profiles (*)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending_approval');

      if (error) throw error;
      setRequests(data || []);
    } catch {
      setError('Could not load join requests. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [teamId]);

  const handleRespond = async (inviteId: string, approve: boolean) => {
    setError(null);
    try {
      const { acceptTeamInvite, denyTeamInvite } = await import('@/lib/actions/teams');
      if (approve) {
        const result = await acceptTeamInvite(inviteId);
        if (result.success) toast.success('Member added to team!');
      } else {
        const result = await denyTeamInvite(inviteId);
        if (result.success) toast.info('Join request declined');
      }
      await fetchRequests();
      onUpdate();
    } catch (err: unknown) {
      // ponytail: inline error so captain sees it in context near the action buttons
      setError(err instanceof Error ? err.message : 'Operation failed. Try again.');
    }
  };

  if (loading) return <div className="flex justify-center p-4"><RoseSpinner size="sm" /></div>;
  if (requests.length === 0 && !error) return null;

  return (
    <div className="space-y-4 p-6 rounded-xl bg-surface-hover border border-border">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <UserPlus className="w-4 h-4" /> Join Requests
      </h3>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-red/10 border border-primary-red/30 text-primary-red text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-primary-red/60 hover:text-primary-red text-xs">Dismiss</button>
        </div>
      )}
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                <Image 
                  src={req.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.profiles?.full_name}`} 
                  alt={req.profiles?.full_name || 'Hacker'}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold">{req.profiles?.full_name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{req.profiles?.bh_id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleRespond(req.id, false)}
                className="p-2 rounded-lg bg-surface-hover text-muted-foreground hover:text-primary-red transition-colors"
                title="Decline"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleRespond(req.id, true)}
                className="p-2 rounded-lg bg-bh-red-500 text-primary hover:bg-primary-red/90 transition-colors"
                title="Approve"
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
