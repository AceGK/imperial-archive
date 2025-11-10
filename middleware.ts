import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set your password here or use an environment variable
const SITE_PASSWORD = process.env.SITE_PASSWORD || 'your-secret-password';
const COOKIE_NAME = 'site-access';
const COOKIE_VALUE = 'granted';

export function middleware(request: NextRequest) {
  // Check if user has the access cookie
  const accessCookie = request.cookies.get(COOKIE_NAME);
  
  // If cookie exists and matches, allow access
  if (accessCookie?.value === COOKIE_VALUE) {
    return NextResponse.next();
  }

  // If trying to access the password page, allow it
  if (request.nextUrl.pathname === '/password') {
    return NextResponse.next();
  }

  // If trying to verify password (API route), allow it
  if (request.nextUrl.pathname === '/api/verify-password') {
    return NextResponse.next();
  }

  // Otherwise, redirect to password page
  return NextResponse.redirect(new URL('/password', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};