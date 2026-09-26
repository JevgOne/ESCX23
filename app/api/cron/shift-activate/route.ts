import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Cron (Sunday 22:00 UTC = Monday 00:00 Prague) — activate approved shifts for the new week.
 *
 * For each approved shift_request where week_start = this Monday:
 * 1. DELETE existing girl_schedules for that girl + day_of_week
 * 2. INSERT new girl_schedules from the approved request
 * 3. UPDATE shift_request status to 'activated'
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Compute this week's Monday in Prague timezone
  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const day = pragueNow.getDay(); // 0=Sun, 1=Mon, ...
  const diff = pragueNow.getDate() - day + (day === 0 ? 1 : (8 - day) % 7 || 7);
  // If it's Sunday night (UTC 22:00 = Prague Mon 00:00), we want the upcoming Monday
  // If it's already Monday in Prague, use today
  const monday = new Date(pragueNow);
  if (day === 0) {
    // Sunday → next day is Monday
    monday.setDate(pragueNow.getDate() + 1);
  } else if (day === 1) {
    // Monday → today
    monday.setDate(pragueNow.getDate());
  } else {
    // Any other day → next Monday
    monday.setDate(pragueNow.getDate() + (8 - day));
  }
  const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

  // Fetch approved requests for this week
  const approved = await db.execute({
    sql: `SELECT * FROM shift_requests WHERE status = 'approved' AND week_start = ?`,
    args: [weekStart],
  });

  let activated = 0;

  for (const r of approved.rows) {
    const girlId = Number(r.girl_id);
    const dayOfWeek = Number(r.day_of_week);
    const startTime = String(r.start_time);
    const endTime = String(r.end_time);
    const locationId = r.location_id ? Number(r.location_id) : null;

    // Remove existing schedule for this girl + day
    await db.execute({
      sql: `DELETE FROM girl_schedules WHERE girl_id = ? AND day_of_week = ?`,
      args: [girlId, dayOfWeek],
    });

    // Insert new schedule
    await db.execute({
      sql: `INSERT INTO girl_schedules (girl_id, day_of_week, start_time, end_time, is_active, location_id)
            VALUES (?, ?, ?, ?, 1, ?)`,
      args: [girlId, dayOfWeek, startTime, endTime, locationId],
    });

    // Mark as activated
    await db.execute({
      sql: `UPDATE shift_requests SET status = 'activated' WHERE id = ?`,
      args: [Number(r.id)],
    });

    activated++;
  }

  return NextResponse.json({
    ok: true,
    weekStart,
    activated,
  });
}
