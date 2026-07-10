"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Save, Edit3 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Profile } from '@/lib/supabase-types';

import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ContributionEditorProps {
  projectId: string;
  members: Profile[];
}

export default function ContributionEditor({ projectId, members }: ContributionEditorProps) {
  const [contributions, setContributions] = useState<Record<string, { role: string; detail: string }>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  void supabase;

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const { getProjectContributions } = await import('@/lib/actions/contributions');
        const data = await getProjectContributions(projectId);
        
        const map: Record<string, { role: string; detail: string }> = {};
        const items = data as Array<{ profile_id: string; role: string; contribution: string }>;
        items.forEach((c) => {
          map[c.profile_id] = { role: c.role, detail: c.contribution };
        });
        setContributions(map);
      } catch (error) {
        logger.error('Error fetching contributions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContributions();
  }, [projectId]);

  const handleSave = async (profileId: string, role: string, detail: string) => {
    try {
      const { updateContribution } = await import('@/lib/actions/contributions');
      const result = await updateContribution(projectId, profileId, role, detail);
      if (result.success) {
        toast.success('Contribution updated!');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save contribution');
    }
  };

  if (loading) return <div className="flex justify-center p-4"><RoseSpinner size="sm" /></div>;

  return (
    <div className="space-y-6 p-6 rounded-3xl bg-surface/10 border border-glass">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-bh-red-500" /> Edit Contributions
        </h3>
        <span className="text-[10px] font-mono text-secondary uppercase">Captains Only</span>
      </div>

      <div className="space-y-4">
        {members.map(member => (
          <div key={member.id} className="p-4 rounded-2xl bg-background border border-glass space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image loading="lazy" src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.full_name}`} alt={member.full_name} fill className="object-cover" />
              </div>
              <p className="text-sm font-bold">{member.full_name}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-secondary uppercase">Role</label>
                <input 
                  className="w-full px-3 py-2 rounded-lg bg-surface/10 border border-glass text-xs focus:border-bh-red-500 outline-none"
                  placeholder="e.g. Lead Frontend"
                  value={contributions[member.id]?.role || ''}
                  onChange={e => setContributions({...contributions, [member.id]: { ...contributions[member.id], role: e.target.value }})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-mono text-secondary uppercase">Key Contribution</label>
                <input 
                  className="w-full px-3 py-2 rounded-lg bg-surface/10 border border-glass text-xs focus:border-bh-red-500 outline-none"
                  placeholder="e.g. Implemented the real-time dashboard"
                  value={contributions[member.id]?.detail || ''}
                  onChange={e => setContributions({...contributions, [member.id]: { ...contributions[member.id], detail: e.target.value }})}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => handleSave(member.id, contributions[member.id]?.role || '', contributions[member.id]?.detail || '')}
                className="p-2 rounded-lg bg-bh-red-500 text-primary hover:bg-bh-red-500/90 transition-all"
                title="Save Contribution"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
