import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MIN_SHIFTS_PER_WEEK = 2;

/**
 * Cron (Sunday 20:00 UTC = 22:00 Prague) — deadline check for shift submissions.
 *
 * Girls who still haven't submitted at least 2 shifts for next week
 * get flagged in an admin notification. No penalty — informational only.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Next Monday in Prague timezone
  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const day = pragueNow.getDay(); // 0=Sun
  const monday = new Date(pragueNow);
  monday.setDate(pragueNow.getDate() + (day === 0 ? 1 : 8 - day));
  const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

  // All active girls
  const girls = await db.execute({
    sql: `SELECT id, name FROM girls WHERE status = 'active'`,
    args: [],
  });

  const missing: string[] = [];

  for (const g of girls.rows) {
    const girlId = Number(g.id);
    const count = await db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM shift_requests WHERE girl_id = ? AND week_start = ? AND status != 'rejected'`,
      args: [girlId, weekStart],
    });
    const cnt = Number(count.rows[0]?.cnt ?? 0);
    if (cnt < MIN_SHIFTS_PER_WEEK) {
      missing.push(String(g.name));
    }
  }

  if (missing.length > 0) {
    await db.execute({
      sql: `INSERT INTO admin_notifications (type, title, message, link) VALUES (?, ?, ?, ?)`,
      args: [
        'shift_deadline',
        'Deadline směn — nezadané',
        `${missing.length} dívek nezadalo směny na příští týden do deadline: ${missing.join(', ')}`,
        '/cs/admin/schedules?tab=pending',
      ],
    });
  }

  return NextResponse.json({
    ok: true,
    weekStart,
    missingCount: missing.length,
    missing,
  });
}
