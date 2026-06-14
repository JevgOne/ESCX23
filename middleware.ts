import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intl(request);
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
