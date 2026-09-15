/**
 * Telegram bot update handler — delegates to AI operator.
 * Preserves TelegramUpdate type and handleUpdate export for webhook + polling.
 */

import { answerCallbackQuery, sendMessage } from './telegram';
import { handleAIMessage, handleAICallback } from './telegram-ai/handler';
import { handleBookingCallback } from './telegram-ai/booking-flow';
import { db } from './db';

// ---------------------------------------------------------------------------
// Telegram Update type
// ---------------------------------------------------------------------------

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; username?: string };
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string; username?: string };
    message?: { chat: { id: number } };
    data?: string;
  };
}

// ---------------------------------------------------------------------------
// Main update handler — used by both webhook and polling
// ---------------------------------------------------------------------------

export async function handleUpdate(update: TelegramUpdate): Promise<{
  type: string;
  from?: string;
  text?: string;
  response: string;
}> {
  // Text message → AI handler
  if (update.message?.text && update.message.chat?.id) {
    const from = update.message.from;
    const username = from?.username ?? null;
    const displayName = from?.username ? `@${from.username}` : from?.first_name ?? 'unknown';
    const chatId = String(update.message.chat.id);
    const text = update.message.text;

    // Deep-link activation: /start LG_{token}
    if (text.startsWith('/start LG_')) {
      const token = text.replace('/start LG_', '');
      try {
        await handleDeepLinkActivation(chatId, token);
      } catch (err) {
        console.error('[telegram-bot] Deep link error:', err);
      }
      return { type: 'deep_link', from: displayName, text, response: 'done' };
    }

    // Await AI handler — Vercel serverless kills background tasks after response
    try {
      await handleAIMessage(chatId, username, text);
    } catch (err) {
      console.error('[telegram-bot] AI handler error:', err);
    }

    return {
      type: 'message',
      from: displayName,
      text,
      response: 'done',
    };
  }

  // Callback query → translate to text and send to AI
  if (update.callback_query) {
    const cq = update.callback_query;
    const from = cq.from;
    const username = from?.username ?? null;
    const displayName = from?.username ? `@${from.username}` : from?.first_name ?? 'unknown';
    const chatId = cq.message?.chat?.id ? String(cq.message.chat.id) : null;
    const data = cq.data ?? '';

    // Always acknowledge the callback to remove loading state
    answerCallbackQuery(cq.id).catch(() => {});

    if (chatId && data) {
      // Booking flow callbacks (bk_*) — handle directly, no Claude API
      if (data.startsWith('bk_')) {
        try {
          const handled = await handleBookingCallback(chatId, data);
          if (handled) {
            return {
              type: 'booking_callback',
              from: displayName,
              text: data,
              response: 'done',
            };
          }
        } catch (err) {
          console.error('[telegram-bot] Booking callback error:', err);
        }
      }

      // All other callbacks → AI handler
      try {
        await handleAICallback(chatId, username, data);
      } catch (err) {
        console.error('[telegram-bot] AI callback error:', err);
      }
    }

    return {
      type: 'callback',
      from: displayName,
      text: data,
      response: 'done',
    };
  }

  return { type: 'unknown', response: 'ignored' };
}

// ---------------------------------------------------------------------------
// Deep-link activation — /start LG_{token}
// ---------------------------------------------------------------------------

async function handleDeepLinkActivation(chatId: string, token: string): Promise<void> {
  const result = await db.execute({
    sql: 'SELECT id, nickname, telegram_id FROM booking_clients WHERE deep_link_token = ? LIMIT 1',
    args: [token],
  });

  if (result.rows.length === 0) {
    await sendMessage(chatId, 'Odkaz neni platny. Napiste nam a pomuzeme vam.', { parseMode: 'HTML' });
    return;
  }

  const client = result.rows[0];
  const clientId = Number(client.id);
  const existingTgId = client.telegram_id ? String(client.telegram_id) : null;

  if (existingTgId && existingTgId !== chatId) {
    await sendMessage(chatId, 'Tento ucet je jiz propojen s jinym Telegram chatem.', { parseMode: 'HTML' });
    return;
  }

  // Link telegram_id to client
  await db.execute({
    sql: 'UPDATE booking_clients SET telegram_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [chatId, clientId],
  });

  // Upsert telegram_users
  try {
    await db.execute({
      sql: `INSERT INTO telegram_users (telegram_user_id, client_id, chat_id, activation_token, is_active, activated_at)
            VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(telegram_user_id) DO UPDATE SET client_id = ?, chat_id = ?, activated_at = CURRENT_TIMESTAMP`,
      args: [chatId, clientId, chatId, token, clientId, chatId],
    });
  } catch { /* telegram_users table might not exist yet */ }

  const nickname = client.nickname ? String(client.nickname) : 'klient';
  await sendMessage(chatId, [
    '<b>Vas ucet byl uspesne propojen!</b>',
    '',
    `Vitejte, ${nickname}. Nyni muzete pres tento chat:`,
    '  Vytvaret rezervace',
    '  Sledovat oblibene divky',
    '  Dostavat upozorneni na novy rozvrh',
    '',
    'Napiste <b>cokoliv</b> a nase operatorka vam pomuze.',
  ].join('\n'), { parseMode: 'HTML' });
}
