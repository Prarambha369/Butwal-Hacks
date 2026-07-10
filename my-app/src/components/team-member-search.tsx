"use client";

import React, { useState } from 'react';
import { Search, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { Profile } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';
import { RoseSpinner } from '@/components/ui/rose-loader';

interface TeamMemberSearchProps {
  teamId: string;
  onMemberAdded?: (profileId: string) => void;
}

export default function TeamMemberSearch({ teamId, onMemberAdded }: TeamMemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [addedMembers, setAddedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      setProfiles([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${searchTerm}%`)
        .or(`bh_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          profile_id: profileId,
          is_captain: false,
        });

      if (error) throw error;

      setAddedMembers(prev => [...prev, profileId]);
      toast.success('Member added to team!');
      if (onMemberAdded) onMemberAdded(profileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add member';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input 
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all"
          placeholder="Search by name, BH-ID, or email..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><RoseSpinner size="sm" /></div>}
      </div>

      {!loading && profiles.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {profiles.map(profile => (
            <div key={profile.id} className="flex items-center justify-between p-3 border border-glass rounded-xl bg-surface/10 hover:bg-surface/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-bh-red-500/20 flex items-center justify-center text-bh-red-500 font-bold text-xs">
                  {profile.full_name?.[0].toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{profile.full_name}</p>
                  <p className="text-[10px] font-mono text-secondary">{profile.bh_id}</p>
                </div>
              </div>
              <button 
                onClick={() => handleAddMember(profile.id)}
                disabled={addedMembers.includes(profile.id)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  addedMembers.includes(profile.id) 
                    ? "bg-green-500/20 text-green-500 cursor-default" 
                    : "bg-surface/10 text-secondary hover:text-primary hover:bg-surface/10"
                )}
              >
                {addedMembers.includes(profile.id) ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && searchTerm.length >= 2 && profiles.length === 0 && (
        <div className="text-center py-4 text-xs text-secondary italic">
          No hackers found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );
}
