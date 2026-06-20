'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { requireAdmin, requireFullAdmin } from './auth';
import { createAdminNotification } from './admin-notifications';

async function getLocale(): Promise<string> {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';
  const match = pathname.match(/^\/(cs|en|de|uk)\//);
  return match ? match[1] : 'cs';
}

export async function submitApartmentReview(formData: FormData) {
  const locationId = Number(formData.get('location_id'));
  const locationSlug = String(formData.get('location_slug') ?? '');
  const authorName = String(formData.get('author_name') ?? '').trim();
  const rating = Number(formData.get('rating'));
  const content = String(formData.get('content') ?? '').trim();
  const cleanliness = formData.get('cleanliness') ? Number(formData.get('cleanliness')) : null;
  const discretion = formData.get('discretion') ? Number(formData.get('discretion')) : null;
  const comfort = formData.get('comfort') ? Number(formData.get('comfort')) : null;
  const honeypot = String(formData.get('website') ?? '');
  const locale = await getLocale();

  // Honeypot check
  if (honeypot) {
    redirect(`/${locale}/pobocka/${locationSlug}?sent=ok`);
  }

  // Validation
  if (!locationId || !authorName || !rating || rating < 1 || rating > 5 || content.length < 10) {
    redirect(`/${locale}/pobocka/${locationSlug}?error=validation`);
  }

  // IP-based rate limiting: max 1 review per location per IP per 24h
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? null;
  if (ip) {
    const existing = await db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM apartment_reviews
            WHERE location_id = ? AND ip_address = ? AND created_at > datetime('now', '-1 day')`,
      args: [locationId, ip],
    });
    if (Number((existing.rows[0] as Record<string, unknown>)?.cnt ?? 0) > 0) {
      redirect(`/${locale}/pobocka/${locationSlug}?error=ratelimit`);
    }
  }

  await db.execute({
    sql: `INSERT INTO apartment_reviews (location_id, author_name, rating, content, cleanliness, discretion, comfort, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [locationId, authorName, rating, content, cleanliness, discretion, comfort, ip],
  });

  await createAdminNotification(
    'apartment_review',
    'Nova recenze apartmanu',
    `${authorName} ohodnotil/a apartman (${rating}/5)`,
    `/admin/recenze-apartmanu`,
  );

  revalidatePath(`/${locale}/pobocka/${locationSlug}`);
  redirect(`/${locale}/pobocka/${locationSlug}?sent=ok`);
}

export async function approveApartmentReview(formData: FormData) {
  const user = await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `UPDATE apartment_reviews SET status='approved', approved_at=CURRENT_TIMESTAMP, approved_by=? WHERE id=?`,
    args: [user.id, id],
  });
  revalidatePath('/cs/admin/recenze-apartmanu');
}

export async function rejectApartmentReview(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `UPDATE apartment_reviews SET status='rejected' WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/recenze-apartmanu');
}

export async function deleteApartmentReview(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `DELETE FROM apartment_reviews WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/recenze-apartmanu');
}
