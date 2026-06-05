import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exchangeCodeForTokens } from '@/lib/gcal';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // User denied consent
  if (error) {
    return NextResponse.redirect(new URL('/cs/admin/rezervace?gcal=denied', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/cs/admin/rezervace?gcal=error', request.url));
  }

  // Verify state
  const stateResult = await db.execute({
    sql: `SELECT user_id, girl_id, redirect_to FROM oauth_states WHERE state = ? AND expires_at > datetime('now')`,
    args: [state],
  });

  if (stateResult.rows.length === 0) {
    return NextResponse.redirect(new URL('/cs/admin/rezervace?gcal=expired', request.url));
  }

  const userId = Number(stateResult.rows[0].user_id);
  const girlId = Number(stateResult.rows[0].girl_id);
  const redirectTo = String(stateResult.rows[0].redirect_to || '/cs/admin/rezervace');

  // Delete used state
  await db.execute({ sql: `DELETE FROM oauth_states WHERE state = ?`, args: [state] });

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return NextResponse.redirect(new URL(`${redirectTo}?gcal=error`, request.url));
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Upsert token by girl_id — ON CONFLICT handles reconnection
  await db.execute({
    sql: `INSERT INTO google_calendar_tokens (girl_id, user_id, access_token, refresh_token, token_type, expires_at, scope)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(girl_id) DO UPDATE SET
            user_id = excluded.user_id,
            access_token = excluded.access_token,
            refresh_token = excluded.refresh_token,
            token_type = excluded.token_type,
            expires_at = excluded.expires_at,
            scope = excluded.scope,
            updated_at = CURRENT_TIMESTAMP`,
    args: [girlId, userId, tokens.access_token, tokens.refresh_token, tokens.token_type, expiresAt, tokens.scope],
  });

  return NextResponse.redirect(new URL(`${redirectTo}?gcal=connected`, request.url));
}
