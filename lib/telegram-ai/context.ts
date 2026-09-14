import { db } from '../db';
import type { ClientContext } from './types';

/**
 * Build client context from Telegram chat ID.
 * Checks telegram_users → booking_clients chain.
 */
export async function buildClientContext(
  chatId: string,
  username: string | null,
): Promise<ClientContext> {
  const base: ClientContext = {
    chatId,
    telegramUsername: username,
    isRegistered: false,
    clientId: null,
    nickname: null,
    clientNumber: null,
    totalVisits: 0,
    trustLevel: 'new',
    isBanned: false,
    favoriteGirls: [],
  };

  try {
    // Find client via telegram_users or booking_clients.telegram_id
    const clientResult = await db.execute({
      sql: `
        SELECT bc.id, bc.nickname, bc.client_number, bc.total_visits,
               bc.trust_level, bc.is_banned
        FROM booking_clients bc
        WHERE bc.telegram_id = ?
        LIMIT 1
      `,
      args: [chatId],
    });

    if (clientResult.rows.length === 0) return base;

    const c = clientResult.rows[0];
    const clientId = Number(c.id);

    // Get favorite girls (most visited)
    const favResult = await db.execute({
      sql: `
        SELECT g.name
        FROM bookings_v2 b
        JOIN girls g ON g.id = b.girl_id
        WHERE b.client_id = ? AND b.status = 'completed'
        GROUP BY b.girl_id
        ORDER BY COUNT(*) DESC
        LIMIT 3
      `,
      args: [clientId],
    });

    return {
      ...base,
      isRegistered: true,
      clientId,
      nickname: c.nickname ? String(c.nickname) : null,
      clientNumber: c.client_number ? String(c.client_number) : null,
      totalVisits: Number(c.total_visits ?? 0),
      trustLevel: String(c.trust_level ?? 'new'),
      isBanned: Boolean(c.is_banned),
      favoriteGirls: favResult.rows.map((r) => String(r.name)),
    };
  } catch (error) {
    console.error('[telegram-ai] Failed to build client context:', error);
    return base;
  }
}
