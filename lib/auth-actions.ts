'use server';

import { redirect } from 'next/navigation';
import { authenticate, setSession, clearSession, getCurrentUser } from './auth';

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const user = await authenticate(email, password);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/admin/login?error=invalid');
  }

  await setSession(user.id, user.role);
  redirect('/admin');
}

export async function loginGirl(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const user = await authenticate(email, password);

  if (!user || user.role !== 'girl') {
    redirect('/studio/login?error=invalid');
  }

  await setSession(user.id, user.role);
  redirect('/studio');
}

export async function logoutAction() {
  const user = await getCurrentUser();
  await clearSession();

  if (user?.role === 'girl') {
    redirect('/studio/login');
  }
  redirect('/admin/login');
}
