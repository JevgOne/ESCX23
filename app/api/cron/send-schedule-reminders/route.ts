import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendMessage } from '@/lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';

/**
 * Monday cron (0:05 Prague) — send schedule reminders.
 * Queries schedule_reminders table, checks if the girl has any schedule
 * this week, and notifies subscribed Telegram users.
 * After sending, deletes the reminder rows (one-shot).
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 });
  }

  // Fetch all pending reminders with girl info
  const reminders = await db.execute(`
    SELECT sr.id, sr.client_telegram_id, sr.girl_id, g.name as girl_name
    FROM schedule_reminders sr
    LEFT JOIN girls g ON g.id = sr.girl_id
    ORDER BY sr.girl_id
  `);

  let sent = 0;
  let failed = 0;
  const processedIds: number[] = [];

  for (const row of reminders.rows) {
    const chatId = row.client_telegram_id as string;
    const girlName = (row.girl_name as string) ?? 'Dívka';
    const reminderId = row.id as number;

    const ok = await sendMessage(chatId, [
      `\u{1F4C5} <b>Nový týden — nové termíny!</b>`,
      '',
      `${girlName} má tento týden volné termíny.`,
      '',
      'Napiš /booking pro rezervaci.',
    ].join('\n'));

    if (ok) {
      sent++;
    } else {
      failed++;
    }
    processedIds.push(reminderId);
  }

  // Delete processed reminders (one-shot — they subscribed for one notification)
  if (processedIds.length > 0) {
    const placeholders = processedIds.map(() => '?').join(',');
    await db.execute({
      sql: `DELETE FROM schedule_reminders WHERE id IN (${placeholders})`,
      args: processedIds,
    });
  }

  return NextResponse.json({
    success: true,
    total: reminders.rows.length,
    sent,
    failed,
    deleted: processedIds.length,
  });
}
