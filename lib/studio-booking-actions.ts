'use server';

import { db } from './db';
import { requireGirl } from './auth';

// ---------------------------------------------------------------------------
// Client arrived — mark booking as in_progress
// ---------------------------------------------------------------------------

export async function markClientArrived(
  bookingId: number,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireGirl();
  if (!user.girl_id) return { error: 'Ucet neni propojen s divkou.' };

  const check = await db.execute({
    sql: 'SELECT id, status, girl_id FROM bookings_v2 WHERE id = ? LIMIT 1',
    args: [bookingId],
  });

  if (check.rows.length === 0) return { error: 'Rezervace nenalezena.' };

  const row = check.rows[0];
  if (Number(row.girl_id) !== user.girl_id) {
    return { error: 'Tato rezervace ti nepatri.' };
  }
  if (String(row.status) !== 'confirmed') {
    return { error: 'Rezervace neni ve stavu "potvrzena".' };
  }

  await db.execute({
    sql: `UPDATE bookings_v2 SET status = 'in_progress', arrived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id = ?`,
    args: [user.id, bookingId],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Mark booking completed
// ---------------------------------------------------------------------------

export async function markBookingCompleted(
  bookingId: number,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireGirl();
  if (!user.girl_id) return { error: 'Ucet neni propojen s divkou.' };

  const check = await db.execute({
    sql: 'SELECT id, status, girl_id, client_id, points_earned FROM bookings_v2 WHERE id = ? LIMIT 1',
    args: [bookingId],
  });

  if (check.rows.length === 0) return { error: 'Rezervace nenalezena.' };

  const row = check.rows[0];
  if (Number(row.girl_id) !== user.girl_id) {
    return { error: 'Tato rezervace ti nepatri.' };
  }
  if (String(row.status) !== 'in_progress') {
    return { error: 'Rezervace neni ve stavu "probiha".' };
  }

  await db.execute({
    sql: `UPDATE bookings_v2 SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id = ?`,
    args: [user.id, bookingId],
  });

  // Update client total_spent
  const points = Number(row.points_earned);
  const clientId = Number(row.client_id);
  if (clientId && points > 0) {
    await db.execute({
      sql: 'UPDATE booking_clients SET total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [points, clientId],
    });
  }

  return { ok: true };
}
