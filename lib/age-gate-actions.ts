'use server';

import { cookies, headers } from 'next/headers';

export async function setAgeVerified() {
  const cookieStore = await cookies();
  cookieStore.set('age_verified', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  const hdrs = await headers();
  const referer = hdrs.get('referer') ?? '/';
  const url = new URL(referer);
  const redirectTo = url.pathname + (url.search ?? '');

  const { redirect } = await import('next/navigation');
  redirect(redirectTo);
}
