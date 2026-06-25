'use client';

import { usePwaInstall } from '@/hooks/usePwaInstall';

export default function PwaInstallPrompt() {
  const { canPrompt, isInstalling, platform, promptInstall, status } = usePwaInstall();

  if (status === 'installed') {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Install FAWCheck</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          FAWCheck is already installed on this device. Open it from the home screen or app list whenever you need it
          in the field.
        </p>
      </section>
    );
  }

  if (status === 'prompt' && canPrompt) {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Install FAWCheck</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          Save FAWCheck to this device so it is easier to launch during field visits and repeated assessments.
        </p>

        <button
          type="button"
          disabled={isInstalling}
          onClick={() => void promptInstall()}
          className={`mt-5 rounded-full px-5 py-3 font-semibold text-white transition ${
            isInstalling ? 'cursor-not-allowed bg-gray-400' : 'bg-green-700 hover:bg-green-800'
          }`}
        >
          {isInstalling ? 'Opening install prompt...' : 'Install App'}
        </button>
      </section>
    );
  }

  if (status === 'ios') {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Add FAWCheck to Home Screen</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          iPhone and iPad installation happens through the browser share menu instead of a separate pop-up prompt.
        </p>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          Tap <span className="font-semibold">Add to Home Screen</span> to keep FAWCheck one tap away in the field.
        </p>
      </section>
    );
  }

  if (status === 'android') {
    return (
      <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Install FAWCheck</h2>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          This browser is not showing a direct install prompt yet.
        </p>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          Open the browser menu and choose <span className="font-semibold">Install app</span>. If the browser only
          offers <span className="font-semibold">Add to Home screen</span>, that option will still pin FAWCheck like
          an app launcher.
        </p>
      </section>
    );
  }

  return (
    <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Install FAWCheck</h2>
      <p className="mt-3 leading-7 text-[color:var(--muted)]">
        {platform === 'other'
          ? 'This browser is not exposing a supported install flow right now. If you need a mobile install prompt, open FAWCheck in a current Chromium-based browser on Android or use Add to Home Screen on iPhone or iPad.'
          : 'This browser is not showing an install prompt right now. If installation is supported, the browser will expose the option automatically when it becomes available.'}
      </p>
    </section>
  );
}
