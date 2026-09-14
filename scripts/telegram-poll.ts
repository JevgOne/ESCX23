/**
 * Telegram bot — local polling mode (instead of webhook).
 * Run: npx tsx scripts/telegram-poll.ts
 *
 * 1. Deletes any existing webhook (can't have both)
 * 2. Long-polls getUpdates every 30s
 * 3. Routes each update through the same handler as the webhook route
 * 4. Ctrl+C to stop
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local BEFORE anything reads process.env
config({ path: resolve(__dirname, '..', '.env.local') });

import { handleUpdate, type TelegramUpdate } from '../lib/telegram-bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not found in .env.local');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function main() {
  // Step 1: Delete webhook so polling works
  console.log('Deleting webhook...');
  const delRes = await fetch(`${API}/deleteWebhook`);
  const delData = await delRes.json() as { ok: boolean; description?: string };
  console.log(`Webhook: ${delData.ok ? 'deleted' : delData.description}`);

  // Verify bot identity
  const meRes = await fetch(`${API}/getMe`);
  const meData = await meRes.json() as { ok: boolean; result?: { username: string } };
  if (!meData.ok) {
    console.error('Failed to connect to bot. Check your token.');
    process.exit(1);
  }
  console.log(`Bot: @${meData.result?.username}`);
  console.log('Polling started. Send a message to the bot on Telegram.');
  console.log('Press Ctrl+C to stop.\n');

  let offset = 0;
  let running = true;

  process.on('SIGINT', () => {
    console.log('\nStopping...');
    running = false;
  });

  // Step 2: Long polling loop
  while (running) {
    try {
      const url = `${API}/getUpdates?offset=${offset}&timeout=30&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'callback_query']))}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(35000) });
      const data = await res.json() as { ok: boolean; result?: TelegramUpdate[] };

      if (!data.ok || !data.result) continue;

      for (const update of data.result) {
        offset = update.update_id + 1;

        const ts = new Date().toLocaleTimeString('cs-CZ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const result = await handleUpdate(update);

        if (result.type === 'message') {
          console.log(`[${ts}] Message from ${result.from}: ${result.text}`);
          console.log(`[${ts}] Bot responds: ${stripHtml(result.response).slice(0, 120)}`);
          console.log('');
        } else if (result.type === 'callback') {
          console.log(`[${ts}] Callback from ${result.from}: ${result.text}`);
          console.log(`[${ts}] Bot responds: ${result.response}`);
          console.log('');
        }
      }
    } catch (err: unknown) {
      if (!running) break;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('abort') && !msg.includes('timeout')) {
        console.error('Poll error:', msg);
      }
    }
  }

  console.log('Stopped.');
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
