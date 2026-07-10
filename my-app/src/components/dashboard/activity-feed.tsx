"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Trophy, Code2, Users } from 'lucide-react';
import { logger } from '@/lib/logger';import { RoseSpinner } from '@/components/ui/rose-loader';

const PAGE_SIZE = 20;

type Activity = { id?: string; type: string; message: string; user?: { full_name?: string }; timestamp: string };

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivity = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const { getRecentActivity } = await import('@/lib/actions/activity');
      const data = await getRecentActivity(pageNum, PAGE_SIZE);
      setActivities(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      logger.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity(0);
    const interval = setInterval(() => fetchActivity(0), 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'XP_AWARDED': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'PROJECT_SUBMITTED': return <Code2 className="w-4 h-4 text-blue-400" />;
      case 'BADGE_EARNED': return <Trophy className="w-4 h-4 text-orange-400" />;
      case 'TEAM_JOINED': return <Users className="w-4 h-4 text-teal-400" />;
      default: return <div className="w-4 h-4 rounded-full bg-surface/10" />;
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <RoseSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        activities.map((activity, idx) => (
          <div key={activity.id || idx} className="flex items-start gap-3 p-4 rounded-2xl bg-surface/10 border border-glass hover:bg-background/[0.07] transition-all">
            <div className="mt-1 p-2 rounded-lg bg-background border border-glass">
              {getActivityIcon(activity.type)}
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-bold text-primary">{activity.user?.full_name || 'Someone'}</span>
                <span className="text-secondary"> {activity.message}</span>
              </p>
              <p className="text-[10px] font-mono text-secondary uppercase tracking-tighter">
                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 space-y-2">
          <p className="text-sm text-secondary italic">The community is quiet... for now.</p>
        </div>
      )}

      {hasMore && activities.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchActivity(next, true);
            }}
            disabled={loading}
            className="px-6 py-2 rounded-full bg-surface/10 border border-glass text-xs font-bold text-secondary hover:bg-surface/10 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
