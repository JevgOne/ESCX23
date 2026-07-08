import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

const ADMIN_SECRET = process.env.ADMIN_UPLOAD_SECRET || 'blog-covers-2026';

export async function POST(request: NextRequest) {
  // Simple secret check (not session-based, for one-time CLI use)
  const authHeader = request.headers.get('x-admin-secret');
  if (authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const slug = formData.get('slug') as string | null;
  const alt = formData.get('alt') as string | null;

  if (!file || !slug) {
    return NextResponse.json({ error: 'Missing file or slug' }, { status: 400 });
  }

  // Find article
  const result = await db.execute({
    sql: 'SELECT id, cover_url FROM blog_posts WHERE slug = ?',
    args: [slug],
  });

  if (!result.rows.length) {
    return NextResponse.json({ error: `Article not found: ${slug}` }, { status: 404 });
  }

  const articleId = result.rows[0].id;

  // Upload to Blob
  const filename = `blog/covers/${file.name}`;
  const blob = await put(filename, file, {
    access: 'public',
    contentType: file.type || 'image/webp',
    addRandomSuffix: false,
  });

  // Update DB
  await db.execute({
    sql: 'UPDATE blog_posts SET cover_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [blob.url, articleId],
  });

  return NextResponse.json({
    ok: true,
    articleId,
    slug,
    url: blob.url,
  });
}
