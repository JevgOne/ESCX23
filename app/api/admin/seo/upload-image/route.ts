import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const pageKey = String(formData.get('pageKey') ?? '');

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Žádný soubor' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Soubor je moc velký (max 5 MB)' }, { status: 400 });
  }

  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Neplatný typ (jpg/png/webp)' }, { status: 400 });
  }

  const filename = pageKey
    ? `og/${pageKey}-${Date.now()}.${ext}`
    : `og/seo-${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type || `image/${ext}`,
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload selhal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
