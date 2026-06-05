import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getGCalAuthUrl } from '@/lib/gcal';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const url = new URL(request.url);
  const girlId = url.searchParams.get('girl_id');
  if (!girlId) {
    return NextResponse.json({ error: 'girl_id is required' }, { status: 400 });
  }

  const redirectTo = url.searchParams.get('redirect') ?? '/cs/admin/rezervace';

  const state = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await db.execute({
    sql: `INSERT INTO oauth_states (state, user_id, girl_id, redirect_to, expires_at) VALUES (?, ?, ?, ?, ?)`,
    args: [state, user.id, Number(girlId), redirectTo, expiresAt],
  });

  // Clean up expired states opportunistically
  await db.execute({
    sql: `DELETE FROM oauth_states WHERE expires_at < datetime('now')`,
    args: [],
  });

  return NextResponse.redirect(getGCalAuthUrl(state));
}
