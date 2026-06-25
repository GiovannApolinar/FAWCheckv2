import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'token';
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({ token: '' }))) as { token?: string };
  const token = typeof body.token === 'string' ? body.token : '';

  const response = NextResponse.json({
    message: token ? 'Token set' : 'Token cleared',
  });

  if (token) {
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: TOKEN_MAX_AGE_SECONDS,
    });
  } else {
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}
