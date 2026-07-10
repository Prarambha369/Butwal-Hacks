"use client";

import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from "@auth0/nextjs-auth0/client";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface JoinTeamButtonProps {
  projectId: string;
}

export default function JoinTeamButton({ projectId }: JoinTeamButtonProps) {
  const [isMember, setIsMember] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
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
    const checkStatus = async () => {
      if (!user || !profileUuid) return;

      // 1. Check if already a member
      const { data: project } = await supabase
        .from('projects')
        .select('team_id')
        .eq('id', projectId)
        .single();

      if (!project?.team_id) return;

      const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', project.team_id)
        .eq('profile_id', profileUuid)
        .single();

      if (membership) {
        setIsMember(true);
        return;
      }

      // 2. Check if request already sent
      const { data: request } = await supabase
        .from('team_invites')
        .select('id')
        .eq('team_id', project.team_id)
        .eq('profile_id', profileUuid)
        .single();

      if (request) {
        setHasRequested(true);
      }
    };
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, profileUuid]);

  const handleRequest = async () => {
    // ponytail: optimistic UI — show "Request Sent" immediately, revert on failure
    const prevRequested = hasRequested;
    setHasRequested(true);

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('team_id')
        .eq('id', projectId)
        .single();

      if (!project?.team_id) throw new Error('Project has no team');

      const { requestToJoinTeam } = await import('@/lib/actions/teams');
      const result = await requestToJoinTeam(project.team_id);
      if (result.success) {
        toast.success('Join request sent to team captain!');
      }
    } catch (error: unknown) {
      // revert optimistic update
      setHasRequested(prevRequested);
      toast.error(error instanceof Error ? error.message : 'Failed to send request');
    }
  };

  if (isMember) return null;

  return (
    <Button 
      variant="secondary"
      onClick={handleRequest}
      disabled={hasRequested}
      className={cn(hasRequested && "opacity-50 cursor-not-allowed")}
    >
      <UserPlus className="w-4 h-4" />
      {hasRequested ? 'Request Sent' : 'Join Team'}
    </Button>
  );
}
