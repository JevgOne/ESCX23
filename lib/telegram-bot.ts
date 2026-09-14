/**
 * Telegram bot update handler — shared between webhook route and polling script.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ---------------------------------------------------------------------------
// Telegram Bot API helpers
// ---------------------------------------------------------------------------

async function sendTgMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: unknown,
): Promise<void> {
  const res = await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
  if (!res.ok) {
    console.error('[telegram] sendMessage failed:', await res.text());
  }
}

async function answerCallback(callbackQueryId: string, text?: string): Promise<void> {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

// ---------------------------------------------------------------------------
// Current week boundaries (Prague timezone)
// ---------------------------------------------------------------------------

function getCurrentWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const dayOfWeek = pragueNow.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(pragueNow);
  monday.setDate(pragueNow.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

function getStartMessage(): string {
  return [
    '\u{1F44B} V\u00EDtej v STUDIOFLOW!',
    '',
    'P\u0159es tohoto bota si m\u016F\u017Ee\u0161 objednat term\u00EDn.',
    '',
    '\u{1F4C5} /booking \u2014 Nov\u00E1 rezervace',
    '\u{1F4CB} /moje \u2014 Moje rezervace',
    '\u274C /zrusit \u2014 Zru\u0161it rezervaci',
  ].join('\n');
}

async function handleCommand(chatId: number, text: string): Promise<string> {
  const cmd = text.trim();

  if (cmd.startsWith('/start ')) {
    const _token = cmd.slice(7).trim();
    await sendTgMessage(chatId, '\u2705 \u00DA\u010Det propojen!');
    return '\u2705 Účet propojen!';
  }

  if (cmd === '/start') {
    const msg = getStartMessage();
    await sendTgMessage(chatId, msg);
    return msg;
  }

  if (cmd === '/booking') {
    const { start, end } = getCurrentWeekBounds();
    const startStr = start.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
    const endStr = end.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
    const msg = [
      `\u{1F4C5} <b>Rezervace \u2014 aktu\u00E1ln\u00ED t\u00FDden</b>`,
      `${startStr} \u2014 ${endStr}`,
      '',
      '\u{1F527} Funkce se p\u0159ipravuje. Brzy bude dostupn\u00E1!',
      '',
      '<i>Tip: Pokud nen\u00ED voln\u00FD term\u00EDn, mohu t\u011B upozornit kdy\u017E se uvoln\u00ED m\u00EDsto.</i>',
    ].join('\n');
    await sendTgMessage(chatId, msg);
    return msg;
  }

  if (cmd === '/moje') {
    await sendTgMessage(chatId, '\u{1F527} Funkce se p\u0159ipravuje.');
    return 'Funkce se připravuje.';
  }

  if (cmd === '/zrusit') {
    await sendTgMessage(chatId, '\u{1F527} Funkce se p\u0159ipravuje.');
    return 'Funkce se připravuje.';
  }

  await sendTgMessage(chatId, 'Nerozum\u00EDm. Zkus /start pro n\u00E1pov\u011Bdu.');
  return 'Nerozumím.';
}

// ---------------------------------------------------------------------------
// Callback query handler
// ---------------------------------------------------------------------------

async function handleCallbackQuery(callbackQuery: {
  id: string;
  from: { id: number };
  message?: { chat: { id: number } };
  data?: string;
}): Promise<string> {
  const data = callbackQuery.data ?? '';
  const chatId = callbackQuery.message?.chat?.id;

  if (data.startsWith('schedule_remind:') && chatId) {
    const girlId = parseInt(data.split(':')[1], 10);
    if (!isNaN(girlId)) {
      await answerCallback(callbackQuery.id, 'P\u0159ihl\u00E1\u0161eno k upozorn\u011Bn\u00ED!');
      await sendTgMessage(chatId, '\u{1F514} Upozorn\u00EDme t\u011B, jakmile bude nov\u00FD rozvrh k dispozici.');
      return 'Přihlášeno k upozornění';
    }
  }

  if (data.startsWith('confirm_booking:') && chatId) {
    const parts = data.split(':');
    const answer = parts[2];
    if (answer === 'yes') {
      await answerCallback(callbackQuery.id, 'Potvrzeno!');
      await sendTgMessage(chatId, '\u2705 Rezervace potvrzena. T\u011B\u0161\u00EDme se na tebe!');
      return 'Booking confirmed';
    } else {
      await answerCallback(callbackQuery.id, 'Zru\u0161eno.');
      await sendTgMessage(chatId, '\u274C Rezervace zru\u0161ena.');
      return 'Booking cancelled';
    }
  }

  await answerCallback(callbackQuery.id);
  return 'Unknown callback';
}

// ---------------------------------------------------------------------------
// Main update handler — used by both webhook and polling
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

export async function handleUpdate(update: TelegramUpdate): Promise<{
  type: string;
  from?: string;
  text?: string;
  response: string;
}> {
  if (update.message?.text && update.message.chat?.id) {
    const from = update.message.from;
    const username = from?.username ? `@${from.username}` : from?.first_name ?? 'unknown';
    const response = await handleCommand(update.message.chat.id, update.message.text);
    return {
      type: 'message',
      from: username,
      text: update.message.text,
      response,
    };
  }

  if (update.callback_query) {
    const from = update.callback_query.from;
    const username = from?.username ? `@${from.username}` : from?.first_name ?? 'unknown';
    const response = await handleCallbackQuery(update.callback_query);
    return {
      type: 'callback',
      from: username,
      text: update.callback_query.data,
      response,
    };
  }

  return { type: 'unknown', response: 'ignored' };
}
