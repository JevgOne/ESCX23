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
import { getCalendarGirls } from '../booking-queries';
import type { ClientContext } from './types';

const BREAK_MINUTES = 10; // 10-min break between bookings (global default)

// ---------------------------------------------------------------------------
// Per-girl booking config (Emily etc.)
// ---------------------------------------------------------------------------

interface GirlBookingConfig {
  startOffset: number;       // minutes from shift start (0 = default)
  allowedDurations: number[] | null; // null = all durations allowed
  breakMinutes: number;      // per-girl break override
}

async function getGirlBookingConfig(girlId: number): Promise<GirlBookingConfig> {
  try {
    const result = await db.execute({
      sql: 'SELECT booking_start_offset, booking_allowed_durations, booking_break_minutes FROM girls WHERE id = ? LIMIT 1',
      args: [girlId],
    });
    const row = result.rows[0];
    return {
      startOffset: row?.booking_start_offset ? Number(row.booking_start_offset) : 0,
      allowedDurations: row?.booking_allowed_durations
        ? JSON.parse(String(row.booking_allowed_durations)) as number[]
        : null,
      breakMinutes: row?.booking_break_minutes ? Number(row.booking_break_minutes) : BREAK_MINUTES,
    };
  } catch (e) {
    console.error('[booking-flow] getGirlBookingConfig failed, using defaults:', e);
    return { startOffset: 0, allowedDurations: null, breakMinutes: BREAK_MINUTES };
  }
}

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

  // Reject past dates
  const today = getPragueToday();
  if (date < today) {
    throw new Error(`Nelze bookovat v minulosti. Dnes je ${today}.`);
  }

  // Cancel any existing active draft for this chat
  await db.execute({
    sql: `UPDATE booking_drafts SET expires_at = datetime('now'), updated_at = CURRENT_TIMESTAMP
          WHERE telegram_chat_id = ? AND is_converted = 0 AND expires_at > datetime('now')`,
    args: [chatId],
  }).catch(() => {});

  // Get girl info
  const girlResult = await db.execute({
    sql: 'SELECT id, name FROM girls WHERE id = ? AND status = \'active\' LIMIT 1',
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

  // Update draft
  await db.execute({
    sql: `UPDATE booking_drafts
          SET start_time = ?, step = 'select_duration', updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ?`,
    args: [time, sessionId],
  });

  // Get available durations based on remaining shift time
  const durations = await getAvailableDurations(draft.girlId, draft.date, time);

  if (durations.length === 0) {
    // Not enough time for any program — go back to time selection
    await db.execute({
      sql: `UPDATE booking_drafts SET start_time = NULL, step = 'select_time', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    const slots = await getAvailableSlots(draft.girlId, draft.date);
    const keyboard = buildTimeSlotKeyboard(sessionId, slots);
    await sendMessage(chatId, `V ${time} uz neni dost casu na zadny program. Vyber jiny cas:`, {
      replyMarkup: {
        inline_keyboard: [
          ...keyboard,
          [{ text: '\u274C Zrusit', callback_data: `bk_cancel:${sessionId}` }],
        ],
      },
    });
    return;
  }

  // Build duration keyboard — include program title from DB
  const keyboard = durations.map((d) => [{
    text: `${d.title} (${d.minutes} min) — ${d.price} CZK`,
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

  // Get location for summary using the same query as the calendar
  const calGirls = await getCalendarGirls(draft.date);
  const calGirl = calGirls.find((g) => g.id === draft.girlId);
  const location = calGirl?.locationName ?? null;

  // Show confirmation — flowing text summary
  await showConfirmation(chatId, sessionId, draft.girlName, draft.date, draft.startTime, endTime, durationMinutes, price, location, null);
}

async function showConfirmation(
  chatId: string,
  sessionId: string,
  girlName: string,
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  originalPrice: number,
  location: string | null,
  discount: { code: string; type: string; value: number } | null,
): Promise<void> {
  let priceText: string;
  if (discount) {
    const discountAmount = discount.type === 'percentage'
      ? Math.round(originalPrice * discount.value / 100)
      : discount.value;
    const finalPrice = Math.max(0, originalPrice - discountAmount);
    priceText = `<s>${originalPrice} CZK</s> <b>${finalPrice} CZK</b> (${discount.code} -${discount.type === 'percentage' ? discount.value + '%' : discountAmount + ' CZK'})`;
  } else {
    priceText = `<b>${originalPrice} CZK</b>`;
  }

  const msg = `<b>${girlName}</b>, ${formatDate(date)}, ${startTime}–${endTime} (${durationMinutes} min)` +
    (location ? `, ${location}` : '') +
    ` — ${priceText}. Potvrdis?`;

  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        [
          { text: '\u2705 Potvrdit', callback_data: `bk_ok:${sessionId}` },
          { text: '\u{1F3F7}\uFE0F Promokod', callback_data: `bk_promo:${sessionId}` },
        ],
        [
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

  // Determine booking status: new clients → pending (unless <1h to start), regulars → confirmed
  const clientRes = await db.execute({
    sql: 'SELECT trust_level, total_visits FROM booking_clients WHERE id = ? LIMIT 1',
    args: [draft.clientId],
  });
  const trustLevel = clientRes.rows[0] ? String(clientRes.rows[0].trust_level) : 'new';
  const visits = clientRes.rows[0] ? Number(clientRes.rows[0].total_visits) : 0;
  const isNewClient = visits === 0 || trustLevel === 'new';

  // If booking starts within 1h, skip pending — no time for confirmation flow
  let bookingStatus: string;
  if (!isNewClient) {
    bookingStatus = 'confirmed';
  } else {
    const now = getPragueNow();
    const bookingDate = draft.date;
    const today = getPragueToday();
    const [bh, bm] = draft.startTime.split(':').map(Number);
    const bookingMin = bh * 60 + bm;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const isToday = bookingDate === today;
    const minutesUntilStart = isToday ? bookingMin - nowMin : Infinity;

    bookingStatus = minutesUntilStart < 60 ? 'confirmed' : 'pending';
  }

  // Apply discount if promo code was used
  let discountAmount = 0;
  let discountInfo: { code: string; type: string; value: number } | null = null;
  if (draft.discountCodeId) {
    const dcRes = await db.execute({
      sql: 'SELECT code, type, value FROM discount_codes WHERE id = ? AND is_active = 1 LIMIT 1',
      args: [draft.discountCodeId],
    });
    if (dcRes.rows.length > 0) {
      const dc = dcRes.rows[0];
      discountInfo = { code: String(dc.code), type: String(dc.type), value: Number(dc.value) };
      discountAmount = discountInfo.type === 'percentage'
        ? Math.round(price * discountInfo.value / 100)
        : discountInfo.value;
    }
  }
  const finalPrice = Math.max(0, price - discountAmount);

  // Get location_id from girl's schedule for this date
  const bookingDow = (() => { const js = new Date(draft.date + 'T12:00:00').getDay(); return js === 0 ? 6 : js - 1; })();
  const locRes = await db.execute({
    sql: `SELECT gs.location_id FROM girl_schedules gs
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
            AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
          ORDER BY gs.effective_from DESC NULLS LAST LIMIT 1`,
    args: [draft.girlId, bookingDow, draft.date],
  });
  const locationId = locRes.rows[0]?.location_id ? Number(locRes.rows[0].location_id) : null;

  // Create booking
  const bookingResult = await db.execute({
    sql: `INSERT INTO bookings_v2 (
            client_id, girl_id, location_id, date, start_time, end_time, duration_minutes,
            price, discount_code_id, discount_amount, points_earned,
            status, source, channel, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booking_flow', 'telegram', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [draft.clientId, draft.girlId, locationId, draft.date, draft.startTime, draft.endTime, draft.durationMinutes,
           finalPrice, draft.discountCodeId ?? null, discountAmount, finalPrice, bookingStatus],
  });

  const bookingId = Number(bookingResult.lastInsertRowid);

  // Increment discount code usage
  if (draft.discountCodeId) {
    await db.execute({
      sql: 'UPDATE discount_codes SET current_uses = current_uses + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [draft.discountCodeId],
    }).catch(() => {});
  }

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
    details: { source: 'booking_flow', chatId, sessionId, discountCode: discountInfo?.code },
  }).catch(() => {});

  // Get location for confirmation message
  const locResult = await db.execute({
    sql: `SELECT l.display_name AS location_name
          FROM girl_schedules gs
          LEFT JOIN locations l ON l.id = gs.location_id
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
          LIMIT 1`,
    args: [draft.girlId, (() => { const js = new Date(draft.date + 'T12:00:00').getDay(); return js === 0 ? 6 : js - 1; })()],
  });
  const location = locResult.rows[0]?.location_name ? String(locResult.rows[0].location_name) : null;

  // Build price text with discount
  let priceText: string;
  if (discountInfo && discountAmount > 0) {
    priceText = `<s>${price} CZK</s> <b>${finalPrice} CZK</b> (${discountInfo.code} -${discountInfo.type === 'percentage' ? discountInfo.value + '%' : discountAmount + ' CZK'})`;
  } else {
    priceText = `<b>${finalPrice} CZK</b>`;
  }

  // Send confirmation — flowing text, different for pending vs confirmed
  const summary = `<b>${draft.girlName}</b>, ${formatDate(draft.date)}, ${draft.startTime}–${draft.endTime} (${draft.durationMinutes} min)` +
    (location ? `, ${location}` : '') +
    ` — ${priceText}`;

  const msg = bookingStatus === 'pending'
    ? `\u{1F4CB} Rezervace #${bookingId} prijata!\n\n${summary}\n\nProtoze jsi u nas poprve, prosim <b>potvrd svuj prichod</b> kliknutim nize. Pokud nepotvrdis do 1h pred terminem, misto uvolnime.`
    : `\u2705 Rezervace #${bookingId} potvrzena!\n\n${summary}\n\nTesime se na tebe!`;

  if (bookingStatus === 'pending') {
    await sendMessage(chatId, msg, {
      replyMarkup: {
        inline_keyboard: [
          [
            { text: '\u2705 Potvrzuji prichod', callback_data: `bk_remind_ok:${bookingId}` },
            { text: '\u274C Rusim', callback_data: `bk_remind_cancel:${bookingId}` },
          ],
        ],
      },
    });
  } else {
    await sendMessage(chatId, msg);
  }

  // ── Notify operator(s) and girl about new booking ──────────────────
  const clientInfo = await db.execute({
    sql: 'SELECT nickname FROM booking_clients WHERE id = ? LIMIT 1',
    args: [draft.clientId],
  });
  const clientNickname = clientInfo.rows[0]?.nickname ? String(clientInfo.rows[0].nickname) : 'Neznamy';

  sendBookingCreatedNotifications({
    bookingId,
    clientNickname,
    girlId: draft.girlId,
    girlName: draft.girlName,
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime!,
    durationMinutes: draft.durationMinutes!,
    price: finalPrice,
    status: bookingStatus,
  }).catch(() => {});

  // In-app notification for admin dashboard
  createBookingNotification({
    type: 'new_booking',
    title: `Nova rezervace #${bookingId}`,
    message: `${clientNickname} \u2192 ${draft.girlName}, ${formatDate(draft.date)} ${draft.startTime}\u2013${draft.endTime} (${finalPrice} CZK)`,
    bookingId,
    link: `/booking/calendar?date=${draft.date}`,
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Staff notifications (operator + girl)
// ---------------------------------------------------------------------------

async function sendBookingCreatedNotifications(params: {
  bookingId: number;
  clientNickname: string;
  girlId: number;
  girlName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  status: string;
}): Promise<void> {
  const { bookingId, clientNickname, girlId, girlName, date, startTime, endTime, durationMinutes, price, status } = params;

  const statusText = status === 'confirmed' ? 'Potvrzena' : 'Ceka na potvrzeni';

  const msg = [
    `\u{1F4C5} <b>Nova rezervace #${bookingId}</b>`,
    '',
    `\u{1F464} Klient: ${clientNickname}`,
    `\u{1F469} ${girlName}`,
    `\u{1F4C6} ${formatDate(date)}`,
    `\u23F0 ${startTime}\u2013${endTime} (${durationMinutes} min)`,
    `\u{1F4B0} ${price} CZK`,
    `\u{1F4CB} Status: ${statusText}`,
  ].join('\n');

  // 1) Notify all operators
  try {
    const operators = await db.execute({
      sql: `SELECT telegram_chat_id FROM users
            WHERE role = 'operator' AND is_active = 1 AND telegram_chat_id IS NOT NULL`,
      args: [],
    });
    for (const op of operators.rows) {
      sendMessage(String(op.telegram_chat_id), msg).catch(() => {});
    }
  } catch { /* silent */ }

  // 2) Notify the girl — ONLY if she works on the booking date
  try {
    const bookingDate = date;
    const calGirlsForNotif = await getCalendarGirls(bookingDate);
    const girlForNotif = calGirlsForNotif.find((g) => g.id === girlId);
    const hasShift = girlForNotif?.isWorking ?? false;

    if (hasShift) {
      const girlLink = await db.execute({
        sql: `SELECT chat_id FROM telegram_links
              WHERE girl_id = ? AND is_active = 1 LIMIT 1`,
        args: [girlId],
      });

      if (girlLink.rows.length > 0) {
        sendMessage(String(girlLink.rows[0].chat_id), msg).catch(() => {});
      } else {
        const girlUser = await db.execute({
          sql: `SELECT telegram_chat_id FROM users
                WHERE girl_id = ? AND is_active = 1 AND telegram_chat_id IS NOT NULL LIMIT 1`,
          args: [girlId],
        });
        if (girlUser.rows.length > 0) {
          sendMessage(String(girlUser.rows[0].telegram_chat_id), msg).catch(() => {});
        }
      }
    }
  } catch { /* silent */ }
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
// Promo code flow
// ---------------------------------------------------------------------------

async function handlePromoPrompt(chatId: string, sessionId: string): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft) {
    await sendMessage(chatId, 'Tato rezervace vyprsela. Zacni prosim znovu.');
    return;
  }

  await db.execute({
    sql: `UPDATE booking_drafts SET step = 'enter_promo', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
    args: [sessionId],
  });

  await sendMessage(chatId, 'Napis promokod:');
}

/**
 * Called from telegram-bot.ts when user sends text and has active draft in "enter_promo" step.
 * Returns true if handled.
 */
export async function handlePromoCodeInput(chatId: string, text: string): Promise<boolean> {
  // Find active draft in enter_promo step
  const draftResult = await db.execute({
    sql: `SELECT bd.session_id, bd.client_id, bd.girl_id, g.name AS girl_name,
                 bd.date, bd.start_time, bd.end_time, bd.duration_minutes, bd.step, bd.discount_code_id
          FROM booking_drafts bd
          JOIN girls g ON g.id = bd.girl_id
          WHERE bd.telegram_chat_id = ? AND bd.step = 'enter_promo'
            AND bd.is_converted = 0 AND bd.expires_at > datetime('now')
          ORDER BY bd.created_at DESC LIMIT 1`,
    args: [chatId],
  });

  if (draftResult.rows.length === 0) return false;

  const r = draftResult.rows[0];
  const sessionId = String(r.session_id);
  const code = text.trim().toUpperCase();

  // Validate promo code
  const codeResult = await db.execute({
    sql: `SELECT id, code, type, value, min_duration, max_uses, current_uses
          FROM discount_codes
          WHERE UPPER(code) = ? AND is_active = 1
            AND (valid_from IS NULL OR valid_from <= datetime('now'))
            AND (valid_until IS NULL OR valid_until >= datetime('now'))
          LIMIT 1`,
    args: [code],
  });

  if (codeResult.rows.length === 0) {
    await sendMessage(chatId, `\u274C Kod <b>${code}</b> neni platny. Zkus jiny, nebo pokracuj bez slevy.`);
    // Go back to confirm step
    await db.execute({
      sql: `UPDATE booking_drafts SET step = 'confirm', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    await reshowConfirmation(chatId, sessionId, r);
    return true;
  }

  const dc = codeResult.rows[0];
  const maxUses = dc.max_uses ? Number(dc.max_uses) : null;
  const currentUses = Number(dc.current_uses);
  if (maxUses && currentUses >= maxUses) {
    await sendMessage(chatId, `\u274C Kod <b>${code}</b> uz byl vyuzit. Zkus jiny.`);
    await db.execute({
      sql: `UPDATE booking_drafts SET step = 'confirm', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    await reshowConfirmation(chatId, sessionId, r);
    return true;
  }

  const minDuration = dc.min_duration ? Number(dc.min_duration) : null;
  const draftDuration = r.duration_minutes ? Number(r.duration_minutes) : 0;
  if (minDuration && draftDuration < minDuration) {
    await sendMessage(chatId, `\u274C Kod <b>${code}</b> plati od ${minDuration} min. Tvuj program je ${draftDuration} min.`);
    await db.execute({
      sql: `UPDATE booking_drafts SET step = 'confirm', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    await reshowConfirmation(chatId, sessionId, r);
    return true;
  }

  // Apply discount — store on draft
  await db.execute({
    sql: `UPDATE booking_drafts SET discount_code_id = ?, step = 'confirm', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
    args: [Number(dc.id), sessionId],
  });

  // Re-show confirmation with discount
  await reshowConfirmation(chatId, sessionId, r, {
    code: String(dc.code),
    type: String(dc.type),
    value: Number(dc.value),
  });

  return true;
}

async function reshowConfirmation(
  chatId: string,
  sessionId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: any,
  discount?: { code: string; type: string; value: number } | null,
): Promise<void> {
  const girlName = String(r.girl_name);
  const date = String(r.date);
  const startTime = String(r.start_time);
  const endTime = String(r.end_time);
  const durationMinutes = Number(r.duration_minutes);

  // Get price
  const priceResult = await db.execute({
    sql: 'SELECT price, night_price FROM pricing_plans WHERE duration = ? AND is_active = 1 LIMIT 1',
    args: [durationMinutes],
  });
  const priceRow = priceResult.rows[0];
  const [sh] = startTime.split(':').map(Number);
  const isNight = sh >= 22 || sh < 6;
  const price = priceRow
    ? (isNight && priceRow.night_price ? Number(priceRow.night_price) : Number(priceRow.price))
    : 0;

  // Get location using the same query as the calendar
  const calGirlsLoc = await getCalendarGirls(date);
  const calGirlLoc = calGirlsLoc.find((g) => g.id === Number(r.girl_id));
  const location = calGirlLoc?.locationName ?? null;

  // If no discount passed, check if one was stored
  if (!discount && r.discount_code_id) {
    const dcRes = await db.execute({
      sql: 'SELECT code, type, value FROM discount_codes WHERE id = ? LIMIT 1',
      args: [Number(r.discount_code_id)],
    });
    if (dcRes.rows.length > 0) {
      discount = {
        code: String(dcRes.rows[0].code),
        type: String(dcRes.rows[0].type),
        value: Number(dcRes.rows[0].value),
      };
    }
  }

  await showConfirmation(chatId, sessionId, girlName, date, startTime, endTime, durationMinutes, price, location, discount ?? null);
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

  // bk_promo:{sessionId} — enter promo code
  if (callbackData.startsWith('bk_promo:')) {
    const sessionId = callbackData.slice(9);
    await handlePromoPrompt(chatId, sessionId);
    return true;
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

  // bk_remind_ok:{bookingId} — client confirms attendance
  if (callbackData.startsWith('bk_remind_ok:')) {
    const bookingId = parseInt(callbackData.slice(13), 10);
    await handleClientConfirm(chatId, bookingId);
    return true;
  }

  // bk_remind_cancel:{bookingId} — client cancels
  if (callbackData.startsWith('bk_remind_cancel:')) {
    const bookingId = parseInt(callbackData.slice(17), 10);
    await handleClientCancel(chatId, bookingId);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Client self-confirm / cancel (for pending bookings)
// ---------------------------------------------------------------------------

async function handleClientConfirm(chatId: string, bookingId: number): Promise<void> {
  const result = await db.execute({
    sql: `SELECT b.id, b.status, b.date, b.start_time, b.end_time,
                 g.name AS girl_name, bc.telegram_id
          FROM bookings_v2 b
          JOIN girls g ON g.id = b.girl_id
          JOIN booking_clients bc ON bc.id = b.client_id
          WHERE b.id = ? AND bc.telegram_id = ?`,
    args: [bookingId, chatId],
  });

  if (result.rows.length === 0) {
    await sendMessage(chatId, 'Rezervace nenalezena.');
    return;
  }

  const booking = result.rows[0];
  if (String(booking.status) !== 'pending') {
    const label = String(booking.status) === 'confirmed' ? 'uz je potvrzena' : 'uz neni aktivni';
    await sendMessage(chatId, `Tato rezervace ${label}.`);
    return;
  }

  await db.execute({
    sql: `UPDATE bookings_v2 SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP,
                                  updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'pending'`,
    args: [bookingId],
  });

  const startTime = String(booking.start_time).substring(0, 5);
  const endTime = String(booking.end_time).substring(0, 5);
  await sendMessage(chatId,
    `\u2705 <b>${String(booking.girl_name)}</b>, ${formatDate(String(booking.date))}, ${startTime}–${endTime} — potvrzeno! Tesime se na tebe!`
  );

  logAudit({
    bookingId,
    action: 'booking.client_confirm',
    actorType: 'bot',
    entityType: 'booking',
    entityId: bookingId,
    details: { chatId, source: 'client_self_confirm' },
  }).catch(() => {});
}

async function handleClientCancel(chatId: string, bookingId: number): Promise<void> {
  const result = await db.execute({
    sql: `SELECT b.id, b.status, bc.telegram_id
          FROM bookings_v2 b
          JOIN booking_clients bc ON bc.id = b.client_id
          WHERE b.id = ? AND bc.telegram_id = ?`,
    args: [bookingId, chatId],
  });

  if (result.rows.length === 0) {
    await sendMessage(chatId, 'Rezervace nenalezena.');
    return;
  }

  if (String(result.rows[0].status) !== 'pending') {
    await sendMessage(chatId, 'Tato rezervace uz neni aktivni.');
    return;
  }

  await db.execute({
    sql: `UPDATE bookings_v2 SET status = 'cancelled_client',
          cancel_reason = 'Klient zrusil pred potvrzenim',
          cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'pending'`,
    args: [bookingId],
  });

  // Release slot lock
  await db.execute({
    sql: 'DELETE FROM slot_locks WHERE locked_by = ?',
    args: [`booking:${bookingId}`],
  }).catch(() => {});

  await sendMessage(chatId, 'Rezervace zrusena. Napis kdykoliv pro novou rezervaci \u{1F60A}');

  logAudit({
    bookingId,
    action: 'booking.client_cancel',
    actorType: 'bot',
    entityType: 'booking',
    entityId: bookingId,
    details: { chatId, source: 'client_self_cancel' },
  }).catch(() => {});
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
  discountCodeId: number | null;
}

async function getDraft(sessionId: string, chatId: string): Promise<DraftRow | null> {
  const result = await db.execute({
    sql: `SELECT bd.session_id, bd.client_id, bd.girl_id, g.name AS girl_name,
                 bd.date, bd.start_time, bd.end_time, bd.duration_minutes, bd.step, bd.discount_code_id
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
    discountCodeId: r.discount_code_id ? Number(r.discount_code_id) : null,
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
  // Use the same query as the calendar for consistency
  const calendarGirls = await getCalendarGirls(date);
  const girl = calendarGirls.find((g) => g.id === girlId);

  if (!girl || !girl.isWorking || !girl.shiftStart || !girl.shiftEnd) return [];

  // Per-girl booking config (Emily etc.)
  const config = await getGirlBookingConfig(girlId);

  const shiftStart = girl.shiftStart;
  const shiftEnd = girl.shiftEnd;

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

  const allBlocked = [
    ...bookingsResult.rows,
    ...draftsResult.rows,
    ...locksResult.rows,
  ];

  const blockedRanges = allBlocked.map(row => {
    const [sh, sm] = String(row.start_time).substring(0, 5).split(':').map(Number);
    const [eh, em] = String(row.end_time).substring(0, 5).split(':').map(Number);
    return { start: sh * 60 + sm, end: eh * 60 + em };
  });

  // Generate free slots
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);
  const shiftStartMin = startH * 60 + startM + config.startOffset; // Apply booking_start_offset
  const shiftEndMin = endH * 60 + endM;

  // Filter out past times if date is today
  const today = getPragueToday();
  const now = getPragueNow();
  const currentMin = date === today ? now.getHours() * 60 + now.getMinutes() + 30 : 0; // +30min buffer

  const freeSlots: string[] = [];
  for (let m = shiftStartMin; m < shiftEndMin; m += 30) {
    const isBlocked = blockedRanges.some(b => m < b.end + config.breakMinutes && m + 30 > b.start - config.breakMinutes);
    if (!isBlocked && m >= currentMin) {
      freeSlots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  }

  return freeSlots;
}

async function getAvailableDurations(
  girlId: number,
  date: string,
  startTime: string,
): Promise<Array<{ minutes: number; price: number; title: string }>> {
  // Get shift end time using the same query as the calendar
  const calendarGirls = await getCalendarGirls(date);
  const girl = calendarGirls.find((g) => g.id === girlId);

  // Per-girl booking config (Emily etc.)
  const config = await getGirlBookingConfig(girlId);

  const shiftEnd = girl?.shiftEnd ?? '23:59';

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
    maxAvailable = Math.min(maxAvailable, nextMin - startMin - config.breakMinutes);
  }

  // Get pricing for available durations — filter by per-girl allowed durations
  const allDurations = config.allowedDurations ?? [30, 45, 60, 90, 120];
  const durations = allDurations.filter((d) => d <= maxAvailable);

  const [startH] = startTime.split(':').map(Number);
  const isNight = startH >= 22 || startH < 6;

  const result: Array<{ minutes: number; price: number; title: string }> = [];
  for (const dur of durations) {
    const priceResult = await db.execute({
      sql: 'SELECT price, night_price, title_cs FROM pricing_plans WHERE duration = ? AND is_active = 1 LIMIT 1',
      args: [dur],
    });
    if (priceResult.rows.length > 0) {
      const pr = priceResult.rows[0];
      const price = isNight && pr.night_price ? Number(pr.night_price) : Number(pr.price);
      const title = pr.title_cs ? String(pr.title_cs) : `${dur} min`;
      result.push({ minutes: dur, price, title });
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
