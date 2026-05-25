'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export async function submitMemberApplication(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();

  if (!email || !email.includes('@')) {
    redirect('/clenstvi/zadost?error=validation');
  }

  await db.execute({
    sql: `INSERT INTO member_applications (email, name, phone, reason, status) VALUES (?, ?, ?, ?, 'pending')`,
    args: [email, name || null, phone || null, reason || null],
  });

  redirect('/clenstvi/zadost/odeslano');
}
