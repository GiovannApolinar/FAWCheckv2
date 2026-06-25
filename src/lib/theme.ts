export const THEME_STORAGE_KEY = 'fawcheck-theme';

export type AppTheme = 'light' | 'dark';

export const THEME_COLORS: Record<AppTheme, string> = {
  light: '#f6f1e4',
  dark: '#0f1714',
};

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === 'light' || value === 'dark';
}

export function getStoredTheme(): AppTheme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(stored) ? stored : null;
}

export function getSystemTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(): AppTheme {
  return getStoredTheme() ?? 'light';
}

function updateThemeColor(theme: AppTheme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', THEME_COLORS[theme]);
  }
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  updateThemeColor(theme);
}

export function persistTheme(theme: AppTheme): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  applyTheme(theme);
}

export const themeInitScript = `(() => {
  try {
    const storageKey = '${THEME_STORAGE_KEY}';
    const stored = window.localStorage.getItem(storageKey);
    const theme = stored === 'light' || stored === 'dark' ? stored : 'light';
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '${THEME_COLORS.dark}' : '${THEME_COLORS.light}');
    }
  } catch (error) {
    // Ignore theme boot errors and keep the default theme.
  }
})();`;
