'use client';

import { useEffect, useState } from 'react';
import en from '@/locales/en';
import tl from '@/locales/tl';
import {
  type Locale,
  type TranslationFn,
  LOCALE_STORAGE_KEY,
  applyLocale,
  isLocale,
  persistLocale,
  resolveLocale,
} from '@/lib/locale';

const dictionaries = { en, tl };

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const currentLocale = resolveLocale();
    applyLocale(currentLocale);
    setLocaleState(currentLocale);
    setMounted(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY) {
        return;
      }

      const nextLocale = isLocale(event.newValue) ? event.newValue : resolveLocale();
      applyLocale(nextLocale);
      setLocaleState(nextLocale);
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setLocale = (nextLocale: Locale) => {
    persistLocale(nextLocale);
    setLocaleState(nextLocale);
  };

  const t: TranslationFn = (key) => dictionaries[locale][key];

  return {
    locale,
    setLocale,
    t,
    mounted,
  };
}
