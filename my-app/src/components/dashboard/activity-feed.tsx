"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Trophy, Code2, Users, Activity, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { FeedSkeleton } from '@/components/ui/skeleton';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { EmptyState } from '@/components/ui/empty-state';

const PAGE_SIZE = 20;

type Activity = { id?: string; type: string; message: string; user?: { full_name?: string }; timestamp: string };

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivity = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const { getRecentActivity } = await import('@/lib/actions/activity');
      const data = await getRecentActivity(pageNum, PAGE_SIZE);
      setActivities(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      logger.error('Error fetching activity:', error);
      setError('Could not load recent activity. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ponytail: Load once on mount — removed the 30-second auto-refresh interval.
  // Was burning serverless quota with constant polling on every dashboard view.
  // Users can click "Load More" for fresh data, or refresh the page.
  useEffect(() => {
    fetchActivity(0);
  }, [fetchActivity]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'XP_AWARDED': return <Zap className="w-4 h-4 text-status-yellow" />;
      case 'PROJECT_SUBMITTED': return <Code2 className="w-4 h-4 text-status-blue" />;
      case 'BADGE_EARNED': return <Trophy className="w-4 h-4 text-status-orange" />;
      case 'TEAM_JOINED': return <Users className="w-4 h-4 text-status-teal" />;
      default: return <div className="w-4 h-4 rounded-full bg-surface-hover" />;
    }
  };

  if (loading && activities.length === 0 && !error) {
    return <FeedSkeleton count={5} />;
  }

  // Show error state when fetch completely failed (no cached data)
  if (error && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <div className="p-3 rounded-full bg-primary-red/10">
          <AlertCircle className="w-6 h-6 text-primary-red" />
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <button
          onClick={() => fetchActivity(0)}
          className="px-4 py-2 rounded-full bg-surface-hover border border-border text-xs font-bold text-muted-foreground hover:text-primary transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inline error banner when we have cached activities but refresh failed */}
      {error && activities.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-red/10 border border-primary-red/20">
          <AlertCircle className="w-4 h-4 text-primary-red shrink-0" />
          <p className="text-xs text-primary-red/80">{error}</p>
          <button
            onClick={() => fetchActivity(activities.length > 0 ? page : 0)}
            className="ml-auto text-[10px] font-bold text-primary-red hover:text-bh-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {activities.length > 0 ? (
        activities.map((activity, idx) => (
          <div key={activity.id || idx} className="flex items-start gap-3 p-4 rounded-lg bg-surface-hover border border-border hover:bg-background transition-all">
            <div className="mt-1 p-2 rounded-lg bg-background border border-border">
              {getActivityIcon(activity.type)}
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-bold text-primary">{activity.user?.full_name || 'Someone'}</span>
                <span className="text-muted-foreground"> {activity.message}</span>
              </p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))
      ) : (
        <EmptyState
          icon={<Activity className="w-12 h-12" />}
          title="No activity yet"
          description="Activity from the community will appear here — project submissions, achievements earned, and team milestones. Be the first to make a move!"
          actions={[
            { label: "Submit a project", href: "/dashboard/hacker/projects", variant: "primary" },
          ]}
          hint="Load more to see past activity — refresh the page for latest"
        />
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
            className="px-6 py-2 rounded-full bg-surface-hover border border-border text-xs font-bold text-muted-foreground hover:bg-surface-hover transition-all disabled:opacity-50"
          >
            {loading ? <RoseSpinner size="sm" /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
