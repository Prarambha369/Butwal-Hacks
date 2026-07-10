"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell, CheckCircle2, UserPlus, Heart, Info, LucideIcon } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';

interface Notification {
  id: string;
  user_id: string;
  type: 'team_invite' | 'team_request' | 'project_like' | 'system' | 'achievement';
  content: string;
  is_read: boolean;
  created_at: string;
  metadata?: unknown;
}

const NOTIFICATION_CONFIG: Record<Notification['type'], { icon: LucideIcon; color: string; bg: string }> = {
  team_invite: { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  team_request: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  project_like: { icon: Heart, color: 'text-bh-red-500', bg: 'bg-bh-red-500/10' },
  system: { icon: Info, color: 'text-secondary', bg: 'bg-surface/10' },
  achievement: { icon: CheckCircle2, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
        return;
      }
      setNotifications(data || []);
      setLoading(false);
    }
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update notification');
      return;
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      toast.error('Failed to mark all as read');
      return;
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-surface/10 border border-glass">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-16" /></div>
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-20 h-20 bg-surface/10 rounded-full flex items-center justify-center mx-auto">
          <Bell className="w-10 h-10 text-secondary" />
        </div>
        <h3 className="text-2xl font-bold">No notifications</h3>
        <p className="text-secondary max-w-md mx-auto">
          You&apos;re all caught up! Everything is quiet in the community.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Recent Alerts</h2>
        <button 
          onClick={markAllAsRead}
          className="text-sm text-secondary hover:text-primary transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="grid gap-4">
        {notifications.map((n) => {
          const config = NOTIFICATION_CONFIG[n.type];
          const Icon = config.icon;

          return (
            <div 
              key={n.id} 
              className={`group relative p-4 rounded-2xl border transition-all hover:bg-surface/10 
                ${n.is_read ? 'border-glass5 opacity-70' : 'border-glass bg-surface/10 ring-1 ring-white/10'}`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 ${config.bg} ${config.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-secondary' : 'text-primary'}`}>
                      {n.content}
                    </p>
                    <span className="text-[10px] text-secondary whitespace-nowrap ml-4">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {n.type === 'team_invite' && (
                      <Link 
                        href={`/dashboard/teams`} 
                        className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:underline"
                      >
                        View Invitation
                      </Link>
                    )}
                    {n.type === 'project_like' && (
                      <Link 
                        href={`/projects`} 
                        className="text-[10px] font-bold uppercase tracking-widest text-bh-red-500 hover:underline"
                      >
                        View Project
                      </Link>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-2 rounded-full hover:bg-surface/10 transition-colors text-secondary"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
