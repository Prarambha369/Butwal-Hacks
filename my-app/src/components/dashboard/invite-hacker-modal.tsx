"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {Search, UserPlus, X} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Profile } from '@/lib/supabase-types';

import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';

interface InviteHackerModalProps {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteHackerModal({ teamId, onClose, onSuccess }: InviteHackerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProfiles = async () => {
    if (searchQuery.length < 2) {
      setProfiles([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${searchQuery}%,bh_id.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setProfiles(data || []);
    } catch {
      toast.error('Failed to search hackers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProfiles, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInvite = async (profileId: string, fullName: string) => {
    setInvitingId(profileId);
    try {
      const { sendTeamInvite } = await import('@/lib/actions/teams');
      const result = await sendTeamInvite(profileId, teamId);
      
      if (result.success) {
        toast.success(`Invite sent to ${fullName}!`);
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 ">
      <div className="bg-background border border-border w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold">Invite Hacker</h3>
          <button onClick={onClose} className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-surface-hover transition-colors focus:ring-2 focus:ring-[#FE0000] focus:outline-none" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all"
              placeholder="Search by name or BH-ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <RoseSpinner size="sm" />
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {profiles.length > 0 ? (
              profiles.map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover border border-border hover:border-primary-red/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 overflow-hidden rounded-full bg-surface-hover">
                      <Image 
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} 
                        alt={profile.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{profile.full_name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{profile.bh_id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleInvite(profile.id, profile.full_name)}
                    disabled={invitingId === profile.id}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-bh-red-500 text-primary hover:bg-primary-red/90 transition-colors disabled:opacity-50"
                    aria-label={`Invite ${profile.full_name}`}
                  >
                    {invitingId === profile.id ? (
                      <RoseSpinner size="sm" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery.length < 2 
                  ? "Start typing to search for hackers..." 
                  : "No matching hackers found."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
