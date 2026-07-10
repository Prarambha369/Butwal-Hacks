"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {MessageSquare, Send} from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { full_name?: string; avatar_url?: string } | null;
}

interface CommentSectionProps {
  projectId: string;
}

export default function CommentSection({ projectId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const { getComments } = await import('@/lib/actions/comments');
      const data = await getComments(projectId);
      setComments(data);
    } catch (error) {
      logger.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // ponytail: optimistic UI — show comment immediately, revert on failure
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment,
      created_at: new Date().toISOString(),
      profiles: null,
    };
    const prevComments = comments;
    setComments(prev => [...prev, optimisticComment]);
    const sentContent = newComment;
    setNewComment('');
    setSubmitting(true);

    try {
      const { postComment } = await import('@/lib/actions/comments');
      const result = await postComment(projectId, sentContent);
      if (result.success) {
        await fetchComments();
        toast.success('Comment posted!');
      }
    } catch (error: unknown) {
      // revert optimistic update
      setComments(prevComments);
      setNewComment(sentContent);
      const message = error instanceof Error ? error.message : 'Failed to post comment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pt-12 border-t border-glass">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-bh-red-500" />
        <h3 className="text-2xl font-bold font-heading">Community Discussion</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea 
            className="w-full px-4 py-3 rounded-2xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all resize-none"
            placeholder="Share your thoughts or feedback..."
            rows={3}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <button 
            disabled={submitting || !newComment.trim()}
            className={cn(
              "absolute bottom-3 right-3 p-2 rounded-xl transition-all",
              submitting || !newComment.trim() 
                ? "bg-surface/10 text-secondary cursor-not-allowed" 
                : "bg-bh-red-500 text-primary hover:bg-bh-red-500/90"
            )}
          >
            {submitting ? <RoseSpinner size="sm" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment, idx) => (
            <div key={comment.id || idx} className="flex gap-4 p-4 rounded-2xl bg-surface/10 border border-glass">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 shrink-0">
                <Image 
                  src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.full_name}`} 
                  alt={comment.profiles?.full_name || 'Commenter'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{comment.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-[10px] text-secondary font-mono">{new Date(comment.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-secondary leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center text-secondary">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm text-secondary">No comments yet. Be the first to start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
