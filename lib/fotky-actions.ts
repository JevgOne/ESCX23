'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function uploadPhotoAction(formData: FormData) {
  const { requireAdmin } = await import('./auth');
  const { db } = await import('./db');

  const girlId = Number(formData.get('girl_id'));
  await requireAdmin();

  const files = formData.getAll('photo') as File[];
  const ALLOWED = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic']);
  const MAX = 10 * 1024 * 1024;
  const valid = files.filter((f) => f && f.size > 0 && f.size <= MAX);

  if (valid.length === 0) {
    revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
    redirect(`/cs/admin/divky/${girlId}/fotky`);
  }

  try {
    const minRes = await db.execute({
      sql: `SELECT COALESCE(MIN(display_order), 100) AS min_order FROM girl_photos WHERE girl_id = ?`,
      args: [girlId],
    });
    let nextOrder = Number(minRes.rows[0]?.min_order ?? 100) - valid.length;

    for (const file of valid) {
      const ext = (file.name.split('.').pop() ?? '').toLowerCase();
      if (!ALLOWED.has(ext)) continue;

      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const sharp = (await import('sharp')).default;
      const webpBuffer = await sharp(inputBuffer).webp({ quality: 82 }).toBuffer();

      const filename = `girls/${girlId}/${Date.now()}-${crypto.randomUUID()}.webp`;
      const { put } = await import('@vercel/blob');
      const blob = await put(filename, webpBuffer, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
      });

      await db.execute({
        sql: `INSERT INTO girl_photos (girl_id, filename, url, is_primary, display_order) VALUES (?, ?, ?, 0, ?)`,
        args: [girlId, filename, blob.url, nextOrder],
      });
      nextOrder++;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[photo-upload] FAILED:', msg);
    revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
    redirect(`/cs/admin/divky/${girlId}/fotky?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
  revalidatePath(`/cs/studio/fotky`);
  revalidatePath(`/cs`);
  redirect(`/cs/admin/divky/${girlId}/fotky`);
}

export async function setPrimaryAction(formData: FormData) {
  const { requireAdmin } = await import('./auth');
  const { db } = await import('./db');

  const photoId = Number(formData.get('photo_id'));
  const girlId = Number(formData.get('girl_id'));
  await requireAdmin();

  await db.execute({ sql: `UPDATE girl_photos SET is_primary = 0 WHERE girl_id = ?`, args: [girlId] });
  await db.execute({ sql: `UPDATE girl_photos SET is_primary = 1 WHERE id = ? AND girl_id = ?`, args: [photoId, girlId] });

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
  redirect(`/cs/admin/divky/${girlId}/fotky`);
}

export async function setSecondaryAction(formData: FormData) {
  const { requireAdmin } = await import('./auth');
  const { db } = await import('./db');

  const photoId = Number(formData.get('photo_id'));
  const girlId = Number(formData.get('girl_id'));
  await requireAdmin();

  await db.execute({ sql: `UPDATE girl_photos SET is_secondary = 0 WHERE girl_id = ?`, args: [girlId] });
  await db.execute({ sql: `UPDATE girl_photos SET is_secondary = 1 WHERE id = ? AND girl_id = ?`, args: [photoId, girlId] });

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
  redirect(`/cs/admin/divky/${girlId}/fotky`);
}

export async function deletePhotoAction(formData: FormData) {
  const { requireAdmin } = await import('./auth');
  const { db } = await import('./db');

  const photoId = Number(formData.get('photo_id'));
  const girlId = Number(formData.get('girl_id'));
  await requireAdmin();

  const result = await db.execute({
    sql: `SELECT url FROM girl_photos WHERE id = ? AND girl_id = ? LIMIT 1`,
    args: [photoId, girlId],
  });
  if (result.rows.length === 0) return;

  const url = String(result.rows[0].url);
  if (url.includes('blob.vercel-storage.com')) {
    try {
      const { del } = await import('@vercel/blob');
      await del(url);
    } catch (e) {
      console.error('Failed to delete blob:', e);
    }
  }

  await db.execute({ sql: `DELETE FROM girl_photos WHERE id = ? AND girl_id = ?`, args: [photoId, girlId] });

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
  redirect(`/cs/admin/divky/${girlId}/fotky`);
}
