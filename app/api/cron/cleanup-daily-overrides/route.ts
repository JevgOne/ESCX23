import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pragueDateISO } from '@/lib/utils';

/**
 * Nightly cron (22:31 Prague) — delete schedule_exceptions for today and earlier.
 * This ensures tomorrow's schedule starts fresh from girl_schedules defaults.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today = pragueDateISO();
  const result = await db.execute({
    sql: `DELETE FROM schedule_exceptions WHERE date <= ?`,
    args: [today],
  });

  return NextResponse.json({ success: true, affected: result.rowsAffected, cutoffDate: today });
}
