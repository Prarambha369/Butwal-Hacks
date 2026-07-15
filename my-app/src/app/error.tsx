"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { useUser } from '@auth0/nextjs-auth0/client';
import { t } from '@/lib/i18n';

/**
 * Generate a short, unique error ID for traceability.
 * Format: BH-ERR-{timestamp}-{random} — e.g. BH-ERR-1a2b3c-4f8k
 */
function generateErrorId(): string {
  const ts = Date.now().toString(36).slice(-6);
  const rand = Math.random().toString(36).slice(2, 6);
  return `BH-ERR-${ts}-${rand}`;
}

/** Parse User-Agent into structured browser/OS/device info */
function parseUA(ua: string) {
  const isChrome = ua.includes('Chrome/') && !ua.includes('Edg/');
  const isFirefox = ua.includes('Firefox/');
  const isSafari = ua.includes('Safari/') && !ua.includes('Chrome/');
  const isEdge = ua.includes('Edg/');
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua) && !isMobile;

  let browser = 'Unknown';
  if (isChrome) browser = 'Chrome';
  else if (isFirefox) browser = 'Firefox';
  else if (isSafari) browser = 'Safari';
  else if (isEdge) browser = 'Edge';

  let os = 'Unknown';
  if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';

  let device = 'Desktop';
  if (isTablet) device = 'Tablet';
  else if (isMobile) device = 'Mobile';

  return { browser, os, device };
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLanguage();

  // Call hook unconditionally at top level (rules of hooks)
  // Auth0 UserProvider wraps the app so this will never throw in practice.
  const { user } = useUser();
  const auth0Sub = user?.sub;

  // Guard: only report once per error instance (Strict Mode mounts twice in dev)
  const reportedRef = useRef(false);

  // Actually notify maintainers with rich debugging context
  useEffect(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const env = parseUA(ua);

    fetch('/api/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error_id: generateErrorId(),
        message: error.message,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
        user_id: auth0Sub || null,
        user_agent: ua,
        browser: env.browser,
        os: env.os,
        device: env.device,
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
        language: typeof navigator !== 'undefined' ? navigator.language : '',
      }),
    }).catch(() => {
      // Fire-and-forget — never block the error page
    });
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-background text-primary">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary-red/10 flex items-center justify-center text-primary-red">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('common.error', locale)}</h2>
          <p className="text-secondary">
            {t('error.unexpected', locale)}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()} 
            variant="default"
            className="w-full"
          >
            <RefreshCcw size={18} /> {t('common.retry', locale)}
          </Button>
          <Link 
            href="/" 
            className="text-sm text-secondary hover:underline"
          >
            {t('error.return_home', locale)}
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 rounded-xl bg-surface/10 border border-border text-left font-mono text-xs overflow-auto max-h-40">
            <p className="text-primary-red font-bold mb-2">{t('error.details', locale)}</p>
            <p className="whitespace-pre-wrap">{error.message}</p>
            {error.digest && <p className="mt-2 opacity-50">{t('error.digest', locale)} {error.digest}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
