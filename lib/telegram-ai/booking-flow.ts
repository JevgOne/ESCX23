/**
 * Structured booking flow — inline keyboard buttons, NO Claude API calls.
 *
 * Flow: AI identifies girl → startBookingFlow() creates draft →
 *   Step 1: Show available time slots as buttons
 *   Step 2: Show duration options as buttons
 *   Step 3: Show summary + Confirm/Cancel
 *   Step 4: Create booking from draft
 *
 * Callback prefixes:
 *   bk_time:{sessionId}:{HH:MM}   — time slot selected
 *   bk_dur:{sessionId}:{minutes}   — duration selected
 *   bk_ok:{sessionId}              — confirm booking
 *   bk_cancel:{sessionId}          — cancel booking flow
 */

import { db } from '../db';
import { sendMessage } from '../telegram';
import { logAudit } from '../audit';
import { createBookingNotification } from '../booking-notifications';
import type { ClientContext } from './types';

// ---------------------------------------------------------------------------
// Prague timezone helpers (duplicated from tool-handlers to avoid circular deps)
// ---------------------------------------------------------------------------

function getPragueNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
}

function getPragueToday(): string {
  const d = getPragueNow();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function generateSessionId(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Convert JS getDay() (Sun=0..Sat=6) to DB convention (Mon=0..Sun=6). */
function toDbDayOfWeek(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

// ---------------------------------------------------------------------------
// Step 1: Start booking flow — called by AI tool handler
// ---------------------------------------------------------------------------

export interface StartBookingResult {
  sessionId: string;
  girlName: string;
  date: string;
  message: string;
}

/**
 * Called when AI tool startBookingFlow is triggered.
 * Creates a booking_draft and sends time slot buttons to user.
 */
export async function startBookingFlow(
  chatId: string,
  ctx: ClientContext,
  girlId: number,
  date: string,
): Promise<StartBookingResult> {
  // Validate client can book
  if (!ctx.isRegistered || !ctx.clientId) {
    throw new Error('Pro rezervaci musis byt registrovany klient. Rekni mi sve jmeno a zaregistruji te.');
  }

  // Cancel any existing active draft for this chat
  await db.execute({
    sql: `UPDATE booking_drafts SET expires_at = datetime('now'), updated_at = CURRENT_TIMESTAMP
          WHERE telegram_chat_id = ? AND is_converted = 0 AND expires_at > datetime('now')`,
    args: [chatId],
  }).catch(() => {});

  // Get girl info
  const girlResult = await db.execute({
    sql: `SELECT id, name FROM girls WHERE id = ? AND status IN ('active', 'inactive') LIMIT 1`,
    args: [girlId],
  });
  if (girlResult.rows.length === 0) {
    throw new Error('Divka nenalezena.');
  }
  const girlName = String(girlResult.rows[0].name);

  // Get available time slots
  const slots = await getAvailableSlots(girlId, date);
  if (slots.length === 0) {
    throw new Error(`${girlName} nema v ${date} zadne volne casy.`);
  }

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30min expiry per flow diagram

  await db.execute({
    sql: `INSERT INTO booking_drafts
            (client_id, telegram_chat_id, girl_id, date, channel, session_id, step, expires_at)
          VALUES (?, ?, ?, ?, 'telegram', ?, 'select_time', ?)`,
    args: [ctx.clientId, chatId, girlId, date, sessionId, expiresAt],
  });

  // Build time slot keyboard (max 3 buttons per row)
  const keyboard = buildTimeSlotKeyboard(sessionId, slots);

  // Send message with buttons
  const msg = `\u23F0 <b>${girlName}</b> — ${formatDate(date)}\n\nVyber cas:`;
  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        ...keyboard,
        [{ text: '\u274C Zrusit', callback_data: `bk_cancel:${sessionId}` }],
      ],
    },
  });

  return {
    sessionId,
    girlName,
    date,
    message: `Booking flow started for ${girlName} on ${date}`,
  };
}

// ---------------------------------------------------------------------------
// Step 2: Time selected → show duration options
// ---------------------------------------------------------------------------

export async function handleTimeSelected(
  chatId: string,
  sessionId: string,
  time: string,
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft) {
    await sendMessage(chatId, 'Tato rezervace vyprsela. Zacni prosim znovu.');
    return;
  }

  // Prevent double-click: if already past time selection, ignore
  if (draft.step !== 'select_time') {
    return; // silently ignore — user already clicked a time
  }

  // Update draft atomically (step change prevents race condition)
  await db.execute({
    sql: `UPDATE booking_drafts
          SET start_time = ?, step = 'select_duration', updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ? AND step = 'select_time'`,
    args: [time, sessionId],
  });

  // Get available durations based on remaining shift time
  const durations = await getAvailableDurations(draft.girlId, draft.date, time);

  // Build duration keyboard
  const keyboard = durations.map((d) => [{
    text: `${d.minutes} min — ${d.price} CZK`,
    callback_data: `bk_dur:${sessionId}:${d.minutes}`,
  }]);

  const msg = `\u23F0 <b>${draft.girlName}</b> — ${formatDate(draft.date)} v <b>${time}</b>\n\nVyber delku programu:`;
  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        ...keyboard,
        [
          { text: '\u2B05 Zpet', callback_data: `bk_back:${sessionId}` },
          { text: '\u274C Zrusit', callback_data: `bk_cancel:${sessionId}` },
        ],
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// Step 3: Duration selected → show confirmation
// ---------------------------------------------------------------------------

export async function handleDurationSelected(
  chatId: string,
  sessionId: string,
  durationMinutes: number,
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft || !draft.startTime) {
    await sendMessage(chatId, 'Tato rezervace vyprsela. Zacni prosim znovu.');
    return;
  }

  // Prevent double-click on duration
  if (draft.step !== 'select_duration') {
    return;
  }

  const endTime = addMinutes(draft.startTime, durationMinutes);

  // Get price
  const priceResult = await db.execute({
    sql: 'SELECT price, night_price FROM pricing_plans WHERE duration = ? LIMIT 1',
    args: [durationMinutes],
  });
  const priceRow = priceResult.rows[0];
  const [sh] = draft.startTime.split(':').map(Number);
  const isNight = sh >= 22 || sh < 6;
  const price = priceRow
    ? (isNight && priceRow.night_price ? Number(priceRow.night_price) : Number(priceRow.price))
    : 0;

  // Update draft
  await db.execute({
    sql: `UPDATE booking_drafts
          SET end_time = ?, duration_minutes = ?, step = 'confirm', updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ?`,
    args: [endTime, durationMinutes, sessionId],
  });

  // Show confirmation
  const msg = [
    `\u{1F4CB} <b>Shrnutí rezervace</b>`,
    '',
    `\u{1F469} ${draft.girlName}`,
    `\u{1F4C5} ${formatDate(draft.date)}`,
    `\u23F0 ${draft.startTime} — ${endTime} (${durationMinutes} min)`,
    `\u{1F4B0} ${price} CZK`,
    '',
    'Potvrdis?',
  ].join('\n');

  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        [
          { text: '\u2705 Potvrdit', callback_data: `bk_ok:${sessionId}` },
          { text: '\u274C Zrusit', callback_data: `bk_cancel:${sessionId}` },
        ],
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// Step 4: Confirm → create real booking
// ---------------------------------------------------------------------------

export async function handleConfirm(
  chatId: string,
  sessionId: string,
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft || !draft.startTime || !draft.endTime || !draft.durationMinutes || !draft.clientId) {
    await sendMessage(chatId, 'Tato rezervace vyprsela. Zacni prosim znovu.');
    return;
  }

  // Prevent double-click on confirm
  if (draft.step !== 'confirm') {
    return;
  }

  // Check slot is still available
  const conflictCheck = await db.execute({
    sql: `SELECT id FROM bookings_v2
          WHERE girl_id = ? AND date = ?
            AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired')
            AND start_time < ? AND end_time > ?`,
    args: [draft.girlId, draft.date, draft.endTime, draft.startTime],
  });

  if (conflictCheck.rows.length > 0) {
    await sendMessage(chatId, '\u274C Tento cas je bohužel uz obsazeny. Zacni prosim znovu.');
    await expireDraft(sessionId);
    return;
  }

  // Get price
  const priceResult = await db.execute({
    sql: 'SELECT price, night_price FROM pricing_plans WHERE duration = ? LIMIT 1',
    args: [draft.durationMinutes],
  });
  const priceRow = priceResult.rows[0];
  const [sh] = draft.startTime.split(':').map(Number);
  const isNight = sh >= 22 || sh < 6;
  const price = priceRow
    ? (isNight && priceRow.night_price ? Number(priceRow.night_price) : Number(priceRow.price))
    : 0;

  // Create slot lock
  try {
    await db.execute({
      sql: `INSERT INTO slot_locks (girl_id, date, start_time, end_time, locked_by, expires_at)
            VALUES (?, ?, ?, ?, 'booking_flow', datetime('now', '+5 minutes'))`,
      args: [draft.girlId, draft.date, draft.startTime, draft.endTime],
    });
  } catch {
    await sendMessage(chatId, '\u274C Slot je prave obsazovany nekym jinym. Zkus jiny cas.');
    await expireDraft(sessionId);
    return;
  }

  // Determine if new client needs confirmation (2h before)
  const clientRes = await db.execute({
    sql: 'SELECT trust_level, total_visits FROM booking_clients WHERE id = ? LIMIT 1',
    args: [draft.clientId],
  });
  const trustLevel = clientRes.rows[0] ? String(clientRes.rows[0].trust_level) : 'new';
  const visits = clientRes.rows[0] ? Number(clientRes.rows[0].total_visits) : 0;
  const isNewClient = visits === 0 || trustLevel === 'new';

  // Calculate confirmation_due_at (2h before booking) for new clients
  let confirmationDueAt: string | null = null;
  if (isNewClient) {
    const [bh, bm] = draft.startTime.split(':').map(Number);
    const bookingDate = new Date(draft.date + 'T00:00:00+02:00'); // Prague timezone
    bookingDate.setHours(bh - 2, bm, 0, 0); // 2h before
    confirmationDueAt = bookingDate.toISOString();
  }

  // All bookings are confirmed — new clients just need to re-confirm 2h before
  const bookingResult = await db.execute({
    sql: `INSERT INTO bookings_v2 (
            client_id, girl_id, date, start_time, end_time, duration_minutes,
            price, points_earned, status, needs_confirmation, confirmation_due_at,
            source, channel, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, 'booking_flow', 'telegram', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [draft.clientId, draft.girlId, draft.date, draft.startTime, draft.endTime, draft.durationMinutes, price, price, isNewClient ? 1 : 0, confirmationDueAt],
  });

  const bookingId = Number(bookingResult.lastInsertRowid);

  // Update slot lock
  await db.execute({
    sql: `UPDATE slot_locks SET locked_by = ? WHERE girl_id = ? AND date = ? AND start_time = ? AND end_time = ?`,
    args: [`booking:${bookingId}`, draft.girlId, draft.date, draft.startTime, draft.endTime],
  }).catch(() => {});

  // Mark draft as converted
  await db.execute({
    sql: `UPDATE booking_drafts SET is_converted = 1, converted_to_id = ?, step = 'confirm', updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ?`,
    args: [bookingId, sessionId],
  });

  // Audit log
  logAudit({
    bookingId,
    userId: draft.clientId,
    action: 'booking.create',
    actorType: 'bot',
    entityType: 'booking',
    entityId: bookingId,
    details: { source: 'booking_flow', chatId, sessionId },
  }).catch(() => {});

  // In-app notification for operators/managers
  createBookingNotification({
    type: 'bot_booking',
    title: `Nova TG rezervace: ${draft.girlName}`,
    message: `${draft.date} ${draft.startTime}-${draft.endTime} (${draft.durationMinutes} min) — ${price} CZK`,
    bookingId,
    link: `/booking/calendar?date=${draft.date}`,
  }).catch(() => {});

  // Get location for confirmation message
  const locResult = await db.execute({
    sql: `SELECT COALESCE(l.display_name, l.name) AS location_name
          FROM girl_schedules gs
          LEFT JOIN locations l ON l.id = gs.location_id
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
          LIMIT 1`,
    args: [draft.girlId, toDbDayOfWeek(new Date(draft.date + 'T12:00:00').getDay())],
  });
  const location = locResult.rows[0]?.location_name ? String(locResult.rows[0].location_name) : null;

  // Build confirmation message
  const msgLines = [
    `\u2705 <b>Rezervace potvrzena!</b>`,
    '',
    `\u{1F469} ${draft.girlName}`,
    `\u{1F4C5} ${formatDate(draft.date)}`,
    `\u23F0 ${draft.startTime} — ${draft.endTime} (${draft.durationMinutes} min)`,
    `\u{1F4B0} ${price} CZK`,
    location ? `\u{1F4CD} ${location}` : '',
    '',
    `Rezervace #${bookingId}`,
  ];

  // New clients get confirmation reminder info
  if (isNewClient) {
    msgLines.push('');
    msgLines.push(`\u26A0\uFE0F Jako novy klient prosim <b>potvrdte</b> rezervaci 2h pred terminem — poslu ti pripominku.`);
    msgLines.push(`Pokud nepotvrdis, misto muze byt nabidnuto nekomu jinemu.`);
  }

  await sendMessage(chatId, msgLines.filter(Boolean).join('\n'));
}

// ---------------------------------------------------------------------------
// Cancel flow
// ---------------------------------------------------------------------------

export async function handleCancel(
  chatId: string,
  sessionId: string,
): Promise<void> {
  await expireDraft(sessionId);
  await sendMessage(chatId, 'Rezervace zrusena. Napiste kdykoliv, pokud si budete chtit znovu zarezervovat \u{1F60A}');
}

// ---------------------------------------------------------------------------
// Back step — go to previous step
// ---------------------------------------------------------------------------

async function handleBack(
  chatId: string,
  sessionId: string,
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft) {
    await sendMessage(chatId, 'Tato rezervace vyprsela. Zacni prosim znovu.');
    return;
  }

  if (draft.step === 'select_duration' || draft.step === 'confirm') {
    // Go back to time selection
    await db.execute({
      sql: `UPDATE booking_drafts
            SET step = 'select_time', start_time = NULL, end_time = NULL, duration_minutes = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?`,
      args: [sessionId],
    });

    const slots = await getAvailableSlots(draft.girlId, draft.date);
    if (slots.length === 0) {
      await sendMessage(chatId, `${draft.girlName} uz nema zadne volne casy. Zkus jiny den.`);
      await expireDraft(sessionId);
      return;
    }

    const keyboard = buildTimeSlotKeyboard(sessionId, slots);
    const msg = `\u23F0 <b>${draft.girlName}</b> — ${formatDate(draft.date)}\n\nVyber cas:`;
    await sendMessage(chatId, msg, {
      replyMarkup: {
        inline_keyboard: [
          ...keyboard,
          [{ text: '\u274C Zrusit', callback_data: `bk_cancel:${sessionId}` }],
        ],
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Main callback router — called from telegram-bot.ts
// ---------------------------------------------------------------------------

/**
 * Returns true if the callback data is a booking flow callback and was handled.
 */
export async function handleBookingCallback(
  chatId: string,
  callbackData: string,
): Promise<boolean> {
  // bk_time:{sessionId}:{HH:MM}
  if (callbackData.startsWith('bk_time:')) {
    const parts = callbackData.split(':');
    // bk_time : sessionId : HH : MM
    if (parts.length >= 4) {
      const sessionId = parts[1];
      const time = `${parts[2]}:${parts[3]}`;
      await handleTimeSelected(chatId, sessionId, time);
      return true;
    }
  }

  // bk_dur:{sessionId}:{minutes}
  if (callbackData.startsWith('bk_dur:')) {
    const parts = callbackData.split(':');
    if (parts.length >= 3) {
      const sessionId = parts[1];
      const minutes = parseInt(parts[2], 10);
      await handleDurationSelected(chatId, sessionId, minutes);
      return true;
    }
  }

  // bk_ok:{sessionId}
  if (callbackData.startsWith('bk_ok:')) {
    const sessionId = callbackData.slice(6);
    await handleConfirm(chatId, sessionId);
    return true;
  }

  // bk_cancel:{sessionId}
  if (callbackData.startsWith('bk_cancel:')) {
    const sessionId = callbackData.slice(10);
    await handleCancel(chatId, sessionId);
    return true;
  }

  // bk_back:{sessionId}
  if (callbackData.startsWith('bk_back:')) {
    const sessionId = callbackData.slice(8);
    await handleBack(chatId, sessionId);
    return true;
  }

  // bk_remind_ok:{bookingId} — new client confirms booking from reminder
  if (callbackData.startsWith('bk_remind_ok:')) {
    const bookingId = parseInt(callbackData.slice(13), 10);
    await handleReminderConfirm(chatId, bookingId);
    return true;
  }

  // bk_remind_cancel:{bookingId} — new client cancels from reminder
  if (callbackData.startsWith('bk_remind_cancel:')) {
    const bookingId = parseInt(callbackData.slice(17), 10);
    await handleReminderCancel(chatId, bookingId);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Reminder confirmation handlers (from cron reminder buttons)
// ---------------------------------------------------------------------------

async function handleReminderConfirm(chatId: string, bookingId: number): Promise<void> {
  const result = await db.execute({
    sql: `UPDATE bookings_v2
          SET confirmed_at = CURRENT_TIMESTAMP, needs_confirmation = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'confirmed' AND needs_confirmation = 1`,
    args: [bookingId],
  });

  if (result.rowsAffected === 0) {
    await sendMessage(chatId, 'Tato rezervace uz neni aktivni.');
    return;
  }

  // Get booking details for confirmation message
  const booking = await db.execute({
    sql: `SELECT b.date, b.start_time, b.end_time, g.name AS girl_name
          FROM bookings_v2 b JOIN girls g ON g.id = b.girl_id
          WHERE b.id = ?`,
    args: [bookingId],
  });

  if (booking.rows.length > 0) {
    const r = booking.rows[0];
    await sendMessage(chatId, [
      `\u2705 <b>Super, potvrzeno!</b>`,
      '',
      `\u{1F469} ${r.girl_name} — ${formatDate(String(r.date))} v ${String(r.start_time).substring(0, 5)}`,
      '',
      `Tesime se na tebe \u{1F60A}`,
    ].join('\n'));
  }
}

async function handleReminderCancel(chatId: string, bookingId: number): Promise<void> {
  const result = await db.execute({
    sql: `UPDATE bookings_v2
          SET status = 'cancelled_client', cancel_reason = 'Klient zrusil pri potvrzeni',
              cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'confirmed'`,
    args: [bookingId],
  });

  if (result.rowsAffected === 0) {
    await sendMessage(chatId, 'Tato rezervace uz neni aktivni.');
    return;
  }

  // Release slot lock
  await db.execute({
    sql: `DELETE FROM slot_locks WHERE locked_by = ?`,
    args: [`booking:${bookingId}`],
  }).catch(() => {});

  // Get booking info for notification to interested clients
  const booking = await db.execute({
    sql: `SELECT b.girl_id, b.date, b.start_time, b.end_time, g.name AS girl_name
          FROM bookings_v2 b JOIN girls g ON g.id = b.girl_id
          WHERE b.id = ?`,
    args: [bookingId],
  });

  await sendMessage(chatId, 'Rezervace zrusena. Napiste kdykoliv, pokud si budete chtit zarezervovat \u{1F60A}');

  // Notify interested clients about freed slot
  if (booking.rows.length > 0) {
    const r = booking.rows[0];
    const girlId = Number(r.girl_id);
    const date = String(r.date);
    const girlName = String(r.girl_name);
    const startTime = String(r.start_time).substring(0, 5);
    const endTime = String(r.end_time).substring(0, 5);

    const interested = await db.execute({
      sql: `SELECT DISTINCT telegram_chat_id FROM booking_interest
            WHERE girl_id = ? AND date = ? AND telegram_chat_id != ?
              AND created_at > datetime('now', '-24 hours')`,
      args: [girlId, date, chatId],
    });

    for (const intRow of interested.rows) {
      await sendMessage(String(intRow.telegram_chat_id), [
        `\u{1F525} <b>Uvolnil se termin!</b>`,
        '',
        `\u{1F469} ${girlName}`,
        `\u23F0 ${startTime} — ${endTime} (${formatDate(date)})`,
        '',
        `Chces rezervovat? Napis mi \u{1F60A}`,
      ].join('\n'));
    }

    // Clean up interest
    await db.execute({
      sql: `DELETE FROM booking_interest WHERE girl_id = ? AND date = ?`,
      args: [girlId, date],
    }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

interface DraftRow {
  sessionId: string;
  clientId: number;
  girlId: number;
  girlName: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  step: string;
}

async function getDraft(sessionId: string, chatId: string): Promise<DraftRow | null> {
  const result = await db.execute({
    sql: `SELECT bd.session_id, bd.client_id, bd.girl_id, g.name AS girl_name,
                 bd.date, bd.start_time, bd.end_time, bd.duration_minutes, bd.step
          FROM booking_drafts bd
          JOIN girls g ON g.id = bd.girl_id
          WHERE bd.session_id = ? AND bd.telegram_chat_id = ?
            AND bd.is_converted = 0 AND bd.expires_at > datetime('now')`,
    args: [sessionId, chatId],
  });

  if (result.rows.length === 0) return null;

  const r = result.rows[0];
  return {
    sessionId: String(r.session_id),
    clientId: Number(r.client_id),
    girlId: Number(r.girl_id),
    girlName: String(r.girl_name),
    date: String(r.date),
    startTime: r.start_time ? String(r.start_time) : null,
    endTime: r.end_time ? String(r.end_time) : null,
    durationMinutes: r.duration_minutes ? Number(r.duration_minutes) : null,
    step: String(r.step),
  };
}

async function expireDraft(sessionId: string): Promise<void> {
  await db.execute({
    sql: `UPDATE booking_drafts SET expires_at = datetime('now'), updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ? AND is_converted = 0`,
    args: [sessionId],
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Slot availability (reused logic from tool-handlers.checkAvailability)
// ---------------------------------------------------------------------------

async function getAvailableSlots(girlId: number, date: string): Promise<string[]> {
  const dow = toDbDayOfWeek(new Date(date + 'T12:00:00').getDay());

  // Get shift
  const shiftResult = await db.execute({
    sql: `SELECT gs.start_time, gs.end_time,
                 se.exception_type AS ex_type, se.start_time AS ex_start, se.end_time AS ex_end
          FROM girl_schedules gs
          LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
            AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
          ORDER BY gs.effective_from DESC NULLS LAST
          LIMIT 1`,
    args: [date, girlId, dow, date],
  });

  if (shiftResult.rows.length === 0) return [];

  const sr = shiftResult.rows[0];
  if (String(sr.ex_type) === 'unavailable') return [];

  let shiftStart = String(sr.start_time).substring(0, 5);
  let shiftEnd = String(sr.end_time).substring(0, 5);
  if (String(sr.ex_type) === 'custom_hours') {
    if (sr.ex_start) shiftStart = String(sr.ex_start).substring(0, 5);
    if (sr.ex_end) shiftEnd = String(sr.ex_end).substring(0, 5);
  }

  // Get occupied slots
  const bookingsResult = await db.execute({
    sql: `SELECT start_time, end_time FROM bookings_v2
          WHERE girl_id = ? AND date = ?
            AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired')`,
    args: [girlId, date],
  });

  const draftsResult = await db.execute({
    sql: `SELECT start_time, end_time FROM booking_drafts
          WHERE girl_id = ? AND date = ? AND is_converted = 0
            AND expires_at > datetime('now')
            AND start_time IS NOT NULL`,
    args: [girlId, date],
  });

  const locksResult = await db.execute({
    sql: `SELECT start_time, end_time FROM slot_locks
          WHERE girl_id = ? AND date = ? AND expires_at > datetime('now')`,
    args: [girlId, date],
  });

  const occupied = new Set<number>();
  const allBlocked = [
    ...bookingsResult.rows,
    ...draftsResult.rows,
    ...locksResult.rows,
  ];

  for (const row of allBlocked) {
    const [sh, sm] = String(row.start_time).substring(0, 5).split(':').map(Number);
    const [eh, em] = String(row.end_time).substring(0, 5).split(':').map(Number);
    for (let m = sh * 60 + sm; m < eh * 60 + em + 15; m += 30) {
      occupied.add(m);
    }
  }

  // Generate free slots
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);
  const shiftStartMin = startH * 60 + startM;
  const shiftEndMin = endH * 60 + endM;

  // Filter out past times if date is today
  const today = getPragueToday();
  const now = getPragueNow();
  const currentMin = date === today ? now.getHours() * 60 + now.getMinutes() + 30 : 0; // +30min buffer

  const freeSlots: string[] = [];
  for (let m = shiftStartMin; m < shiftEndMin; m += 30) {
    if (!occupied.has(m) && m >= currentMin) {
      freeSlots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  }

  return freeSlots;
}

async function getAvailableDurations(
  girlId: number,
  date: string,
  startTime: string,
): Promise<Array<{ minutes: number; price: number }>> {
  // Get shift end time
  const dow = toDbDayOfWeek(new Date(date + 'T12:00:00').getDay());
  const shiftResult = await db.execute({
    sql: `SELECT gs.end_time, se.exception_type AS ex_type, se.end_time AS ex_end
          FROM girl_schedules gs
          LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
            AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
          ORDER BY gs.effective_from DESC NULLS LAST
          LIMIT 1`,
    args: [date, girlId, dow, date],
  });

  let shiftEnd = '23:59';
  if (shiftResult.rows.length > 0) {
    const sr = shiftResult.rows[0];
    shiftEnd = String(sr.end_time).substring(0, 5);
    if (String(sr.ex_type) === 'custom_hours' && sr.ex_end) {
      shiftEnd = String(sr.ex_end).substring(0, 5);
    }
  }

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = shiftEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const maxDuration = endMin - startMin;

  // Check for next booking collision
  const nextBooking = await db.execute({
    sql: `SELECT MIN(start_time) AS next_start FROM bookings_v2
          WHERE girl_id = ? AND date = ? AND start_time > ?
            AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired')`,
    args: [girlId, date, startTime],
  });

  let maxAvailable = maxDuration;
  if (nextBooking.rows.length > 0 && nextBooking.rows[0].next_start) {
    const ns = String(nextBooking.rows[0].next_start).substring(0, 5);
    const [nh, nm] = ns.split(':').map(Number);
    const nextMin = nh * 60 + nm;
    // 15min buffer before next booking
    maxAvailable = Math.min(maxAvailable, nextMin - startMin - 15);
  }

  // Get pricing for available durations
  const durations = [30, 45, 60, 90, 120].filter((d) => d <= maxAvailable);

  const [startH] = startTime.split(':').map(Number);
  const isNight = startH >= 22 || startH < 6;

  const result: Array<{ minutes: number; price: number }> = [];
  for (const dur of durations) {
    const priceResult = await db.execute({
      sql: 'SELECT price, night_price FROM pricing_plans WHERE duration = ? LIMIT 1',
      args: [dur],
    });
    if (priceResult.rows.length > 0) {
      const pr = priceResult.rows[0];
      const price = isNight && pr.night_price ? Number(pr.night_price) : Number(pr.price);
      result.push({ minutes: dur, price });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function buildTimeSlotKeyboard(
  sessionId: string,
  slots: string[],
): Array<Array<{ text: string; callback_data: string }>> {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < slots.length; i += 3) {
    const row = slots.slice(i, i + 3).map((time) => ({
      text: time,
      callback_data: `bk_time:${sessionId}:${time}`,
    }));
    rows.push(row);
  }
  return rows;
}

function formatDate(date: string): string {
  const d = new Date(date + 'T12:00:00');
  const days = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${days[d.getDay()]} ${day}.${month}.`;
}
