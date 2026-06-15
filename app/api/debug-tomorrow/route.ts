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

  // Exact same query structure as getGirlsForListing
  const result = await db.execute({
    sql: `
      SELECT
        g.id, g.name, g.slug,
        gs.start_time AS shift_from, gs.end_time AS shift_to,
        se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
        gs2.start_time AS tmrw_from, gs2.end_time AS tmrw_to,
        se2.exception_type AS tmrw_ex_type,
        CASE
          WHEN se.exception_type = 'unavailable' THEN 0
          WHEN (COALESCE(se.start_time, gs.start_time)) IS NOT NULL
            AND ? >= SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
            AND ? <= SUBSTR(COALESCE(se.end_time, gs.end_time),1,5)
          THEN 1
          ELSE 0
        END AS working_now,
        CASE
          WHEN g.status = 'inactive' THEN 5
          WHEN se.exception_type = 'unavailable' THEN 4
          WHEN (COALESCE(se.start_time, gs.start_time)) IS NOT NULL
            AND ? >= SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
            AND ? <= SUBSTR(COALESCE(se.end_time, gs.end_time),1,5)
          THEN 1
          WHEN (COALESCE(se.start_time, gs.start_time)) IS NOT NULL
            AND ? < SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
          THEN 2
          WHEN gs2.start_time IS NOT NULL AND (se2.exception_type IS NULL OR se2.exception_type != 'unavailable')
          THEN 3
          ELSE 4
        END AS status_rank
      FROM girls g
      LEFT JOIN girl_schedules gs ON gs.girl_id = g.id
        AND gs.day_of_week = ? AND gs.is_active = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN locations l2 ON l2.district = g.location AND l2.is_active = 1
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      LEFT JOIN girl_schedules gs2 ON gs2.girl_id = g.id
        AND gs2.day_of_week = ? AND gs2.is_active = 1
      LEFT JOIN schedule_exceptions se2 ON se2.girl_id = g.id AND se2.date = ?
      WHERE g.status IN ('active','inactive') AND (g.vip = 0 OR g.vip IS NULL)
      ORDER BY status_rank ASC, g.name ASC
    `,
    args: [now, now, now, now, now, dayOfWeek, today, tomorrowDow, tomorrowDate],
  });

  return NextResponse.json({
    params: { dayOfWeek, today, now, tomorrowDow, tomorrowDate },
    argOrder: ['now','now','now','now','now','dayOfWeek','today','tomorrowDow','tomorrowDate'],
    args: [now, now, now, now, now, dayOfWeek, today, tomorrowDow, tomorrowDate],
    girls: result.rows,
  });
}
