'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { clearAuthToken, hasValidStoredAuthToken } from '@/lib/auth';
import { deleteProfileAccount, getProfile, ProfileSummary, updateProfile } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(): Promise<void> {
      try {
        const nextProfile = await getProfile();
        if (!mounted) {
          return;
        }

        setProfile(nextProfile);
        setName(nextProfile.name);
        setSection(nextProfile.section);
      } catch (error) {
        if (!mounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load your profile.';
        if (message === 'Unauthorized') {
          router.replace('/auth?next=/profile');
          return;
        }

        toast.error(message);
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    if (!hasValidStoredAuthToken()) {
      router.replace('/auth?next=/profile');
      return () => {
        mounted = false;
      };
    }

    setCheckingAccess(false);
    void loadProfile();

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

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!navigator.onLine) {
      toast.error('Profile updates are available once you are back online.');
      return;
    }

    const normalizedName = name.trim();

    if (!normalizedName) {
      toast.error('Enter your name before saving.');
      return;
    }

    setSavingProfile(true);

    try {
      const updatedProfile = await updateProfile({
        name: normalizedName,
        section,
      });
      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setSection(updatedProfile.section);
      toast.success('Profile updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update your profile.';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!navigator.onLine) {
      toast.error('Account deletion is available once you are back online.');
      return;
    }

    if (!profile?.canDeleteAccount) {
      toast.error('Admin accounts cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(
      'Delete your account permanently? This will remove your saved assessments and cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);

    try {
      await deleteProfileAccount();
      await clearAuthToken();
      toast.success('Your account has been deleted.');
      router.replace('/auth');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete your account.';
      toast.error(message);
      setDeletingAccount(false);
    }
  };

  if (checkingAccess) {
    return (
      <main className="flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center p-6 text-[color:var(--foreground)]">
        Checking profile access...
      </main>
    );
  }

  return (
    <main className="px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="app-panel rounded-[2rem] p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#13800f]">Profile</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[color:var(--foreground)] md:text-5xl">
            Manage your account
          </h1>
          <p className="mt-5 max-w-3xl leading-7 text-[color:var(--muted)]">
            Update the name and section shown for your account and review whether this account can be deleted.
          </p>
        </section>

        {loadingProfile ? (
          <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="text-sm text-[color:var(--muted)]">Loading your profile...</p>
          </section>
        ) : !profile ? (
          <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="text-sm text-[color:var(--muted)]">
              {isOnline
                ? 'Your profile could not be loaded right now.'
                : 'Profile management is available once you are back online.'}
            </p>
          </section>
        ) : (
          <>
            <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Email</p>
                  <p className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">{profile.email}</p>
                </div>

                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Role</p>
                  <p className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">{profile.role}</p>
                </div>
              </div>
            </section>

            <section className="app-solid-panel rounded-[1.75rem] p-6 md:p-8">
              <div className="max-w-4xl">
                <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Profile details</h2>
                <p className="mt-3 leading-7 text-[color:var(--muted)]">
                  Keep your account name and section up to date so it is easier to identify who is using the app.
                </p>

                <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="profile-name" className="block text-sm font-medium text-[color:var(--foreground)]">
                        Display name
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        maxLength={120}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Enter your name"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#13800f] focus:ring-2 focus:ring-[#13800f]/15"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="profile-section" className="block text-sm font-medium text-[color:var(--foreground)]">
                        Section
                      </label>
                      <input
                        id="profile-section"
                        type="text"
                        maxLength={120}
                        value={section}
                        onChange={(event) => setSection(event.target.value)}
                        placeholder="Enter your section"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#13800f] focus:ring-2 focus:ring-[#13800f]/15"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile || !isOnline}
                    className={`rounded-full px-6 py-3 font-semibold text-white transition ${
                      savingProfile || !isOnline ? 'cursor-not-allowed bg-neutral-400' : 'bg-[#13800f] hover:bg-[#0f670c]'
                    }`}
                  >
                    {savingProfile ? 'Saving...' : 'Save profile'}
                  </button>
                </form>
              </div>
            </section>

            <section className="app-solid-panel rounded-[1.75rem] border border-[#b42318]/15 p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Delete account</h2>
                  <p className="mt-3 leading-7 text-[color:var(--muted)]">
                    Deleting your account permanently removes your access and your saved assessment records.
                  </p>
                  {!profile.canDeleteAccount && (
                    <p className="mt-3 text-sm font-medium text-[#b42318]">
                      This account is protected because it has administrator access.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || !profile.canDeleteAccount || !isOnline}
                  className={`rounded-full px-6 py-3 font-semibold text-white transition ${
                    deletingAccount || !profile.canDeleteAccount || !isOnline
                      ? 'cursor-not-allowed bg-neutral-400'
                      : 'bg-[#b42318] hover:bg-[#912018]'
                  }`}
                >
                  {deletingAccount ? 'Deleting...' : 'Delete account'}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
