import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return NextResponse.redirect(new URL('/cs/admin/login', request.url));
  }

  const formData = await request.formData();
  const girlId = formData.get('girl_id');
  if (!girlId) {
    return NextResponse.json({ error: 'girl_id is required' }, { status: 400 });
  }

  await db.execute({
    sql: `DELETE FROM google_calendar_tokens WHERE girl_id = ?`,
    args: [Number(girlId)],
  });

  const referer = request.headers.get('referer');
  const redirectUrl = referer ?? '/cs/admin/rezervace';

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
