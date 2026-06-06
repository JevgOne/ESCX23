'use server';

import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from './db';
import { requireAdmin } from './auth';
import { watermarkImage } from './watermark';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic']);
const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadPhotoForm(formData: FormData) {
  const file = formData.get('photo') as File | null;
  const girlId = Number(formData.get('girl_id'));
  const skipWatermark = formData.get('skip_watermark') === '1';

  if (!file || file.size === 0) return { error: 'No file' };
  if (file.size > MAX_BYTES) return { error: 'File too large (max 10MB)' };

  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return { error: 'Invalid file type' };

  await requireAdmin();

  // Apply watermark by default. Admin can opt out via skip_watermark=1.
  let uploadPayload: File | Buffer = file;
  let finalExt = ext;
  let finalContentType = file.type || `image/${ext}`;
  if (!skipWatermark) {
    try {
      const raw = Buffer.from(await file.arrayBuffer());
      uploadPayload = await watermarkImage(raw);
      finalExt = 'jpg';
      finalContentType = 'image/jpeg';
    } catch (err) {
      console.error('Watermark failed, uploading original:', err);
    }
  }

  const filename = `girls/${girlId}/${Date.now()}-${crypto.randomUUID()}.${finalExt}`;
  const blob = await put(filename, uploadPayload, {
    access: 'public',
    contentType: finalContentType,
    addRandomSuffix: false,
  });

  await db.execute({
    sql: `INSERT INTO girl_photos (girl_id, filename, url, is_primary, display_order) VALUES (?, ?, ?, 0, 999)`,
    args: [girlId, filename, blob.url],
  });

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
  revalidatePath(`/cs/studio/fotky`);
  revalidatePath(`/cs`);

  return { ok: true, url: blob.url };
}

export async function setPhotoAsPrimary(photoId: number, girlId: number) {
  await requireAdmin();

  await db.execute({
    sql: `UPDATE girl_photos SET is_primary = 0 WHERE girl_id = ?`,
    args: [girlId],
  });
  await db.execute({
    sql: `UPDATE girl_photos SET is_primary = 1 WHERE id = ? AND girl_id = ?`,
    args: [photoId, girlId],
  });

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
}

export async function deletePhoto(photoId: number, girlId: number) {
  await requireAdmin();

  const result = await db.execute({
    sql: `SELECT url FROM girl_photos WHERE id = ? AND girl_id = ? LIMIT 1`,
    args: [photoId, girlId],
  });
  if (result.rows.length === 0) return;

  const url = String(result.rows[0].url);

  if (url.includes('blob.vercel-storage.com')) {
    try {
      await del(url);
    } catch (e) {
      console.error('Failed to delete blob:', e);
    }
  }

  await db.execute({
    sql: `DELETE FROM girl_photos WHERE id = ? AND girl_id = ?`,
    args: [photoId, girlId],
  });

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
}
