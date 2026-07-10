"use client";

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { createClient } from '@/utils/supabase/client';
import { useUser } from "@auth0/nextjs-auth0/client";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import GatedFeature from '@/components/dashboard/gated-feature';

interface NominateButtonProps {
  projectId: string;
  userXp: number;
}

export default function NominateButton({ projectId, userXp }: NominateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [hasNominated, setHasNominated] = useState(false);
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

  useEffect(() => {
    const checkNomination = async () => {
      if (!user || !profileUuid) return;

      const { data } = await supabase
        .from('project_nominations')
        .select('id')
        .eq('project_id', projectId)
        .eq('profile_id', profileUuid)
        .single();

      if (data) setHasNominated(true);
    };
    checkNomination();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, profileUuid]);

  const handleNominate = async () => {
    setLoading(true);
    try {
      const { nominateProject } = await import('@/lib/actions/curation');
      const result = await nominateProject(projectId);
      if (result.success) {
        setHasNominated(true);
        toast.success('Project nominated for spotlight!');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to nominate project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GatedFeature minXp={500} userXp={userXp} featureName="Nomination">
      <button 
        onClick={handleNominate}
        disabled={loading || hasNominated}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
          hasNominated 
            ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 cursor-default" 
            : "bg-surface/10 border-glass text-secondary hover:bg-surface/10 hover:text-primary"
        )}
      >
        {loading ? (
          <RoseSpinner size="sm" />
        ) : (
          <Star className="w-3 h-3" />
        )}
        {hasNominated ? 'Nominated' : 'Nominate for Spotlight'}
      </button>
    </GatedFeature>
  );
}
