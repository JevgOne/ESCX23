import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/avif'],
      maximumSizeInBytes: 10 * 1024 * 1024,
    }),
    onUploadCompleted: async () => {
      // DB save happens in the main photos API route (saveUploaded action)
    },
  });

  return NextResponse.json(jsonResponse);
}
