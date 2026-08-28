'use server';

import { cookies, headers } from 'next/headers';

/**
 * Confirms the visitor is of age and puts them back on the page they were on.
 *
 * The return path arrives as a form field, not from the Referer header. Safari
 * trims or drops Referer under its tracking protection, and this action then
 * fell back to "/" — or worse, to whatever stale URL the header still held — so
 * confirming the gate could drop you on a different page than the one you were
 * reading. The page knows its own path; it should say so rather than have the
 * server guess.
 */
export async function setAgeVerified(formData?: FormData) {
  const cookieStore = await cookies();
  // Session-only cookie: NO maxAge → browser deletes on close.
  // Same user returning after closing the browser sees the age gate again.
  cookieStore.set('age_verified', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  let redirectTo = '/';
  const fromForm = formData?.get('returnTo');
  if (typeof fromForm === 'string' && fromForm.startsWith('/') && !fromForm.startsWith('//')) {
    // Same-origin path only — never a full URL, so this cannot be turned into
    // an open redirect by editing the field.
    redirectTo = fromForm;
  } else {
    const hdrs = await headers();
    const referer = hdrs.get('referer');
    if (referer) {
      try {
        const url = new URL(referer);
        redirectTo = url.pathname + (url.search ?? '');
      } catch {
        // keep "/"
      }
    }
  }

  const { redirect } = await import('next/navigation');
  redirect(redirectTo);
}
