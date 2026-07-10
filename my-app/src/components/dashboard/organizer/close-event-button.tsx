"use client";

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { closeEvent } from '@/lib/actions/events';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { Button } from '@/components/ui/button';

interface CloseEventButtonProps {
  eventId: string;
}

export default function CloseEventButton({ eventId }: CloseEventButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = async () => {
    setLoading(true);
    try {
      const result = await closeEvent(eventId);
      if (result.success) {
        toast.success("Event closed and certificates issued!");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!showConfirm ? (
        <Button 
          variant="default"
          onClick={() => setShowConfirm(true)}
          className="bg-bh-red-600 hover:bg-red-700"
        >
          <Lock className="w-4 h-4" /> Close Event & Issue Certs
        </Button>
      ) : (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
          <Button 
            variant="default"
            onClick={handleClose}
            disabled={loading}
            className="bg-bh-red-700 hover:bg-bh-red-800"
          >
            {loading ? <RoseSpinner size="sm" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Closing...' : 'Confirm Close'}
          </Button>
          <button 
            onClick={() => setShowConfirm(false)}
            className="px-6 py-3 rounded-full font-bold bg-surface/10 hover:bg-background/20 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
