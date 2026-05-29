import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await db.execute(
    `DELETE FROM schedule_exceptions WHERE date < date('now', '-30 days')`
  );

  return NextResponse.json({ success: true, affected: result.rowsAffected });
}
