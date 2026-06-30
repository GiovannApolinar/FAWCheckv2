'use client';

import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useLocale } from '@/hooks/useLocale';

export default function PwaInstallPrompt() {
  const { canPrompt, isInstalling, platform, promptInstall, status } = usePwaInstall();
  const { t } = useLocale();

  if (status === 'installed') {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('pwa_installed_heading')}</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          {t('pwa_installed_desc')}
        </p>
      </section>
    );
  }

  if (status === 'prompt' && canPrompt) {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('pwa_prompt_heading')}</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          {t('pwa_prompt_desc')}
        </p>

        <button
          type="button"
          disabled={isInstalling}
          onClick={() => void promptInstall()}
          className={`mt-5 rounded-full px-5 py-3 font-semibold text-white transition ${
            isInstalling ? 'cursor-not-allowed bg-gray-400' : 'bg-green-700 hover:bg-green-800'
          }`}
        >
          {isInstalling ? t('pwa_prompt_btn_installing') : t('pwa_prompt_btn')}
        </button>
      </section>
    );
  }

  if (status === 'ios') {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('pwa_ios_heading')}</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          {t('pwa_ios_desc1')}
        </p>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          {t('pwa_ios_desc2_pre')}<span className="font-semibold">{t('pwa_ios_desc2_action')}</span>{t('pwa_ios_desc2_post')}
        </p>
      </section>
    );
  }

  if (status === 'android') {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('pwa_android_heading')}</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          {t('pwa_android_desc1')}
        </p>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          {t('pwa_android_desc2_pre')}<span className="font-semibold">{t('pwa_android_desc2_action1')}</span>{t('pwa_android_desc2_mid')}<span className="font-semibold">{t('pwa_android_desc2_action2')}</span>{t('pwa_android_desc2_post')}
        </p>
      </section>
    );
  }

  return (
    <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('pwa_prompt_heading')}</h2>
      <p className="mt-3 leading-7 text-[color:var(--muted)]">
        {platform === 'other' ? t('pwa_other_desc') : t('pwa_generic_desc')}
      </p>
    </section>
  );
}
