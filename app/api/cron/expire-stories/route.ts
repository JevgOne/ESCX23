import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await db.execute(
    `UPDATE stories SET status='expired', is_active=0
     WHERE expires_at IS NOT NULL AND expires_at < datetime('now')
       AND status != 'expired'`
  );

  return NextResponse.json({ success: true, affected: result.rowsAffected });
}
