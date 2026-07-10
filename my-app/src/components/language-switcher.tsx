'use client';

import React from 'react';
import { useLanguage } from '@/components/language-provider';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-surface/10 rounded-full border border-glass p-0.5">
      <button
        onClick={() => setLocale('en')}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
          locale === 'en'
            ? 'bg-bh-red-500/20 text-bh-red-500 shadow-sm'
            : 'text-secondary hover:text-primary'
        )}
        aria-label="Switch to English"
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => setLocale('ne')}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
          locale === 'ne'
            ? 'bg-bh-red-500/20 text-bh-red-500 shadow-sm'
            : 'text-secondary hover:text-primary'
        )}
        aria-label="नेपालीमा स्विच गर्नुहोस्"
      >
        🇳🇵 नेपाली
      </button>
    </div>
  );
}
