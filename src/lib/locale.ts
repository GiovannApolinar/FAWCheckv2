export const LOCALE_STORAGE_KEY = 'fawcheck-locale';

export type Locale = 'en' | 'tl';

export type Translations = {
  // Settings — page header
  settings_label: string;
  settings_heading: string;
  settings_description: string;

  // Settings — Appearance section
  settings_appearance_heading: string;
  settings_appearance_description: string;
  settings_dark_mode_on: string;
  settings_dark_mode_off: string;
  settings_theme_light: string;
  settings_theme_light_desc: string;
  settings_theme_dark: string;
  settings_theme_dark_desc: string;

  // Settings — Language section
  settings_language_heading: string;
  settings_language_description: string;
  settings_language_en_on: string;
  settings_language_tl_on: string;
  settings_language_en: string;
  settings_language_en_desc: string;
  settings_language_tl: string;
  settings_language_tl_desc: string;
};

export type TranslationFn = (key: keyof Translations) => string;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'tl';
}

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : null;
}

export function resolveLocale(): Locale {
  return getStoredLocale() ?? 'en';
}

export function applyLocale(locale: Locale): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.locale = locale;
  root.lang = locale;
}

export function persistLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }

  applyLocale(locale);
}

export const localeInitScript = `(() => {
  try {
    const stored = window.localStorage.getItem('${LOCALE_STORAGE_KEY}');
    const locale = stored === 'en' || stored === 'tl' ? stored : 'en';
    const root = document.documentElement;
    root.dataset.locale = locale;
    root.lang = locale;
  } catch (e) {
    // Ignore locale boot errors and keep the default locale.
  }
})();`;
