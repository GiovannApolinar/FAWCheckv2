'use client';

import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import { useTheme } from '@/hooks/useTheme';
import { useLocale } from '@/hooks/useLocale';

export default function SettingsPage() {
  const { mounted, theme, setTheme } = useTheme();
  const { locale, setLocale, t, mounted: localeMounted } = useLocale();
  const darkModeEnabled = mounted ? theme === 'dark' : false;
  const filipinoEnabled = localeMounted ? locale === 'tl' : false;

  return (
    <main className="px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="app-panel rounded-[2rem] p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#13800f]">{t('settings_label')}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[color:var(--foreground)] md:text-5xl">
            {t('settings_heading')}
          </h1>
          <p className="mt-5 max-w-3xl leading-7 text-[color:var(--muted)]">
            {t('settings_description')}
          </p>
        </section>

        <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('settings_appearance_heading')}</h2>
              <p className="mt-3 max-w-2xl leading-7 text-[color:var(--muted)]">
                {t('settings_appearance_description')}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={darkModeEnabled}
              onClick={() => setTheme(darkModeEnabled ? 'light' : 'dark')}
              className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 transition ${
                darkModeEnabled
                  ? 'border-[#13800f] bg-[#13800f] text-white'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)]'
              }`}
            >
              <span
                className={`inline-block h-7 w-12 rounded-full border border-current/20 p-1 ${
                  darkModeEnabled ? 'bg-white/20' : 'bg-white/70'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    darkModeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </span>
              <span className="font-semibold">{darkModeEnabled ? t('settings_dark_mode_on') : t('settings_dark_mode_off')}</span>
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                theme === 'light'
                  ? 'border-[#13800f] bg-[#13800f]/10 text-[#13800f]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:bg-[color:var(--hover)]'
              }`}
            >
              <span className="block text-sm font-semibold uppercase tracking-[0.18em]">{t('settings_theme_light')}</span>
              <span className="mt-2 block text-sm text-[color:var(--muted)]">{t('settings_theme_light_desc')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                theme === 'dark'
                  ? 'border-[#13800f] bg-[#13800f]/10 text-[#13800f]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:bg-[color:var(--hover)]'
              }`}
            >
              <span className="block text-sm font-semibold uppercase tracking-[0.18em]">{t('settings_theme_dark')}</span>
              <span className="mt-2 block text-sm text-[color:var(--muted)]">{t('settings_theme_dark_desc')}</span>
            </button>
          </div>
        </section>

        <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('settings_language_heading')}</h2>
              <p className="mt-3 max-w-2xl leading-7 text-[color:var(--muted)]">
                {t('settings_language_description')}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={filipinoEnabled}
              onClick={() => setLocale(filipinoEnabled ? 'en' : 'tl')}
              className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 transition ${
                filipinoEnabled
                  ? 'border-[#13800f] bg-[#13800f] text-white'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)]'
              }`}
            >
              <span
                className={`inline-block h-7 w-12 rounded-full border border-current/20 p-1 ${
                  filipinoEnabled ? 'bg-white/20' : 'bg-white/70'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    filipinoEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </span>
              <span className="font-semibold">{filipinoEnabled ? t('settings_language_tl_on') : t('settings_language_en_on')}</span>
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                locale === 'en'
                  ? 'border-[#13800f] bg-[#13800f]/10 text-[#13800f]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:bg-[color:var(--hover)]'
              }`}
            >
              <span className="block text-sm font-semibold uppercase tracking-[0.18em]">{t('settings_language_en')}</span>
              <span className="mt-2 block text-sm text-[color:var(--muted)]">{t('settings_language_en_desc')}</span>
            </button>

            <button
              type="button"
              onClick={() => setLocale('tl')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                locale === 'tl'
                  ? 'border-[#13800f] bg-[#13800f]/10 text-[#13800f]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:bg-[color:var(--hover)]'
              }`}
            >
              <span className="block text-sm font-semibold uppercase tracking-[0.18em]">{t('settings_language_tl')}</span>
              <span className="mt-2 block text-sm text-[color:var(--muted)]">{t('settings_language_tl_desc')}</span>
            </button>
          </div>
        </section>

        <PwaInstallPrompt />
      </div>
    </main>
  );
}
