import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const countRes = await db.execute(`SELECT COUNT(*) AS cnt FROM members`);
  const cnt = Number(countRes.rows[0]?.cnt ?? 0);

  if (cnt === 0) {
    return NextResponse.json({ success: true, affected: 0, skipped: 'no members' });
  }

  const result = await db.execute(
    `UPDATE members SET loyalty_discount_pct = 0
     WHERE loyalty_discount_pct > 0
       AND last_visit_at IS NOT NULL
       AND last_visit_at < datetime('now', '-12 months')`
  );

  return NextResponse.json({ success: true, affected: result.rowsAffected });
}
