import { NextResponse, type NextRequest } from 'next/server';
import { getTokenRole, isTokenExpired } from '@/lib/jwt';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (token && !isTokenExpired(token)) {
    if (request.nextUrl.pathname.startsWith('/admin') && getTokenRole(token) !== 'Admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/auth';
  redirectUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const response = NextResponse.redirect(redirectUrl);
  if (token) {
    response.cookies.delete('token');
  }

  return response;
}

export const config = {
  matcher: ['/', '/assessment/:path*', '/saved/:path*', '/result/:path*', '/admin/:path*', '/profile/:path*', '/about/:path*', '/settings/:path*'],
};
