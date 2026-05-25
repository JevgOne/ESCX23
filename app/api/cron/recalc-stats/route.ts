import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await db.execute(`
    UPDATE girls SET
      reviews_count = (
        SELECT COUNT(*) FROM reviews
        WHERE reviews.girl_id = girls.id AND reviews.status = 'approved'
      ),
      rating = (
        SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews
        WHERE reviews.girl_id = girls.id AND reviews.status = 'approved'
      )
  `);

  return NextResponse.json({ success: true, affected: result.rowsAffected });
}
