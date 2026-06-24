'use server';

import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import sharp from 'sharp';
import { db } from './db';
import { requireAdmin } from './auth';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic']);
const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadPhotoForm(formData: FormData) {
  const girlId = Number(formData.get('girl_id'));
  const source = formData.get('source');

  console.log('[photo-upload] START girlId=', girlId, 'source=', source);

  await requireAdmin();
  console.log('[photo-upload] auth OK');

  // Support multiple files
  const files = formData.getAll('photo') as File[];
  console.log('[photo-upload] files count=', files.length, 'sizes=', files.map(f => f.size));
  const validFiles = files.filter((f) => f && f.size > 0 && f.size <= MAX_BYTES);
  console.log('[photo-upload] valid files=', validFiles.length);
  if (validFiles.length === 0) {
    console.log('[photo-upload] NO valid files, redirecting');
    if (source === 'admin') {
      revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
      redirect(`/cs/admin/divky/${girlId}/fotky`);
    }
    return { error: 'No file' };
  }

  try {
    // New photos get display_order BEFORE existing ones (so they show first)
    const minRes = await db.execute({
      sql: `SELECT COALESCE(MIN(display_order), 100) AS min_order FROM girl_photos WHERE girl_id = ?`,
      args: [girlId],
    });
    let nextOrder = Number(minRes.rows[0]?.min_order ?? 100) - validFiles.length;
    console.log('[photo-upload] nextOrder=', nextOrder);

    for (const file of validFiles) {
      const ext = (file.name.split('.').pop() ?? '').toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        console.log('[photo-upload] skipping invalid ext:', ext);
        continue;
      }
      console.log('[photo-upload] processing:', file.name, file.size, ext);

      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const webpBuffer = await sharp(inputBuffer).webp({ quality: 82 }).toBuffer();
      console.log('[photo-upload] webp converted:', file.size, '->', webpBuffer.length);

      const filename = `girls/${girlId}/${Date.now()}-${crypto.randomUUID()}.webp`;
      console.log('[photo-upload] putting to blob:', filename);
      const blob = await put(filename, webpBuffer, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
      });
      console.log('[photo-upload] blob OK:', blob.url);

      await db.execute({
        sql: `INSERT INTO girl_photos (girl_id, filename, url, is_primary, display_order) VALUES (?, ?, ?, 0, ?)`,
        args: [girlId, filename, blob.url, nextOrder],
      });
      console.log('[photo-upload] DB insert OK');
      nextOrder++;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : '';
    console.error('[photo-upload] FAILED:', msg, stack);
    if (source === 'admin') {
      revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
      redirect(`/cs/admin/divky/${girlId}/fotky?error=${encodeURIComponent(msg)}`);
    }
    return { error: msg };
  }

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
  revalidatePath(`/cs/studio/fotky`);
  revalidatePath(`/cs`);

  if (source === 'admin') {
    redirect(`/cs/admin/divky/${girlId}/fotky`);
  }

  return { ok: true };
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

export async function setPhotoAsSecondary(photoId: number, girlId: number) {
  await requireAdmin();

  // Clear any existing secondary
  await db.execute({
    sql: `UPDATE girl_photos SET is_secondary = 0 WHERE girl_id = ?`,
    args: [girlId],
  });
  await db.execute({
    sql: `UPDATE girl_photos SET is_secondary = 1 WHERE id = ? AND girl_id = ?`,
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
