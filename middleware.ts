import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  request.headers.set('x-pathname', pathname);

  // /booking and /studio are internal tools — skip i18n, no locale prefix
  if (pathname.startsWith('/booking') || pathname.startsWith('/studio')) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  return intl(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
