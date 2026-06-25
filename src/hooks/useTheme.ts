'use client';

import { useEffect, useState } from 'react';
import {
  AppTheme,
  THEME_STORAGE_KEY,
  applyTheme,
  isAppTheme,
  persistTheme,
  resolveTheme,
} from '@/lib/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const currentTheme = resolveTheme();
    applyTheme(currentTheme);
    setThemeState(currentTheme);
    setMounted(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = isAppTheme(event.newValue) ? event.newValue : resolveTheme();
      applyTheme(nextTheme);
      setThemeState(nextTheme);
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = (nextTheme: AppTheme) => {
    persistTheme(nextTheme);
    setThemeState(nextTheme);
  };

  return {
    theme,
    setTheme,
    mounted,
  };
}
