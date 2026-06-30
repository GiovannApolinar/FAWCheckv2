'use client';

import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getPartnerLogos } from '@/content/project';
import { hasValidStoredAuthToken, persistAuthToken } from '@/lib/auth';
import { getApiBaseUrl, PendingAuthResponse } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
// import { syncQueuedAssessments } from '@/lib/offlineQueue';

interface AuthSuccessResponse {
  token?: string;
}

interface ParsedResponse {
  json: Record<string, unknown> | null;
  text: string;
}

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json') || !text) {
    return { json: null, text };
  }

  try {
    return {
      json: (JSON.parse(text) as Record<string, unknown>) ?? null,
      text,
    };
  } catch {
    return { json: null, text };
  }
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const { locale, setLocale, t } = useLocale();

  const nextPath = useMemo(() => {
    const next = searchParams?.get('next');
    if (!next || !next.startsWith('/')) {
      return '/';
    }

    return next;
  }, [searchParams]);

  useEffect(() => {
    const requestedMode = searchParams?.get('mode');
    if (requestedMode === 'signup') {
      setIsLogin(false);
      return;
    }

    if (requestedMode === 'signin') {
      setIsLogin(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasValidStoredAuthToken()) {
      router.replace(nextPath);
      return;
    }

    setCheckingSession(false);
  }, [nextPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(
        `${apiBaseUrl}${isLogin ? '/api/auth/login' : '/api/auth/register'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
          cache: 'no-store',
        },
      );

      const payload = await parseResponse(response);
      const pendingPayload = payload.json as PendingAuthResponse | null;
      if (!response.ok) {
        throw new Error(pendingPayload?.message || payload.text || 'Authentication failed.');
      }

      if (!isLogin) {
        setPassword('');
        setIsLogin(true);
        toast.success(pendingPayload?.message || t('toast_signup_sent'));
        return;
      }

      const data = payload.json as AuthSuccessResponse | null;
      if (!data?.token) {
        throw new Error('No token received from the server.');
      }

      await persistAuthToken(data.token);
      // Offline queued sync after login is disabled until queued sync is fixed.
      // await syncQueuedAssessments().catch(() => undefined);

      toast.success(t('toast_login_success'));
      router.replace(nextPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setPassword('');
    setIsLogin((current) => !current);
  };

  const handleForgotPassword = () => {
    toast(t('toast_forgot_password'));
  };

  const heading = isLogin ? t('auth_login_heading') : t('auth_signup_heading');
  const helperText = isLogin ? t('auth_login_helper') : t('auth_signup_helper');
  const submitLabel = submitting ? t('auth_submit_submitting') : isLogin ? t('auth_submit_login') : t('auth_submit_signup');
  const toggleLabel = isLogin ? t('auth_toggle_signup_label') : t('auth_toggle_login_label');
  const togglePrompt = isLogin ? t('auth_toggle_to_signup') : t('auth_toggle_to_login');

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6 text-green-800">
        {t('auth_checking_session')}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="min-h-screen overflow-hidden bg-white">
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_8px_minmax(420px,0.85fr)]">
            <div className="flex flex-col justify-between px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-14 lg:py-14">
              <div className="flex flex-1 flex-col items-center justify-center gap-8 lg:gap-10">
                <Image
                  src="/icons/FAWCheck_logo.svg"
                  alt="FAWCheck logo"
                  width={430}
                  height={430}
                  priority
                  className="h-auto w-full max-w-[330px] sm:max-w-[380px] lg:max-w-[430px]"
                />

                <p className="max-w-[32rem] text-[1.9rem] font-bold leading-[1.08] text-[#13800f] sm:text-[2.25rem]">
                  {t('auth_marketing_tagline')}
                </p>
              </div>

              <div className="mt-10 flex flex-col items-center gap-8">
                <p className="max-w-[40rem] text-base leading-[1.3] text-[#5f5f5f] sm:text-[1.1rem]">
                  {t('auth_partner_message')}
                </p>

                <div className="flex flex-wrap items-end justify-center gap-7 sm:gap-10">
                  {getPartnerLogos(t).map((logo) => (
                    <Image
                      key={logo.src}
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.width}
                      height={logo.height}
                      className="h-auto object-contain"
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-400">
                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    className={`transition ${locale === 'en' ? 'font-semibold text-[#13800f]' : 'hover:text-neutral-600'}`}
                  >
                    English
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setLocale('tl')}
                    className={`transition ${locale === 'tl' ? 'font-semibold text-[#13800f]' : 'hover:text-neutral-600'}`}
                  >
                    Filipino
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-6 h-[6px] rounded-full bg-[#13800f] lg:mx-0 lg:h-full lg:w-[8px] lg:rounded-none" />

            <div className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
              <div className="w-full max-w-[360px]">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight text-[#13800f] sm:text-[2.55rem]">{heading}</h1>
                  <p className="mt-3 max-w-[22rem] text-sm leading-6 text-neutral-600">{helperText}</p>
                </div>

                <div className="rounded-md border border-neutral-200 bg-white px-4 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:px-5 sm:py-6">
                  <form onSubmit={handleSubmit} className="auth-form space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                        {t('auth_email_label')}
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder={t('auth_email_placeholder')}
                        autoComplete="email"
                        className="w-full rounded-md border border-neutral-300 px-4 py-3 text-neutral-900 outline-none transition focus:border-[#13800f] focus:ring-2 focus:ring-[#13800f]/15"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                        {t('auth_password_label')}
                      </label>
                      <input
                        id="password"
                        type="password"
                        placeholder={isLogin ? t('auth_password_placeholder_login') : t('auth_password_placeholder_signup')}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        className="w-full rounded-md border border-neutral-300 px-4 py-3 text-neutral-900 outline-none transition focus:border-[#13800f] focus:ring-2 focus:ring-[#13800f]/15"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full rounded-md px-4 py-3 text-sm font-semibold text-white transition ${
                        submitting ? 'cursor-not-allowed bg-neutral-400' : 'bg-[#13800f] hover:bg-[#0f670c]'
                      }`}
                    >
                      {submitLabel}
                    </button>

                    {isLogin ? (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-sm text-neutral-600 underline decoration-neutral-400 underline-offset-4 transition hover:text-[#13800f]"
                      >
                        {t('auth_forgot_password')}
                      </button>
                    ) : (
                      <p className="text-xs leading-5 text-neutral-500">
                        {t('auth_signup_pending_note')}
                      </p>
                    )}
                  </form>
                </div>

                <p className="mt-5 text-sm text-neutral-600">
                  {togglePrompt}{' '}
                  <button
                    type="button"
                    className="font-semibold text-[#13800f] underline decoration-[#13800f]/30 underline-offset-4 transition hover:text-[#0f670c]"
                    onClick={toggleAuthMode}
                  >
                    {toggleLabel}
                  </button>
                </p>
              </div>
            </div>
        </div>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white p-6 text-green-800">
          Checking your session...
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
