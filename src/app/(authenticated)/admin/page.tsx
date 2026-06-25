'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getActiveAuthRole, hasValidStoredAuthToken } from '@/lib/auth';
import { approvePendingUser, listPendingUsers, PendingUserSummary } from '@/lib/api';

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export default function AdminPage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUserSummary[]>([]);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPendingUsers(): Promise<void> {
      try {
        const users = await listPendingUsers();
        if (mounted) {
          setPendingUsers(users);
        }
      } catch (error) {
        if (mounted) {
          const message = error instanceof Error ? error.message : 'Failed to load pending users.';
          toast.error(message);
        }
      } finally {
        if (mounted) {
          setLoadingUsers(false);
        }
      }
    }

    if (!hasValidStoredAuthToken()) {
      router.replace('/auth?next=/admin');
      return () => {
        mounted = false;
      };
    }

    if (getActiveAuthRole() !== 'Admin') {
      router.replace('/');
      return () => {
        mounted = false;
      };
    }

    setCheckingAccess(false);
    void loadPendingUsers();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);

    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  const handleApprove = async (userId: string) => {
    if (!navigator.onLine) {
      toast.error('User approval is available once you are back online.');
      return;
    }

    setApprovingUserId(userId);

    try {
      const approved = await approvePendingUser(userId);
      setPendingUsers((current) => current.filter((user) => user.userId !== userId));
      toast.success(`Approved ${approved.email}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve user.';
      toast.error(message);
    } finally {
      setApprovingUserId(null);
    }
  };

  if (checkingAccess) {
    return (
      <main className="flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center p-6 text-[color:var(--foreground)]">
        Checking admin access...
      </main>
    );
  }

  return (
    <main
      className="relative min-h-[calc(100vh_-_var(--app-navbar-height))] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/cornfield.jpg')" }}
    >
      <div className="mx-auto w-full max-w-6xl p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-950">Admin review</p>
          <h1 className="mt-2 text-3xl font-bold text-green-950">Pending user approvals</h1>
        </div>
      </div>

      <section className="mx-auto w-full max-w-6xl p-6 pt-0">
        <div className="glass-panel hero-shadow rounded-[2rem] p-8 text-[color:var(--foreground)]">
          <p className="max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Approve sign-up requests here to let new users log in and start submitting assessments.
          </p>

          {loadingUsers ? (
            <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 text-sm text-[color:var(--foreground)]">
              {isOnline ? 'Loading pending sign-ups...' : 'Admin validation is available once you are back online.'}
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 text-sm text-[color:var(--foreground)]">
              No pending sign-up requests right now.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pendingUsers.map((user) => {
                const isApproving = approvingUserId === user.userId;

                return (
                  <article
                    key={user.userId}
                    className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-lg font-semibold text-[color:var(--foreground)]">{user.email}</p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        Requested access on {formatDate(user.registeredAtUtc)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleApprove(user.userId)}
                      disabled={isApproving || !isOnline}
                      className={`rounded-full px-5 py-2 font-semibold text-white transition ${
                        isApproving || !isOnline ? 'cursor-not-allowed bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {isApproving ? 'Approving...' : 'Approve'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
