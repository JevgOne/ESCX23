/**
 * Telegram bot update handler — delegates to AI operator.
 * Preserves TelegramUpdate type and handleUpdate export for webhook + polling.
 */

import { answerCallbackQuery } from './telegram';
import { handleAIMessage, handleAICallback } from './telegram-ai/handler';

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

    // Fire-and-forget: don't await to avoid TG webhook timeout
    handleAIMessage(chatId, username, text).catch((err) => {
      console.error('[telegram-bot] AI handler error:', err);
    });

    return {
      type: 'message',
      from: displayName,
      text,
      response: 'processing',
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
      handleAICallback(chatId, username, data).catch((err) => {
        console.error('[telegram-bot] AI callback error:', err);
      });
    }

    return {
      type: 'callback',
      from: displayName,
      text: data,
      response: 'processing',
    };
  }

  return { type: 'unknown', response: 'ignored' };
}
