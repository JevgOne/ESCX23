import { NextRequest, NextResponse } from 'next/server';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? '';
const SITE_HOST = 'www.lovelygirls.cz';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * GET /api/indexnow — returns the IndexNow verification key (plain text).
 * Some search engines verify key ownership via this endpoint.
 */
export async function GET() {
  if (!INDEXNOW_KEY) {
    return new NextResponse('IndexNow key not configured', { status: 503 });
  }
  return new NextResponse(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * POST /api/indexnow — submit URLs to IndexNow.
 * Body: { urls: string[] }
 * Auth: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!INDEXNOW_KEY) {
    return NextResponse.json({ error: 'INDEXNOW_KEY not configured' }, { status: 503 });
  }

  let urls: string[];
  try {
    const body = await request.json();
    urls = body.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls must be a non-empty array' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // IndexNow accepts max 10,000 URLs per request
  const batch = urls.slice(0, 10_000);

  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: batch,
  };

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return NextResponse.json({
    success: response.ok,
    status: response.status,
    submitted: batch.length,
  });
}
