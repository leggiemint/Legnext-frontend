import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ski2p password protection for API routes, auth pages, and assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/site-password' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Check if site password protection is enabled
  const sitePassword = process.env.SITE_PASSWORD;
  
  // Only enable protection if SITE_PASSWORD is set
  if (!sitePassword) {
    return NextResponse.next();
  }

  // Check if user has already entered the correct password
  const passwordCookie = request.cookies.get('site-access');
  if (passwordCookie?.value === sitePassword) {
    return NextResponse.next();
  }

  // Redirect to password page
  const passwordUrl = new URL('/site-password', request.url);
  passwordUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(passwordUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};