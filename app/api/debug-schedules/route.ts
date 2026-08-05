import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.execute({
    sql: `SELECT gs.id, gs.girl_id, g.slug, g.name, g.status, gs.day_of_week, gs.start_time, gs.end_time, gs.is_active, gs.effective_from, gs.location_id
          FROM girl_schedules gs
          JOIN girls g ON g.id = gs.girl_id
          ORDER BY g.name, gs.day_of_week`,
    args: [],
  });
  return NextResponse.json({ rows: result.rows });
}
