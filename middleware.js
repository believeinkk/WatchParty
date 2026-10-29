import { NextResponse } from 'next/server';

export function middleware(request) {
  const token =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (request.nextUrl.pathname.startsWith('/create-room') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', '/');
    loginUrl.searchParams.set('action', 'create_room');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/create-room/:path*'],
};
