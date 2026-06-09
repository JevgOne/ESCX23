'use server';

import { redirect } from 'next/navigation';
import { authenticate, setSession, clearSession, getCurrentUser } from './auth';

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const user = await authenticate(email, password);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/cs/admin/login?error=invalid');
  }

  await setSession(user.id, user.role);
  redirect('/cs/admin');
}

export async function loginGirl(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const user = await authenticate(email, password);

  if (!user || user.role !== 'girl') {
    redirect('/cs/studio/login?error=invalid');
  }

  await setSession(user.id, user.role);
  redirect('/cs/studio');
}

export async function logoutAction() {
  const user = await getCurrentUser();
  await clearSession();

  if (user?.role === 'girl') {
    redirect('/cs/studio/login');
  }
  redirect('/cs/admin/login');
}
