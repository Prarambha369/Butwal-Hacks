"use client";

import React, { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { revokeTrustMarker } from '@/lib/actions/admin';
import { RoseSpinner } from '@/components/ui/rose-loader';

interface TrustOverrideRowProps {
  marker: {
    id: string;
    profiles: { full_name: string; id: string };
    title: string;
    is_revoked: boolean;
  };
}

export default function TrustOverrideRow({ marker }: TrustOverrideRowProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleRevocation = async () => {
    setIsProcessing(true);
    try {
      // For now, we use revokeTrustMarker as the primary action.
      // A full toggle would require a new action.
      await revokeTrustMarker(marker.profiles.id, marker.id);
      toast.success(`Trust marker ${marker.title} updated.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update marker');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <tr className="hover:bg-surface/10 transition-colors group">
      <td className="px-6 py-4">
        <span className="font-bold text-sm">{marker.profiles?.full_name || 'Unknown'}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm opacity-60">{marker.title}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${marker.is_revoked ? 'bg-bh-red-500/20 text-bh-red-500' : 'bg-green-500/20 text-green-400'}`}>
          {marker.is_revoked ? 'Revoked' : 'Active'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={handleToggleRevocation}
          disabled={isProcessing}
          className="p-2 rounded-lg hover:bg-surface/10 text-secondary transition-colors disabled:opacity-50"
        >
          {isProcessing ? <RoseSpinner size="sm" /> : <RefreshCcw size={16} />}
        </button>
      </td>
    </tr>
  );
}
