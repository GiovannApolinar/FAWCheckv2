'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PwaInstallContextValue = {
  platform: PwaInstallPlatform;
  status: PwaInstallStatus;
  canPrompt: boolean;
  isInstalling: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function isIosDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return /android/i.test(window.navigator.userAgent);
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type PwaInstallStatus = 'installed' | 'prompt' | 'ios' | 'android' | 'unsupported';
export type PwaInstallPlatform = 'ios' | 'android' | 'other';

export function PwaInstallProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const iosMode = useMemo(() => isIosDevice(), []);
  const androidMode = useMemo(() => isAndroidDevice(), []);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const platform: PwaInstallPlatform = iosMode ? 'ios' : androidMode ? 'android' : 'other';

  useEffect(() => {
    setIsStandalone(isStandaloneMode());
    const displayModeMedia = window.matchMedia('(display-mode: standalone)');

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      setIsStandalone(true);
    };

    const handleDisplayModeChange = () => {
      setIsStandalone(isStandaloneMode());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    if (typeof displayModeMedia.addEventListener === 'function') {
      displayModeMedia.addEventListener('change', handleDisplayModeChange);
    } else {
      displayModeMedia.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      if (typeof displayModeMedia.removeEventListener === 'function') {
        displayModeMedia.removeEventListener('change', handleDisplayModeChange);
      } else {
        displayModeMedia.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const status: PwaInstallStatus =
    isStandalone || isInstalled
      ? 'installed'
      : installEvent
        ? 'prompt'
        : iosMode
          ? 'ios'
          : androidMode
            ? 'android'
            : 'unsupported';

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!installEvent) {
      return 'unavailable';
    }

    setIsInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }

      return choice.outcome;
    } finally {
      setInstallEvent(null);
      setIsInstalling(false);
    }
  };

  const value: PwaInstallContextValue = {
    platform,
    status,
    canPrompt: Boolean(installEvent),
    isInstalling,
    promptInstall,
  };

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);

  if (!context) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider.');
  }

  return context;
}
