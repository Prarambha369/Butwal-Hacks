"use client";

import React, { useState } from 'react';
import { Award } from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ImpactReportButtonProps {
  projectId: string;
}

export default function ImpactReportButton({ projectId }: ImpactReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // In a real app, we might trigger a PDF generation lambda here
      // For now, we just redirect to the static report page
      router.push(`/projects/impact/${projectId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGenerate}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
        "bg-surface/10 border-glass text-secondary hover:bg-surface/10 hover:text-primary"
      )}
    >
      {loading ? (
        <RoseSpinner size="sm" />
      ) : (
        <Award className="w-3 h-3" />
      )}
      Impact Report
    </button>
  );
}
