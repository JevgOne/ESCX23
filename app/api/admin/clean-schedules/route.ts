import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (key !== 'clean-2026-05-28-emergency') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const before = await db.execute('SELECT COUNT(*) AS c FROM girl_schedules');
  await db.execute('DELETE FROM girl_schedules');
  return NextResponse.json({ ok: true, deleted: Number(before.rows[0]?.c ?? 0) });
}
