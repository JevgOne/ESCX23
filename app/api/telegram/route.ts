import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ---------------------------------------------------------------------------
// Telegram Bot API helpers
// ---------------------------------------------------------------------------

async function sendTgMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: unknown,
): Promise<void> {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
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
  // Get current day in Prague
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const dayOfWeek = pragueNow.getDay(); // 0=Sun, 1=Mon...
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
    '\u{1F44B} Vítej v STUDIOFLOW!',
    '',
    'Přes tohoto bota si můžeš objednat termín.',
    '',
    '\u{1F4C5} /booking — Nová rezervace',
    '\u{1F4CB} /moje — Moje rezervace',
    '\u274C /zrusit — Zrušit rezervaci',
  ].join('\n');
}

function getScheduleReminderKeyboard(girlId?: number) {
  // If girlId is provided, offer to subscribe to that specific girl's schedule
  if (girlId) {
    return {
      inline_keyboard: [
        [
          {
            text: '\u{1F514} Upozornit mě na nový rozvrh',
            callback_data: `schedule_remind:${girlId}`,
          },
        ],
      ],
    };
  }
  return undefined;
}

async function handleCommand(chatId: number, text: string): Promise<void> {
  const cmd = text.trim();

  // /start with deep link token
  if (cmd.startsWith('/start ')) {
    const _token = cmd.slice(7).trim();
    // Deep link activation — will be expanded with real linking logic later
    await sendTgMessage(chatId, '\u2705 Účet propojen!');
    return;
  }

  // Plain /start
  if (cmd === '/start') {
    await sendTgMessage(chatId, getStartMessage());
    return;
  }

  // /booking — will show current week only, with "no slots" + reminder option
  if (cmd === '/booking') {
    const { start, end } = getCurrentWeekBounds();
    const startStr = start.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
    const endStr = end.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });

    // TODO: When booking flow is implemented, check available slots for current week.
    // If no slots available → show message with reminder keyboard.
    // If slots available → start booking flow with status = 'confirmed' (not 'pending').
    await sendTgMessage(
      chatId,
      [
        `\u{1F4C5} <b>Rezervace — aktuální týden</b>`,
        `${startStr} — ${endStr}`,
        '',
        '\u{1F527} Funkce se připravuje. Brzy bude dostupná!',
        '',
        '<i>Tip: Pokud není volný termín, mohu tě upozornit když se uvolní místo.</i>',
      ].join('\n'),
    );
    return;
  }

  // /moje
  if (cmd === '/moje') {
    await sendTgMessage(chatId, '\u{1F527} Funkce se připravuje.');
    return;
  }

  // /zrusit
  if (cmd === '/zrusit') {
    await sendTgMessage(chatId, '\u{1F527} Funkce se připravuje.');
    return;
  }

  // Unknown
  await sendTgMessage(chatId, 'Nerozumím. Zkus /start pro nápovědu.');
}

// ---------------------------------------------------------------------------
// Callback query handler (inline keyboard buttons)
// ---------------------------------------------------------------------------

async function handleCallbackQuery(callbackQuery: {
  id: string;
  from: { id: number };
  message?: { chat: { id: number } };
  data?: string;
}): Promise<void> {
  const data = callbackQuery.data ?? '';
  const chatId = callbackQuery.message?.chat?.id;

  // schedule_remind:<girlId> — subscribe to schedule reminders
  if (data.startsWith('schedule_remind:') && chatId) {
    const girlId = parseInt(data.split(':')[1], 10);
    if (!isNaN(girlId)) {
      // TODO: Insert into schedule_reminders table when DB is connected
      // INSERT INTO schedule_reminders (client_telegram_id, girl_id) VALUES (chatId, girlId)
      await answerCallback(callbackQuery.id, 'Přihlášeno k upozornění!');
      await sendTgMessage(
        chatId,
        '\u{1F514} Upozorníme tě, jakmile bude nový rozvrh k dispozici.',
      );
      return;
    }
  }

  // confirm_booking:<bookingId>:yes/no — booking confirmation
  if (data.startsWith('confirm_booking:') && chatId) {
    const parts = data.split(':');
    const _bookingId = parseInt(parts[1], 10);
    const answer = parts[2];

    if (answer === 'yes') {
      await answerCallback(callbackQuery.id, 'Potvrzeno!');
      await sendTgMessage(chatId, '\u2705 Rezervace potvrzena. Těšíme se na tebe!');
    } else {
      await answerCallback(callbackQuery.id, 'Zrušeno.');
      await sendTgMessage(chatId, '\u274C Rezervace zrušena.');
    }
    return;
  }

  // Unknown callback
  await answerCallback(callbackQuery.id);
}

// ---------------------------------------------------------------------------
// POST /api/telegram — Telegram webhook endpoint
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify webhook secret if configured
  if (WEBHOOK_SECRET) {
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== WEBHOOK_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  try {
    const update = await request.json();

    // Handle message updates
    if (update.message?.text && update.message.chat?.id) {
      await handleCommand(update.message.chat.id, update.message.text);
    }

    // Handle callback queries (inline keyboard buttons)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    // Always return 200 to prevent Telegram retries
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram] Error processing update:', error);
    return NextResponse.json({ ok: true });
  }
}
