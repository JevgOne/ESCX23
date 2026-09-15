import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const LINK_SECRET = process.env.TELEGRAM_LINK_SECRET ?? 'default-link-secret';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ---------------------------------------------------------------------------
// Telegram Bot API — low-level
// ---------------------------------------------------------------------------

export async function sendMessage(
  chatId: string | number,
  text: string,
  opts?: { parseMode?: 'HTML' | 'Markdown'; replyMarkup?: unknown },
): Promise<boolean> {
  const res = await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: opts?.parseMode ?? 'HTML',
      ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
    }),
  });
  if (!res.ok) {
    console.error('[telegram] sendMessage failed:', await res.text());
    return false;
  }
  return true;
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<boolean> {
  const res = await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
  return res.ok;
}

export async function sendPhoto(
  chatId: string | number,
  photoUrl: string,
  opts?: { caption?: string; parseMode?: 'HTML' | 'Markdown'; replyMarkup?: unknown },
): Promise<boolean> {
  const res = await fetch(`${API}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      ...(opts?.caption ? { caption: opts.caption, parse_mode: opts?.parseMode ?? 'HTML' } : {}),
      ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
    }),
  });
  if (!res.ok) {
    console.error('[telegram] sendPhoto failed:', await res.text());
    return false;
  }
  return true;
}

export async function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  parseMode = 'HTML',
): Promise<boolean> {
  const res = await fetch(`${API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.ok;
}

// ---------------------------------------------------------------------------
// Deep-link token generation & verification (HMAC-SHA256)
// ---------------------------------------------------------------------------

export function generateLinkToken(girlId: number): string {
  return crypto.createHmac('sha256', LINK_SECRET).update(`girl:${girlId}`).digest('hex').slice(0, 16);
}

export function verifyLinkToken(girlId: number, token: string): boolean {
  return generateLinkToken(girlId) === token;
}

// ---------------------------------------------------------------------------
// Outgoing notifications (called from booking actions / cron)
// ---------------------------------------------------------------------------

export async function notifyGirlNewBooking(
  chatId: string,
  bookingId: number,
  date: string,
  startTime: string,
  endTime: string,
  duration: number,
): Promise<boolean> {
  return sendMessage(chatId, [
    '📅 <b>Nová rezervace</b>',
    '',
    `Datum: ${date}`,
    `Čas: ${startTime} — ${endTime} (${duration} min)`,
    `Status: Potvrzena`,
    '',
    `Rezervace #${bookingId}`,
  ].join('\n'));
}

export async function notifyGirlBookingCancelled(
  chatId: string,
  bookingId: number,
  reason?: string,
): Promise<boolean> {
  return sendMessage(chatId, [
    '❌ <b>Zrušená rezervace</b>',
    '',
    `Rezervace #${bookingId}`,
    reason ? `Důvod: ${reason}` : '',
  ].filter(Boolean).join('\n'));
}

export async function sendBookingReminder(
  chatId: string,
  bookingId: number,
  startTime: string,
  endTime: string,
  location?: string,
): Promise<boolean> {
  return sendMessage(chatId, [
    '⏰ <b>Připomenutí — za 1 hodinu</b>',
    '',
    `${startTime} — ${endTime}`,
    location ? `Pobočka: ${location}` : '',
    '',
    `Rezervace #${bookingId}`,
  ].filter(Boolean).join('\n'));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
