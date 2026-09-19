import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/push — save push subscription
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await db.execute({
    sql: `INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth)
          VALUES (?, ?, ?, ?)`,
    args: [user.id, endpoint, keys.p256dh, keys.auth],
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/push — remove push subscription
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await db.execute({
    sql: 'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    args: [user.id, endpoint],
  });

  return NextResponse.json({ ok: true });
}
