import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pragueDateISO, pragueDayOfWeek, formatPragueTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dayOfWeek = pragueDayOfWeek();
  const today = pragueDateISO();
  const now = formatPragueTime();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDow = pragueDayOfWeek(tomorrow);
  const tomorrowDate = pragueDateISO(tomorrow);

  // Simple query to check tomorrow schedule data
  const result = await db.execute({
    sql: `
      SELECT
        g.id, g.name, g.slug, g.status,
        gs.day_of_week AS today_dow, gs.start_time AS today_from, gs.end_time AS today_to,
        gs2.day_of_week AS tmrw_dow, gs2.start_time AS tmrw_from, gs2.end_time AS tmrw_to,
        se2.exception_type AS tmrw_ex_type
      FROM girls g
      LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
        AND gs.day_of_week = ? AND gs.is_active = 1
      LEFT JOIN girl_schedules gs2 ON gs2.girl_id = g.id
        AND gs2.day_of_week = ? AND gs2.is_active = 1
      LEFT JOIN schedule_exceptions se2 ON se2.girl_id = g.id AND se2.date = ?
      WHERE g.status IN ('active','inactive') AND (g.vip = 0 OR g.vip IS NULL)
      ORDER BY g.name
    `,
    args: [dayOfWeek, tomorrowDow, tomorrowDate],
  });

  return NextResponse.json({
    params: { dayOfWeek, today, now, tomorrowDow, tomorrowDate },
    girls: result.rows,
  });
}
