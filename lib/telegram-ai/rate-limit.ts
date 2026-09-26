import { db } from '../db';
import { hashForSearch } from '../crypto';

const MAX_PER_MINUTE = 20;
const MAX_PER_HOUR = 100;

/**
 * Check if chat_id is rate-limited.
 * Returns null if OK, or an error message string if limited.
 */
export async function checkRateLimit(chatId: string): Promise<string | null> {
  try {
    const now = new Date();

    // Check per-minute (sliding window)
    const minuteAgo = new Date(now.getTime() - 60_000).toISOString();
    const minResult = await db.execute({
      sql: `SELECT COALESCE(SUM(message_count), 0) AS cnt
            FROM telegram_rate_limits
            WHERE chat_id = ? AND window_start >= ?`,
      args: [chatId, minuteAgo],
    });
    if (Number(minResult.rows[0]?.cnt ?? 0) >= MAX_PER_MINUTE) {
      return 'Prilis mnoho zprav. Zkus to za par minut.';
    }

    // Check per-hour
    const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
    const hourResult = await db.execute({
      sql: `SELECT COALESCE(SUM(message_count), 0) AS cnt
            FROM telegram_rate_limits
            WHERE chat_id = ? AND window_start >= ?`,
      args: [chatId, hourAgo],
    });
    if (Number(hourResult.rows[0]?.cnt ?? 0) >= MAX_PER_HOUR) {
      return 'Prilis mnoho zprav. Zkus to pozdeji.';
    }

    // Record this message
    const windowStart = new Date(
      Math.floor(now.getTime() / 60_000) * 60_000,
    ).toISOString();
    await db.execute({
      sql: `INSERT INTO telegram_rate_limits (chat_id, window_start, message_count)
            VALUES (?, ?, 1)
            ON CONFLICT(chat_id, window_start)
            DO UPDATE SET message_count = message_count + 1`,
      args: [chatId, windowStart],
    });

    return null;
  } catch (error) {
    console.error('[telegram-ai] Rate limit check failed:', error);
    return null; // Fail open — don't block on rate limit errors
  }
}

/**
 * Check for spam (3x same message in 1 minute).
 */
export async function checkSpam(chatId: string, message: string): Promise<boolean> {
  try {
    const minuteAgo = new Date(Date.now() - 60_000).toISOString();
    const msgHmac = hashForSearch(message);
    const result = await db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM telegram_messages
            WHERE chat_id = ? AND role = 'user' AND content_hmac = ? AND created_at >= ?`,
      args: [chatId, msgHmac, minuteAgo],
    });
    return Number(result.rows[0]?.cnt ?? 0) >= 3;
  } catch {
    return false;
  }
}
