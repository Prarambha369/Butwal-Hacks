"use client";

import React, { useState, useEffect } from 'react';
import { Eye, Heart, MessageSquare, BarChart3 } from 'lucide-react';
import { createClient } from '@/utils/supabase';

import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ProjectStat {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
}

export default function ProjectAnalyticsGrid({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<ProjectStat[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch projects for the event
      const { data: projects, error: pError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('event_id', eventId);

      if (pError) throw pError;

      const projectStats = await Promise.all(projects?.map(async (p) => {
        const { count: likes } = await supabase
          .from('project_likes')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', p.id);
        
        const { count: comments } = await supabase
          .from('project_comments')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', p.id);

        // We simulate views since we haven't fully implemented the table yet
        const views = Math.floor(Math.random() * 1000);

        return {
          id: p.id,
          title: p.title,
          views,
          likes: likes || 0,
          comments: comments || 0,
        };
      }));

      setStats(projectStats || []);
    } catch {
      toast.error('Failed to load project analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [eventId]);

  if (loading) return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(120px,auto)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={i === 0 ? 'md:col-span-2' : ''}>
            <CardSkeleton lines={0} />
          </div>
        ))}
      </div>
      <TableSkeleton rows={4} columns={5} />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(120px,auto)]">
        <div className="md:col-span-2 md:row-span-2 bh-card p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-status-blue/10 text-status-blue">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Total Views</p>
              <p className="text-4xl font-bold text-primary">{stats.reduce((acc, s) => acc + s.views, 0).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Aggregated across all projects in this event</p>
        </div>
        <div className="bh-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-red/10 text-primary-red">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Total Likes</p>
            <p className="text-2xl font-bold text-primary">{stats.reduce((acc, s) => acc + s.likes, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bh-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-status-teal/10 text-status-teal">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Total Comments</p>
            <p className="text-2xl font-bold text-primary">{stats.reduce((acc, s) => acc + s.comments, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bh-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-red" /> Per-Project Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="px-5 py-3.5">Project</th>
                <th className="px-5 py-3.5 text-center">Views</th>
                <th className="px-5 py-3.5 text-center">Likes</th>
                <th className="px-5 py-3.5 text-center">Comments</th>
                <th className="px-5 py-3.5 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors group">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-primary group-hover:text-primary-red transition-colors">{s.title}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-muted-foreground">{s.views}</td>
                  <td className="px-5 py-3.5 text-center text-sm text-muted-foreground">{s.likes}</td>
                  <td className="px-5 py-3.5 text-center text-sm text-muted-foreground">{s.comments}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-surface-hover rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-bh-red-500 transition-all duration-500" 
                          style={{ width: `${Math.min(((s.likes + s.comments) / (s.views || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {Math.round(((s.likes + s.comments) / (s.views || 1)) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
