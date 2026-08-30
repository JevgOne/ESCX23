import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = intl(request);

  // For redirects, return as-is
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // Set x-pathname on REQUEST headers so Server Components can read it via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const result = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Preserve next-intl's response headers (cookies for locale, etc.)
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'x-middleware-next') {
      result.headers.set(key, value);
    }
  });

  // Preserve next-intl's cookies
  for (const cookie of response.cookies.getAll()) {
    result.cookies.set(cookie);
  }

  return result;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
