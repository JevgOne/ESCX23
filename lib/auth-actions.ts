'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticate, setSession, clearSession, getCurrentUser, checkLoginRateLimit, resetLoginAttempts } from './auth';

async function getLocale(): Promise<string> {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';
  const match = pathname.match(/^\/(cs|en|de|uk)\//);
  return match ? match[1] : 'cs';
}

async function getClientIP(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? hdrs.get('x-real-ip')
    ?? '0.0.0.0';
}

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';
  const locale = await getLocale();
  const ip = await getClientIP();

  // Rate limiting: max 5 attempts per 15 minutes per IP
  if (!checkLoginRateLimit(ip)) {
    redirect(`/${locale}/admin/login?error=ratelimit`);
  }

  const user = await authenticate(email, password);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect(`/${locale}/admin/login?error=invalid`);
  }

  resetLoginAttempts(ip);
  await setSession(user.id, user.role, remember);
  redirect(`/${locale}/admin`);
}

export async function loginGirl(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';
  const locale = await getLocale();
  const ip = await getClientIP();

  if (!checkLoginRateLimit(ip)) {
    redirect(`/${locale}/studio/login?error=ratelimit`);
  }

  const user = await authenticate(email, password);

  if (!user || user.role !== 'girl') {
    redirect(`/${locale}/studio/login?error=invalid`);
  }

  resetLoginAttempts(ip);
  await setSession(user.id, user.role, remember);
  redirect(`/${locale}/studio`);
}

export async function loginBooking(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';
  const ip = await getClientIP();

  if (!checkLoginRateLimit(ip)) {
    redirect('/booking?error=ratelimit');
  }

  const user = await authenticate(email, password);

  if (!user) {
    redirect('/booking?error=invalid');
  }

  resetLoginAttempts(ip);
  await setSession(user.id, user.role, remember);

  // Role-based redirect
  if (user.role === 'girl') {
    redirect('/studio/dashboard');
  }
  if (user.role === 'operator') {
    redirect('/booking/calendar');
  }
  // admin (and manager as fallback) → dashboard
  redirect('/booking/dashboard');
}

export async function logoutAction() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  await clearSession();

  if (user?.role === 'girl') {
    redirect(`/${locale}/studio/login`);
  }
  if (user?.role === 'operator') {
    redirect('/booking');
  }
  redirect(`/${locale}/admin/login`);
}

export async function logoutBookingAction() {
  await clearSession();
  redirect('/booking');
}
