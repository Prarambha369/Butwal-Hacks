"use client";

import React, { useState } from 'react';
import { ShieldCheck, EyeOff, Flag, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModerationPanelProps {
  projectId: string;
  currentStatus: string;
  isVerified: boolean;
  onStatusChange: (status: 'published' | 'hidden' | 'flagged') => Promise<void>;
  onVerify: () => Promise<void>;
}

export default function ModerationPanel({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  projectId, 
  currentStatus, 
  isVerified, 
  onStatusChange, 
  onVerify 
}: ModerationPanelProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'status' | 'verify', value?: 'published' | 'hidden' | 'flagged') => {
    setLoading(true);
    try {
      if (action === 'status' && value !== undefined) {
        await onStatusChange(value);
      } else {
        await onVerify();
      }
      toast.success('Project updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-surface p-6 rounded-3xl border border-glass space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-bh-red-500" /> Moderation
        </h3>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
          currentStatus === 'published' ? "bg-green-500/10 text-green-500" : 
          currentStatus === 'hidden' ? "bg-surface0/10 text-secondary" : "bg-bh-red-500/10 text-bh-red-500"
        )}>
          {currentStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-3">
          <p className="text-xs font-mono text-secondary uppercase tracking-widest">Visibility</p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleAction('status', 'published')}
              disabled={loading || currentStatus === 'published'}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                currentStatus === 'published' ? "bg-green-500 text-primary" : "bg-surface/10 text-secondary hover:bg-surface/10"
              )}
            >
              <CheckCircle className="w-3 h-3" /> Publish
            </button>
            <button 
              onClick={() => handleAction('status', 'hidden')}
              disabled={loading || currentStatus === 'hidden'}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                currentStatus === 'hidden' ? "bg-surface text-primary" : "bg-surface/10 text-secondary hover:bg-surface/10"
              )}
            >
              <EyeOff className="w-3 h-3" /> Hide
            </button>
            <button 
              onClick={() => handleAction('status', 'flagged')}
              disabled={loading || currentStatus === 'flagged'}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                currentStatus === 'flagged' ? "bg-bh-red-500 text-primary" : "bg-surface/10 text-secondary hover:bg-surface/10"
              )}
            >
              <Flag className="w-3 h-3" /> Flag
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-glass">
          <p className="text-xs font-mono text-secondary uppercase tracking-widest">Verification</p>
          <button 
            onClick={() => handleAction('verify')}
            disabled={loading || isVerified}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all",
              isVerified ? "bg-green-500/20 text-green-500 cursor-default" : "bg-surface/10 text-primary hover:bg-background/20"
            )}
          >
            {isVerified ? (
              <><ShieldCheck className="w-4 h-4" /> Verified GitHub Repo</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Mark as Verified</>
            )}
          </button>
        </div>
      </div>

      {currentStatus === 'flagged' && (
        <div className="p-3 rounded-xl bg-bh-red-500/10 border border-bh-red-500/20 flex items-start gap-3 text-bh-red-500">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed">
            This project has been flagged for review. Please check the content for community guideline violations.
          </p>
        </div>
      )}
    </div>
  );
}
