"use client";

import React, { createContext, useContext } from 'react';

/** ponytail: Single-locale provider — English only. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return (
    <LanguageContext.Provider value={{ locale: 'en', setLocale: () => {} }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext) ?? { locale: 'en', setLocale: () => {} };
}

const LanguageContext = createContext<{ locale: string; setLocale: (l: string) => void } | null>(null);
