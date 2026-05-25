'use server';

import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { requireAdmin } from './auth';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export async function getOgImageUrl(key: string): Promise<string | null> {
  const result = await db.execute({
    sql: `SELECT url FROM og_images WHERE page_key = ? LIMIT 1`,
    args: [key],
  });
  return result.rows[0]?.url ? String(result.rows[0].url) : null;
}

export async function uploadOgImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get('image') as File | null;
  const pageKey = String(formData.get('page_key') ?? '');

  if (!file || file.size === 0) throw new Error('Žádný soubor');
  if (file.size > MAX_BYTES) throw new Error('Soubor je moc velký (max 5 MB)');
  if (!pageKey) throw new Error('Chybí page_key');

  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) throw new Error('Neplatný typ (jpg/png/webp)');

  const filename = `og/${pageKey}-${Date.now()}.${ext}`;
  const blob = await put(filename, file, {
    access: 'public',
    contentType: file.type || `image/${ext}`,
    addRandomSuffix: false,
  });

  // Delete old blob if existed
  const old = await db.execute({
    sql: `SELECT filename FROM og_images WHERE page_key = ?`,
    args: [pageKey],
  });
  if (old.rows[0]?.filename) {
    try { await del(String(old.rows[0].filename)); } catch { /* ignore */ }
  }

  await db.execute({
    sql: `INSERT INTO og_images (page_key, url, filename) VALUES (?, ?, ?)
          ON CONFLICT(page_key) DO UPDATE SET url=excluded.url, filename=excluded.filename, uploaded_at=CURRENT_TIMESTAMP`,
    args: [pageKey, blob.url, filename],
  });

  revalidatePath('/cs/admin/og');
  revalidatePath('/', 'layout');
}

export async function deleteOgImage(formData: FormData) {
  await requireAdmin();
  const pageKey = String(formData.get('page_key') ?? '');
  if (!pageKey) return;

  const row = await db.execute({
    sql: `SELECT filename FROM og_images WHERE page_key = ?`,
    args: [pageKey],
  });
  if (row.rows[0]?.filename) {
    try { await del(String(row.rows[0].filename)); } catch { /* ignore */ }
  }
  await db.execute({ sql: `DELETE FROM og_images WHERE page_key = ?`, args: [pageKey] });

  revalidatePath('/cs/admin/og');
  revalidatePath('/', 'layout');
}
