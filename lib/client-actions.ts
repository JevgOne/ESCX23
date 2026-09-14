'use server';

import { db } from './db';
import { requireBooking } from './auth';

// ---------------------------------------------------------------------------
// Update client notes
// ---------------------------------------------------------------------------

export async function updateClientNotes(
  clientId: number,
  notes: string,
): Promise<{ ok: true } | { error: string }> {
  await requireBooking();

  await db.execute({
    sql: 'UPDATE booking_clients SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [notes || null, clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Update trust level
// ---------------------------------------------------------------------------

const VALID_TRUST_LEVELS = ['new', 'verified', 'regular', 'vip'];

export async function updateClientTrustLevel(
  clientId: number,
  trustLevel: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireBooking();
  if (user.role !== 'admin') {
    return { error: 'Pouze admin muze menit trust level.' };
  }

  if (!VALID_TRUST_LEVELS.includes(trustLevel)) {
    return { error: 'Neplatny trust level.' };
  }

  await db.execute({
    sql: 'UPDATE booking_clients SET trust_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [trustLevel, clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Ban / unban client
// ---------------------------------------------------------------------------

export async function toggleClientBan(
  clientId: number,
  ban: boolean,
  reason?: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireBooking();
  if (user.role !== 'admin') {
    return { error: 'Pouze admin muze banovat klienty.' };
  }

  await db.execute({
    sql: 'UPDATE booking_clients SET is_banned = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [ban ? 1 : 0, ban ? (reason ?? null) : null, clientId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Update client basic info (nickname)
// ---------------------------------------------------------------------------

export async function updateClientNickname(
  clientId: number,
  nickname: string,
): Promise<{ ok: true } | { error: string }> {
  await requireBooking();

  if (!nickname.trim()) {
    return { error: 'Prezdivka nemuze byt prazdna.' };
  }

  await db.execute({
    sql: 'UPDATE booking_clients SET nickname = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [nickname.trim(), clientId],
  });

  return { ok: true };
}
