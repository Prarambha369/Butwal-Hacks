"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Locale } from '@/lib/i18n';

const STORAGE_KEY = 'bh-locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'en' to match the server render — avoids hydration mismatch.
  // localStorage is read after mount in useEffect below.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ne') {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: string) => {
    if (l === 'en' || l === 'ne') setLocaleState(l);
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext) ?? { locale: 'en' as Locale, setLocale: () => {} };
}

const LanguageContext = createContext<{ locale: Locale; setLocale: (l: string) => void } | null>(null);
