'use server';

import { cookies, headers } from 'next/headers';

export async function setAgeVerified() {
  const cookieStore = await cookies();
  // Session-only cookie: NO maxAge → browser deletes on close.
  // Same user returning after closing the browser sees the age gate again.
  cookieStore.set('age_verified', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const hdrs = await headers();
  const referer = hdrs.get('referer') ?? '/';
  const url = new URL(referer);
  const redirectTo = url.pathname + (url.search ?? '');

  const { redirect } = await import('next/navigation');
  redirect(redirectTo);
}
