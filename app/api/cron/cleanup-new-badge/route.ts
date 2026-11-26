import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Daily cron — clear is_new and badge_type='new' for girls older than 14 days.
 * Runs at 03:00 Prague time.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await db.execute(
    `UPDATE girls
     SET is_new = 0,
         badge_type = CASE WHEN badge_type = 'new' THEN NULL ELSE badge_type END
     WHERE is_new = 1
       AND created_at IS NOT NULL
       AND (unixepoch('now') - unixepoch(created_at)) > 14 * 24 * 60 * 60`
  );

  return NextResponse.json({ success: true, cleared: result.rowsAffected });
}
