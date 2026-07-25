"use client";

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/utils/supabase';
import { useUser } from "@auth0/nextjs-auth0/client";
import { cn } from '@/lib/utils';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface LikeButtonProps {
  projectId: string;
  initialLikes?: number;
}

export default function LikeButton({ projectId, initialLikes = 0 }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
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

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        if (!user || !profileUuid) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('project_likes')
          .select('id')
          .eq('project_id', projectId)
          .eq('profile_id', profileUuid)
          .single();

        setIsLiked(!!data);
      } catch (e) {
        logger.error('Error checking like status', e);
      } finally {
        setLoading(false);
      }
    };
    checkLikeStatus();
  }, [projectId, profileUuid]);

  const handleToggle = async () => {
    // ponytail: optimistic UI — update state immediately, revert on failure
    const prevLiked = isLiked;
    const prevCount = likes;
    setIsLiked(!prevLiked);
    setLikes(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const { toggleProjectLike } = await import('@/lib/actions/projects');
      const result = await toggleProjectLike(projectId);
      if (result.success) {
        toast.success(prevLiked ? 'Removed like' : 'Project liked!');

        // ponytail: XP award removed — handled by a separate trigger if needed
      }
    } catch (error: unknown) {
      // revert optimistic update
      setIsLiked(prevLiked);
      setLikes(prevCount);
      toast.error(error instanceof Error ? error.message : 'Failed to like project');
    }
  };

  if (loading) return <div className="flex justify-center"><RoseSpinner size="sm" /></div>;

  return (
    <button 
      onClick={handleToggle}
      className={cn(
        "group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 border",
        isLiked 
          ? "bg-primary-red/10 border-primary-red/50 text-primary-red" 
          : "bg-surface-hover border-border text-muted-foreground hover:bg-surface-hover hover:text-primary"
      )}
    >
      <Heart className={cn(
        "w-4 h-4 transition-transform group-active:scale-125",
        isLiked && "fill-current"
      )} />
      <span className="text-xs font-bold">{likes}</span>
    </button>
  );
}
