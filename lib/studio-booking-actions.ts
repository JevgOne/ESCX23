'use server';

import { db } from './db';
import { requireGirl } from './auth';
import { calculateTrustLevel, checkLoyaltyDiscount } from './booking-loyalty';

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

  // Update client stats
  const points = Number(row.points_earned);
  const clientId = Number(row.client_id);
  if (clientId) {
    // Increment total_visits, add points
    await db.execute({
      sql: `UPDATE booking_clients
            SET total_visits = total_visits + 1,
                total_points = total_points + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [points, clientId],
    });

    // Get updated stats for trust level calculation
    const clientRes = await db.execute({
      sql: 'SELECT total_visits, no_show_count, trust_level, telegram_id FROM booking_clients WHERE id = ?',
      args: [clientId],
    });
    if (clientRes.rows.length > 0) {
      const c = clientRes.rows[0];
      const visits = Number(c.total_visits);
      const noShows = Number(c.no_show_count);
      const currentTrust = String(c.trust_level);
      const telegramId = c.telegram_id ? String(c.telegram_id) : null;

      // Auto-update trust level
      const newTrust = calculateTrustLevel(visits, noShows);
      if (newTrust !== currentTrust) {
        await db.execute({
          sql: 'UPDATE booking_clients SET trust_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          args: [newTrust, clientId],
        });
      }

      // Check loyalty discount (every 5th visit)
      const discount = checkLoyaltyDiscount(visits, newTrust);
      if (discount.eligible && telegramId) {
        // Notify client about earned discount via Telegram
        const { sendMessage } = await import('./telegram');
        await sendMessage(telegramId, [
          `🎉 Gratulujeme! Toto byla vase ${discount.visitNumber}. navsteva!`,
          `💰 Ziskali jste slevu ${discount.amount} Kc na dalsi rezervaci.`,
          '',
          'Sleva bude automaticky aplikovana pri dalsi rezervaci.',
        ].join('\n')).catch(() => {});
      }
    }
  }

  return { ok: true };
}
