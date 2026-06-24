"use client";

import React, { useState } from 'react';
import { Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { toast } from 'sonner';

interface LinkProjectModalProps {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LinkProjectModal({ teamId, onClose, onSuccess }: LinkProjectModalProps) {
  const [projectId, setProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { linkProjectToTeam } = await import('@/lib/actions/projects');
      const result = await linkProjectToTeam(projectId, teamId);
      if (result.success) {
        toast.success('Project linked to team successfully!');
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to link project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 ">
      <div className="bg-background border border-border p-8 rounded-xl max-w-md w-full space-y-6 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold font-heading">Link Project</h3>
          <p className="text-sm text-muted-foreground">
            Enter the Project ID to attribute this work to your team.
          </p>
        </div>

        <form onSubmit={handleLink} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Project ID</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all"
                placeholder="uuid-of-the-project"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-surface-hover border border-border hover:bg-surface-hover transition-all text-sm font-bold"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg bg-bh-red-500 text-primary hover:bg-primary-red/90 transition-all text-sm font-bold flex items-center justify-center gap-2",
                submitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {submitting ? <RoseSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
              Link Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
