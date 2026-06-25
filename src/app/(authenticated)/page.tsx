'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import { getActiveAuthRole, hasValidStoredAuthToken } from '@/lib/auth';
// import { countQueuedAssessments, syncQueuedAssessments } from '@/lib/offlineQueue';

export default function Home() {
  const router = useRouter();
  // const [pendingCount, setPendingCount] = useState(0);
  // const [syncing, setSyncing] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Offline sync is disabled until queued assessments are reliable.
  // const refreshPendingCount = useCallback(async () => {
  //   try {
  //     const count = await countQueuedAssessments();
  //     setPendingCount(count);
  //   } catch {
  //     setPendingCount(0);
  //   }
  // }, []);

  useEffect(() => {
    let mounted = true;

    async function loadHome(): Promise<void> {
      try {
        if (!hasValidStoredAuthToken()) {
          router.replace('/auth');
          return;
        }

        setIsAdmin(getActiveAuthRole() === 'Admin');
      } catch {
        if (mounted) {
          router.replace('/auth');
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    void loadHome();

    return () => {
      mounted = false;
    };
  }, [router]);

  // const handleSyncPending = async () => {
  //   setSyncing(true);
  //   try {
  //     const summary = await syncQueuedAssessments();
  //     if (summary.synced > 0) {
  //       toast.success(`Synced ${summary.synced} queued record(s).`);
  //     } else if (summary.failed > 0) {
  //       toast.error(summary.errors[0] ?? 'Failed to sync queued records.');
  //     } else {
  //       toast('No queued records.');
  //     }
  //     await refreshPendingCount();
  //   } finally {
  //     setSyncing(false);
  //   }
  // };

  if (checkingAuth) {
    return (
      <main className="flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center p-6 text-[color:var(--foreground)]">
        Checking authentication...
      </main>
    );
  }

  return (
    <main
      className="relative min-h-[calc(100vh_-_var(--app-navbar-height))] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/cornfield.jpg')" }}
    >
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh_-_var(--app-navbar-height)_-_1rem)] w-full max-w-6xl gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <section className="glass-panel hero-shadow rounded-[2rem] p-8 text-left md:p-10">
          <h1 className="max-w-3xl text-5xl font-bold leading-tight text-[color:var(--foreground)] md:text-6xl">
            Welcome to FAWCheck.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--muted)] md:text-lg">
            developed for Institute of Plant Breeding- Entomology Laboratory. Record observations on site and save them
            securely to your FAWCheck account.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => router.replace('/assessment')}
              className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-800"
            >
              Start New Assessment
            </button>

            <button
              onClick={() => router.push('/saved')}
              className="rounded-full bg-amber-500 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-amber-600"
            >
              View Saved Records
            </button>

            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="rounded-full bg-white px-6 py-3 font-semibold text-green-800 shadow-md transition hover:bg-green-50"
              >
                Review Sign-Ups
              </button>
            )}
          </div>
        </section>

        <section className="space-y-4">
          {/* Offline sync status panel disabled until queued sync is fixed. */}

          <PwaInstallPrompt />
        </section>
      </div>
    </main>
  );
}
