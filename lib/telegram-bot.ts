/**
 * Telegram bot update handler — delegates to AI operator.
 * Preserves TelegramUpdate type and handleUpdate export for webhook + polling.
 */

import { answerCallbackQuery, editMessageReplyMarkup, sendMessage, verifyLinkToken, verifyUserLinkToken } from './telegram';
import { handleAIMessage, handleAICallback } from './telegram-ai/handler';
import { handleBookingCallback, handlePromoCodeInput } from './telegram-ai/booking-flow';
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
    message?: { message_id: number; chat: { id: number } };
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

    // Girl deep-link activation: /start GIRL_{token}
    if (text.startsWith('/start GIRL_')) {
      const token = text.replace('/start GIRL_', '');
      try {
        await handleGirlDeepLinkActivation(chatId, token, username);
      } catch (err) {
        console.error('[telegram-bot] Girl deep link error:', err);
      }
      return { type: 'deep_link_girl', from: displayName, text, response: 'done' };
    }

    // User (admin/operator) deep-link activation: /start USER_{token}
    if (text.startsWith('/start USER_')) {
      const token = text.replace('/start USER_', '');
      try {
        await handleUserDeepLinkActivation(chatId, token);
      } catch (err) {
        console.error('[telegram-bot] User deep link error:', err);
      }
      return { type: 'deep_link_user', from: displayName, text, response: 'done' };
    }

    // Check if user is entering a promo code (active draft in enter_promo step)
    try {
      const promoHandled = await handlePromoCodeInput(chatId, text);
      if (promoHandled) {
        return { type: 'promo_code', from: displayName, text, response: 'done' };
      }
    } catch (err) {
      console.error('[telegram-bot] Promo code error:', err);
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
        // Remove inline keyboard from clicked message (prevents re-clicks)
        const msgId = cq.message?.message_id;
        if (msgId) {
          editMessageReplyMarkup(chatId, msgId).catch(() => {});
        }

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
          await sendMessage(chatId, 'Omlouvam se, nastala chyba pri zpracovani rezervace. Zkus to prosim znovu.').catch(() => {});
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

// ---------------------------------------------------------------------------
// Girl deep-link activation: /start GIRL_{token}
// ---------------------------------------------------------------------------

async function handleGirlDeepLinkActivation(chatId: string, token: string, username: string | null): Promise<void> {
  // Verify token by iterating active girls (HMAC is deterministic)
  const girls = await db.execute({
    sql: "SELECT id, name FROM girls WHERE status = 'active'",
    args: [],
  });

  let matchedGirl: { id: number; name: string } | null = null;
  for (const row of girls.rows) {
    const girlId = Number(row.id);
    if (verifyLinkToken(girlId, token)) {
      matchedGirl = { id: girlId, name: String(row.name) };
      break;
    }
  }

  if (!matchedGirl) {
    await sendMessage(chatId, 'Odkaz neni platny. Kontaktujte spravce.');
    return;
  }

  // Check if already linked to a different chat
  const existing = await db.execute({
    sql: 'SELECT chat_id FROM telegram_links WHERE girl_id = ? AND is_active = 1 LIMIT 1',
    args: [matchedGirl.id],
  });

  if (existing.rows.length > 0 && String(existing.rows[0].chat_id) !== chatId) {
    await sendMessage(chatId, 'Tento ucet je jiz propojen s jinym Telegram chatem.');
    return;
  }

  // Upsert into telegram_links
  await db.execute({
    sql: `INSERT INTO telegram_links (girl_id, chat_id, username, is_active, linked_at)
          VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(girl_id) DO UPDATE SET
            chat_id = ?, username = ?, is_active = 1, linked_at = CURRENT_TIMESTAMP`,
    args: [matchedGirl.id, chatId, username, chatId, username],
  });

  // Also update users table if girl has a user account
  await db.execute({
    sql: `UPDATE users SET telegram_chat_id = ?, updated_at = CURRENT_TIMESTAMP WHERE girl_id = ? AND is_active = 1`,
    args: [chatId, matchedGirl.id],
  }).catch(() => {});

  await sendMessage(chatId, [
    `<b>Propojeno!</b>`,
    '',
    `Vitej, ${matchedGirl.name}. Tvuj Telegram je propojen s tvym profilem.`,
    'Od ted budes dostavat notifikace o novych rezervacich.',
  ].join('\n'));
}

// ---------------------------------------------------------------------------
// User (admin/operator) deep-link activation: /start USER_{token}
// ---------------------------------------------------------------------------

async function handleUserDeepLinkActivation(chatId: string, token: string): Promise<void> {
  // Iterate active users and find match via HMAC verification
  const users = await db.execute({
    sql: `SELECT id, display_name, email, telegram_chat_id FROM users WHERE is_active = 1`,
    args: [],
  });

  let matchedUser: { id: number; name: string } | null = null;
  for (const row of users.rows) {
    const userId = Number(row.id);
    if (verifyUserLinkToken(userId, token)) {
      matchedUser = { id: userId, name: row.display_name ? String(row.display_name) : String(row.email) };
      break;
    }
  }

  if (!matchedUser) {
    await sendMessage(chatId, 'Odkaz neni platny. Kontaktujte spravce.');
    return;
  }

  // Check if already linked to a different chat
  const existing = await db.execute({
    sql: 'SELECT telegram_chat_id FROM users WHERE id = ? LIMIT 1',
    args: [matchedUser.id],
  });
  const existingChatId = existing.rows[0]?.telegram_chat_id ? String(existing.rows[0].telegram_chat_id) : '';
  if (existingChatId && existingChatId !== chatId) {
    await sendMessage(chatId, 'Tento ucet je jiz propojen s jinym Telegram chatem.');
    return;
  }

  // Save chat_id to users table
  await db.execute({
    sql: `UPDATE users SET telegram_chat_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [chatId, matchedUser.id],
  });

  await sendMessage(chatId, [
    `<b>Propojeno!</b>`,
    '',
    `Vitejte, ${matchedUser.name}. Vas Telegram je propojen s vasim uctem.`,
    'Od ted budete dostavat notifikace o novych rezervacich a eskalacich.',
  ].join('\n'));
}
