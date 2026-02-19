'use client';

import { createContext, useContext, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { getStoredLocale, setStoredLocale } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (typeof window !== 'undefined' ? getStoredLocale() : 'tr'));

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: 'tr',
      setLocale: () => {},
    };
  }
  return ctx;
}
