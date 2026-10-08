import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';

  // JSON actions (set primary, set secondary, delete)
  if (contentType.includes('application/json')) {
    const body = await request.json();
    const { action, photoId, girlId, locale = 'cs' } = body;

    if (action === 'setPrimary') {
      await db.execute({ sql: `UPDATE girl_photos SET is_primary = 0 WHERE girl_id = ?`, args: [girlId] });
      await db.execute({ sql: `UPDATE girl_photos SET is_primary = 1 WHERE id = ? AND girl_id = ?`, args: [photoId, girlId] });
      revalidatePath(`/${locale}/admin/divky/${girlId}/fotky`);
      return NextResponse.json({ ok: true });
    }

    if (action === 'setSecondary') {
      await db.execute({ sql: `UPDATE girl_photos SET is_secondary = 0 WHERE girl_id = ?`, args: [girlId] });
      await db.execute({ sql: `UPDATE girl_photos SET is_secondary = 1 WHERE id = ? AND girl_id = ?`, args: [photoId, girlId] });
      revalidatePath(`/${locale}/admin/divky/${girlId}/fotky`);
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete') {
      const result = await db.execute({
        sql: `SELECT url FROM girl_photos WHERE id = ? AND girl_id = ? LIMIT 1`,
        args: [photoId, girlId],
      });
      if (result.rows.length > 0) {
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
      }
      revalidatePath(`/${locale}/admin/divky/${girlId}/fotky`);
      return NextResponse.json({ ok: true });
    }

    if (action === 'getMinOrder') {
      const minRes = await db.execute({
        sql: `SELECT COALESCE(MIN(display_order), 100) AS min_order FROM girl_photos WHERE girl_id = ?`,
        args: [girlId],
      });
      return NextResponse.json({ minOrder: Number(minRes.rows[0]?.min_order ?? 100) });
    }

    if (action === 'saveUploaded') {
      const { filename, url, displayOrder } = body;
      await db.execute({
        sql: `INSERT INTO girl_photos (girl_id, filename, url, is_primary, display_order) VALUES (?, ?, ?, 0, ?)`,
        args: [girlId, filename, url, displayOrder],
      });
      revalidatePath(`/${locale}/admin/divky/${girlId}/fotky`);
      revalidatePath(`/${locale}/studio/fotky`);
      revalidatePath(`/${locale}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  // FormData upload
  const formData = await request.formData();
  const girlId = Number(formData.get('girl_id'));
  const files = formData.getAll('photo') as File[];
  const ALLOWED = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic']);
  const MAX = 10 * 1024 * 1024;
  const valid = files.filter((f) => f && f.size > 0 && f.size <= MAX);

  if (valid.length === 0) {
    return NextResponse.redirect(new URL(`/cs/admin/divky/${girlId}/fotky`, request.url));
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
    return NextResponse.redirect(
      new URL(`/cs/admin/divky/${girlId}/fotky?error=${encodeURIComponent(msg)}`, request.url)
    );
  }

  revalidatePath(`/cs/admin/divky/${girlId}/fotky`);
  revalidatePath(`/cs/studio/fotky`);
  revalidatePath(`/cs`);
  return NextResponse.redirect(new URL(`/cs/admin/divky/${girlId}/fotky`, request.url));
}
