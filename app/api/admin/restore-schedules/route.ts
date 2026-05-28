import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import schedules from '@/scripts/schedules-data.json';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (key !== 'restore-2026-05-28-emergency') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const girlsRes = await db.execute('SELECT id, slug FROM girls');
  const slugToId = new Map(girlsRes.rows.map((r) => [String(r.slug), Number(r.id)]));

  const before = await db.execute('SELECT COUNT(*) AS c FROM girl_schedules');

  let inserted = 0;
  let skipped = 0;
  for (const row of schedules as Array<{ slug: string; day: number; from: string; to: string }>) {
    const girlId = slugToId.get(row.slug);
    if (!girlId) { skipped++; continue; }
    // Skip if same row already exists
    const exists = await db.execute({
      sql: `SELECT 1 FROM girl_schedules WHERE girl_id = ? AND day_of_week = ? LIMIT 1`,
      args: [girlId, row.day],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO girl_schedules (girl_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, 1)`,
      args: [girlId, row.day, row.from, row.to],
    });
    inserted++;
  }

  const after = await db.execute('SELECT COUNT(*) AS c FROM girl_schedules');

  return NextResponse.json({
    ok: true,
    inserted,
    skipped,
    before: Number(before.rows[0]?.c ?? 0),
    after: Number(after.rows[0]?.c ?? 0),
  });
}
