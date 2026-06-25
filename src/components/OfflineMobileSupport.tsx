'use client';

import { useEffect } from 'react';

export default function OfflineMobileSupport() {
  // Offline route warming and background queue syncing are disabled for now.
  // The previous implementation listened for online/focus events and called
  // syncQueuedAssessments(), which is parked until queued sync is reliable.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
    }

    if ('caches' in window) {
      void caches.keys().then((keys) => {
        void Promise.all(keys.map((key) => caches.delete(key)));
      });
    }
  }, []);

  return null;
}
