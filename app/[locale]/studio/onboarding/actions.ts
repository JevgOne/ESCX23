'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser, authenticate } from '@/lib/auth';

async function getLocale(): Promise<string> {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';
  const match = pathname.match(/^\/(cs|en|de|uk)\//);
  return match ? match[1] : 'cs';
}

/** Step 1: Change password + optional personal message. */
export async function onboardingStep1(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'girl') {
    const locale = await getLocale();
    redirect(`/${locale}/studio/login`);
  }

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const personalMessage = String(formData.get('personal_message') ?? '').trim().slice(0, 160) || null;

  const locale = await getLocale();

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(`/${locale}/studio/onboarding?step=1&error=missing`);
  }

  if (newPassword.length < 8) {
    redirect(`/${locale}/studio/onboarding?step=1&error=short`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`/${locale}/studio/onboarding?step=1&error=mismatch`);
  }

  // Verify current (generated) password
  const verified = await authenticate(user.email, currentPassword);
  if (!verified) {
    redirect(`/${locale}/studio/onboarding?step=1&error=wrong`);
  }

  // Hash + update + clear force flag
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash(newPassword, 12);
  await db.execute({
    sql: 'UPDATE users SET password_hash = ?, force_password_change = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [hash, user.id],
  });

  // Save personal message if provided
  if (personalMessage && user.girl_id) {
    await db.execute({
      sql: 'UPDATE girls SET personal_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [personalMessage, user.girl_id],
    });
  }

  redirect(`/${locale}/studio/onboarding?step=2`);
}

/** Step 3: Save services, languages, hashtags. */
export async function onboardingStep3(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'girl' || !user.girl_id) {
    const locale = await getLocale();
    redirect(`/${locale}/studio/login`);
  }
  const girlId = user.girl_id;
  const locale = await getLocale();

  // Services
  const serviceIds = formData.getAll('services').map(Number).filter(Boolean);
  await db.batch([
    { sql: `DELETE FROM girl_services WHERE girl_id = ?`, args: [girlId] },
    ...serviceIds.map((sid) => ({
      sql: `INSERT INTO girl_services (girl_id, service_id) VALUES (?, ?)`,
      args: [girlId, sid],
    })),
  ]);

  // Languages
  const langs = formData.getAll('languages').map(String).filter(Boolean);
  if (langs.length > 0) {
    await db.execute({
      sql: `UPDATE girls SET languages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [JSON.stringify(langs), girlId],
    });
  }

  // Hashtags
  const hashtags = formData.getAll('hashtag_slugs').map(String).filter(Boolean);
  if (hashtags.length > 0) {
    await db.execute({
      sql: `UPDATE girls SET hashtags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [JSON.stringify(hashtags), girlId],
    });
  }

  // Preferred program
  const programId = formData.get('program_id') ? Number(formData.get('program_id')) : null;
  if (programId) {
    await db.execute({
      sql: `UPDATE girls SET preferred_program_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [programId, girlId],
    });
  }

  revalidatePath(`/${locale}/studio/sluzby`);
  redirect(`/${locale}/studio/onboarding?step=4`);
}

/** Step 5: Complete onboarding → redirect to dashboard. */
export async function completeOnboarding() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'girl') {
    const locale = await getLocale();
    redirect(`/${locale}/studio/login`);
  }
  const locale = await getLocale();
  redirect(`/${locale}/studio`);
}
