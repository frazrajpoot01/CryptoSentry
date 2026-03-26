import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ✅ ADDED 'search' to grab any URL parameters (like ?onboarded=true)
  const { pathname, search } = request.nextUrl;

  // Redirect authenticated users away from /login
  if (pathname === '/login' && token) {
    const url = new URL('/', request.url);
    url.search = search; // ✅ PRESERVE THE PARAMETERS
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to /login for protected routes
  if (pathname !== '/login' && !token) {
    const url = new URL('/login', request.url);
    url.search = search; // ✅ PRESERVE THE PARAMETERS
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};