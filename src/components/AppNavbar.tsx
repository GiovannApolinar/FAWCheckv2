'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { clearAuthToken, getActiveAuthRole } from '@/lib/auth';

type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

const navItems: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/assessment', label: 'Assessment' },
  { href: '/saved', label: 'Records' },
  { href: '/admin', label: 'Validate', adminOnly: true },
  { href: '/profile', label: 'Profile' },
  { href: '/about', label: 'About' },
  { href: '/settings', label: 'Settings' },
] as const;

function getNavLinkClasses(isActive: boolean): string {
  return [
    'text-[0.95rem] font-medium text-[#13800f] decoration-2 underline-offset-[8px] transition hover:underline',
    isActive ? 'underline' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const { canPrompt, isInstalling, platform, promptInstall, status } = usePwaInstall();

  useEffect(() => {
    setRole(getActiveAuthRole());
  }, [pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowInstallHint(false);
  }, [pathname]);

  const visibleItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || role === 'Admin'),
    [role],
  );

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);

    try {
      await clearAuthToken();
    } finally {
      router.replace('/auth');
      router.refresh();
    }
  };

  const showMobileInstallButton = status === 'prompt' || status === 'ios' || status === 'android';
  const installButtonLabel =
    status === 'prompt' ? (isInstalling ? 'Installing...' : 'Install') : platform === 'ios' ? 'How to add' : 'How to install';

  const handleMobileInstall = async () => {
    if (status === 'prompt' && canPrompt) {
      setShowInstallHint(false);
      await promptInstall();
      return;
    }

    setShowInstallHint((current) => !current);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] shadow-[0_12px_28px_rgba(18,49,38,0.08)] backdrop-blur">
      <div className="mx-auto flex h-[var(--app-navbar-height)] w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="md:hidden">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[#13800f]">FAWCheck</span>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex lg:gap-10">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className={getNavLinkClasses(isActive)}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 justify-end md:flex">
          <button type="button" onClick={handleLogout} className={getNavLinkClasses(false)}>
            Logout
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {showMobileInstallButton && (
            <button
              type="button"
              onClick={() => void handleMobileInstall()}
              disabled={status === 'prompt' && isInstalling}
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                status === 'prompt' && isInstalling
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {installButtonLabel}
            </button>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[#13800f] transition hover:bg-[color:var(--hover)]"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>
      </div>

      {showInstallHint && (status === 'ios' || status === 'android') && (
        <div className="border-t border-[color:var(--border)] bg-[color:var(--surface-strong)] md:hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
            <p className="rounded-2xl bg-[color:var(--surface)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]">
              {status === 'ios' ? (
                <>
                  Use the browser share menu, then choose <span className="font-semibold">Add to Home Screen</span>.
                </>
              ) : (
                <>
                  Open the browser menu and choose <span className="font-semibold">Install app</span>. If that option
                  is missing, use <span className="font-semibold">Add to Home screen</span>.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="border-t border-[color:var(--border)] bg-[color:var(--surface-strong)] md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[color:var(--hover)] text-[#13800f] underline decoration-2 underline-offset-[6px]'
                      : 'text-[color:var(--foreground)] hover:bg-[color:var(--hover)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-2xl border border-[color:var(--border)] px-4 py-3 text-left text-sm font-medium text-[#13800f] transition hover:bg-[color:var(--hover)]"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
