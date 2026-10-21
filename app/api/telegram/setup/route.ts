import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * GET /api/telegram/setup
 * Registers the Telegram webhook URL via setWebhook API.
 * Run once after deploy (or after changing the domain).
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 });
  }

  const webhookUrl = `${SITE_URL}/api/telegram`;

  const res = await fetch(`${API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      ...(WEBHOOK_SECRET ? { secret_token: WEBHOOK_SECRET } : {}),
      allowed_updates: ['message', 'callback_query'],
    }),
  });

  const result = await res.json();

  return NextResponse.json({
    webhookUrl,
    telegramResponse: result,
  });
}
