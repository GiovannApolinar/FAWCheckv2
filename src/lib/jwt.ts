const ROLE_CLAIM_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

interface JwtPayload {
  exp?: number;
  role?: string;
  [ROLE_CLAIM_URI]?: string;
}

function decodeBase64(value: string): string {
  if (typeof atob === 'function') {
    return atob(value);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf-8');
  }

  throw new Error('Base64 decoding is not available in this runtime.');
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return decodeBase64(padded);
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): number | null {
  const payload = parseJwtPayload(token);
  return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry <= Date.now();
}

export function getTokenRole(token: string): string | null {
  const payload = parseJwtPayload(token);
  return payload?.role ?? payload?.[ROLE_CLAIM_URI] ?? null;
}
