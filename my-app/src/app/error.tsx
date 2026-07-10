"use client";

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-primary">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-bh-red-500/10 flex items-center justify-center text-bh-red-500">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-secondary">
            An unexpected error occurred while processing your request. Our maintainers have been notified.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()} 
            variant="default"
            className="w-full"
          >
            <RefreshCcw size={18} /> Try Again
          </Button>
          <Link 
            href="/" 
            className="text-sm text-secondary hover:underline"
          >
            Return to Home
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 rounded-xl bg-surface/10 border border-glass text-left font-mono text-xs overflow-auto max-h-40">
            <p className="text-bh-red-500 font-bold mb-2">Error Details:</p>
            <p className="whitespace-pre-wrap">{error.message}</p>
            {error.digest && <p className="mt-2 opacity-50">Digest: {error.digest}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
