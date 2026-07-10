"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, ShieldCheck, Star, Zap, Award, CheckCircle2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TrustMarker {
  id: string;
  marker_type: string;
  label: string;
  description: string;
  created_at: string;
}

const MARKER_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  'verified_expert': { icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'top_contributor': { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  'community_leader': { icon: Star, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'fast_learner': { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'project_winner': { icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'default': { icon: CheckCircle2, color: 'text-secondary', bg: 'bg-surface/10' },
};

export default function AchievementsGrid({ userId }: { userId: string }) {
  const [markers, setMarkers] = useState<TrustMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      if (!userId) return;
      
      try {
        const supabase = createClient();
        // ponytail: Resolve Clerk user_xxx to profile UUID if needed
        let profileId = userId;
        if (userId.startsWith('user_')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userId)
            .single();
          if (profile) profileId = profile.id;
        }

        const { data, error } = await supabase
          .from('trust_markers')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMarkers(data || []);
      } catch (error) {
        logger.error('Error fetching achievements:', error);
        toast.error('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-surface/10 border border-glass space-y-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" count={2} />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-20 h-20 bg-surface/10 rounded-full flex items-center justify-center mx-auto">
          <Award className="w-10 h-10 text-secondary" />
        </div>
        <h3 className="text-2xl font-bold">No achievements yet</h3>
        <p className="text-secondary max-w-md mx-auto">
          Start contributing to projects, winning hackathons, and helping the community to earn your first badges!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {markers.map((marker) => {
        const config = MARKER_CONFIG[marker.marker_type] || MARKER_CONFIG.default;
        const Icon = config.icon;

        return (
          <div 
            key={marker.id} 
            className="group relative p-6 rounded-2xl bg-surface/10 border border-glass hover:border-glass transition-all hover:-translate-y-1"
          >
            <div className={`w-12 h-12 ${config.bg} ${config.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">{marker.label}</h3>
            <p className="text-sm text-secondary line-clamp-2">{marker.description}</p>
            <div className="mt-4 text-[10px] uppercase tracking-widest text-secondary font-medium">
              Earned {new Date(marker.created_at).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
