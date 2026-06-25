import { getTokenRole, isTokenExpired } from '@/lib/jwt';

const TOKEN_STORAGE_KEY = 'token';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getStoredAuthToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getActiveAuthToken(): string | null {
  const token = getStoredAuthToken();
  if (!token || isTokenExpired(token)) {
    return null;
  }

  return token;
}

export function hasValidStoredAuthToken(): boolean {
  return getActiveAuthToken() !== null;
}

export function getStoredAuthRole(): string | null {
  const token = getStoredAuthToken();
  return token ? getTokenRole(token) : null;
}

export function getActiveAuthRole(): string | null {
  const token = getActiveAuthToken();
  return token ? getTokenRole(token) : null;
}

async function syncTokenCookie(token: string): Promise<void> {
  await fetch('/api/set-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });
}

export async function persistAuthToken(token: string): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  await syncTokenCookie(token);
}

export async function clearAuthToken(): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  await syncTokenCookie('');
}
