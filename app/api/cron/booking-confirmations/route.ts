import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendMessage } from '@/lib/telegram';

/**
 * Cron: every 15 minutes.
 *
 * 1. Send confirmation reminders to new clients 2h before booking
 *    (needs_confirmation=1, confirmation_sent_at IS NULL, confirmation_due_at <= now)
 *
 * 2. Cancel unconfirmed bookings 1h before
 *    (needs_confirmation=1, confirmation_sent_at IS NOT NULL, confirmed_at IS NULL,
 *     booking starts within 1h)
 *
 * 3. Notify interested clients about freed slots
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = getPragueNow();
  const todayStr = formatDate(now);
  const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let remindersSent = 0;
  let bookingsCancelled = 0;
  let interestNotified = 0;

  // ── Step 1: Send confirmation reminders ──────────────────────────
  // Find bookings where confirmation_due_at has passed but reminder not yet sent
  const pendingReminders = await db.execute({
    sql: `SELECT b.id, b.client_id, b.girl_id, b.date, b.start_time, b.end_time,
                 b.duration_minutes, b.price, g.name AS girl_name,
                 bc.telegram_id AS chat_id
          FROM bookings_v2 b
          JOIN girls g ON g.id = b.girl_id
          JOIN booking_clients bc ON bc.id = b.client_id
          WHERE b.needs_confirmation = 1
            AND b.confirmation_sent_at IS NULL
            AND b.confirmation_due_at <= ?
            AND b.status = 'confirmed'
            AND bc.telegram_id IS NOT NULL`,
    args: [new Date().toISOString()],
  });

  for (const row of pendingReminders.rows) {
    const chatId = String(row.chat_id);
    const bookingId = Number(row.id);
    const girlName = String(row.girl_name);
    const date = String(row.date);
    const startTime = String(row.start_time).substring(0, 5);
    const endTime = String(row.end_time).substring(0, 5);
    const price = Number(row.price);

    const msg = [
      `\u{1F514} <b>Potvrzeni rezervace</b>`,
      '',
      `\u{1F469} ${girlName}`,
      `\u{1F4C5} ${formatDisplayDate(date)}`,
      `\u23F0 ${startTime} — ${endTime}`,
      `\u{1F4B0} ${price} CZK`,
      '',
      `Potvrd prosim svou rezervaci. Pokud nepotvrdis do 1h pred terminem, misto bude nabidnuto nekomu jinemu.`,
    ].join('\n');

    const sent = await sendMessage(chatId, msg, {
      replyMarkup: {
        inline_keyboard: [
          [
            { text: '\u2705 Potvrzuji', callback_data: `bk_remind_ok:${bookingId}` },
            { text: '\u274C Rusim', callback_data: `bk_remind_cancel:${bookingId}` },
          ],
        ],
      },
    });

    if (sent) {
      await db.execute({
        sql: `UPDATE bookings_v2 SET confirmation_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [bookingId],
      });
      remindersSent++;
    }
  }

  // ── Step 2: Expire pending bot bookings (1h before start) ────────
  // These are created by the Telegram booking flow for new clients
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const cutoffTime = `${String(oneHourFromNow.getHours()).padStart(2, '0')}:${String(oneHourFromNow.getMinutes()).padStart(2, '0')}`;

  const pendingBotBookings = await db.execute({
    sql: `SELECT b.id, b.client_id, b.girl_id, b.date, b.start_time, b.end_time,
                 b.price, g.name AS girl_name,
                 bc.telegram_id AS chat_id
          FROM bookings_v2 b
          JOIN girls g ON g.id = b.girl_id
          JOIN booking_clients bc ON bc.id = b.client_id
          WHERE b.status = 'pending'
            AND b.date = ?
            AND b.start_time <= ?
            AND bc.telegram_id IS NOT NULL`,
    args: [todayStr, cutoffTime],
  });

  for (const row of pendingBotBookings.rows) {
    const bookingId = Number(row.id);
    const chatId = String(row.chat_id);
    const girlName = String(row.girl_name);
    const girlId = Number(row.girl_id);
    const date = String(row.date);
    const startTime = String(row.start_time).substring(0, 5);
    const endTime = String(row.end_time).substring(0, 5);

    await db.execute({
      sql: `UPDATE bookings_v2
            SET status = 'expired', cancel_reason = 'Nepotvrzeno novym klientem',
                cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending'`,
      args: [bookingId],
    });

    await db.execute({
      sql: `DELETE FROM slot_locks WHERE locked_by = ?`,
      args: [`booking:${bookingId}`],
    }).catch(() => {});

    await sendMessage(chatId,
      `\u274C <b>${girlName}</b>, ${formatDisplayDate(date)} v ${startTime} — rezervace zrusena. Nepotvrdil/a jsi vcas. Napis kdykoliv pro novy termin \u{1F60A}`
    );

    bookingsCancelled++;
  }

  // ── Step 3: Cancel unconfirmed bookings with needs_confirmation flag ──
  const unconfirmed = await db.execute({
    sql: `SELECT b.id, b.client_id, b.girl_id, b.date, b.start_time, b.end_time,
                 b.price, g.name AS girl_name,
                 bc.telegram_id AS chat_id
          FROM bookings_v2 b
          JOIN girls g ON g.id = b.girl_id
          JOIN booking_clients bc ON bc.id = b.client_id
          WHERE b.needs_confirmation = 1
            AND b.confirmation_sent_at IS NOT NULL
            AND b.confirmed_at IS NULL
            AND b.status = 'confirmed'
            AND b.date = ?
            AND b.start_time <= ?
            AND bc.telegram_id IS NOT NULL`,
    args: [todayStr, cutoffTime],
  });

  for (const row of unconfirmed.rows) {
    const bookingId = Number(row.id);
    const chatId = String(row.chat_id);
    const girlName = String(row.girl_name);
    const girlId = Number(row.girl_id);
    const date = String(row.date);
    const startTime = String(row.start_time).substring(0, 5);
    const endTime = String(row.end_time).substring(0, 5);

    await db.execute({
      sql: `UPDATE bookings_v2
            SET status = 'expired', cancel_reason = 'Nepotvrzeno novym klientem',
                cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'confirmed'`,
      args: [bookingId],
    });

    await db.execute({
      sql: `DELETE FROM slot_locks WHERE locked_by = ?`,
      args: [`booking:${bookingId}`],
    }).catch(() => {});

    await sendMessage(chatId,
      `\u274C <b>${girlName}</b>, ${formatDisplayDate(date)} v ${startTime} — rezervace zrusena. Nepotvrdil/a jsi vcas. Napis kdykoliv pro novy termin \u{1F60A}`
    );

    bookingsCancelled++;

    // ── Step 4: Notify interested clients about freed slot ─────────
    const interested = await db.execute({
      sql: `SELECT DISTINCT bi.telegram_chat_id
            FROM booking_interest bi
            WHERE bi.girl_id = ? AND bi.date = ?
              AND bi.telegram_chat_id != ?
              AND bi.created_at > datetime('now', '-24 hours')`,
      args: [girlId, date, chatId],
    });

    for (const intRow of interested.rows) {
      const intChatId = String(intRow.telegram_chat_id);
      const sent = await sendMessage(intChatId, [
        `\u{1F525} <b>Uvolnil se termin!</b>`,
        '',
        `\u{1F469} ${girlName}`,
        `\u23F0 ${startTime} — ${endTime} (${formatDisplayDate(date)})`,
        '',
        `Chces rezervovat? Napis mi \u{1F60A}`,
      ].join('\n'));

      if (sent) interestNotified++;
    }

    await db.execute({
      sql: `DELETE FROM booking_interest WHERE girl_id = ? AND date = ?`,
      args: [girlId, date],
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    remindersSent,
    bookingsCancelled,
    interestNotified,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────

function getPragueNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(date: string): string {
  const d = new Date(date + 'T12:00:00');
  const days = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];
  return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
}
