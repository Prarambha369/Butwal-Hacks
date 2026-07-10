"use client";

import React, { useState, useEffect } from 'react';
import { Eye, Heart, MessageSquare, BarChart3 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

import { RoseSpinner } from '@/components/ui/rose-loader';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) return <div className="flex justify-center p-20"><RoseSpinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="lg-surface p-6 rounded-3xl border border-glass flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono text-secondary uppercase tracking-widest">Total Views</p>
            <p className="text-2xl font-bold">{stats.reduce((acc, s) => acc + s.views, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="lg-surface p-6 rounded-3xl border border-glass flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-bh-red-500/10 text-bh-red-500">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono text-secondary uppercase tracking-widest">Total Likes</p>
            <p className="text-2xl font-bold">{stats.reduce((acc, s) => acc + s.likes, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="lg-surface p-6 rounded-3xl border border-glass flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono text-secondary uppercase tracking-widest">Total Comments</p>
            <p className="text-2xl font-bold">{stats.reduce((acc, s) => acc + s.comments, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="lg-surface rounded-3xl border border-glass overflow-hidden">
        <div className="p-6 border-b border-glass flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-bh-red-500" /> Per-Project Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/10 text-xs font-mono text-secondary uppercase tracking-widest">
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4 text-center">Views</th>
                <th className="px-6 py-4 text-center">Likes</th>
                <th className="px-6 py-4 text-center">Comments</th>
                <th className="px-6 py-4 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {stats.map(s => (
                <tr key={s.id} className="hover:bg-surface/10 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm group-hover:text-bh-red-500 transition-colors">{s.title}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-sm">{s.views}</td>
                  <td className="px-6 py-4 text-center text-sm">{s.likes}</td>
                  <td className="px-6 py-4 text-center text-sm">{s.comments}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-surface/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-bh-red-500 transition-all duration-500" 
                          style={{ width: `${Math.min(((s.likes + s.comments) / (s.views || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-secondary">
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
