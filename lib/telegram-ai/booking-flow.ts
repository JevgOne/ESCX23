/**
 * Structured booking flow — inline keyboard buttons, NO Claude API calls.
 *
 * Flow: girl → date → duration → single time offer (yes/no) → confirmation
 *   Step 1: Show duration options as buttons
 *   Step 2: Offer one time slot at a time (accept/reject)
 *   Step 3: Show summary + Confirm/Cancel
 *   Step 4: Create booking from draft
 *
 * Callback prefixes:
 *   bk_dur:{sessionId}:{minutes}   — duration selected
 *   bk_slot_yes:{sessionId}:{HH}:{MM} — accept offered time
 *   bk_slot_no:{sessionId}:{HH}:{MM}  — reject, offer next time
 *   bk_ok:{sessionId}              — confirm booking
 *   bk_cancel:{sessionId}          — cancel booking flow
 */

import { db } from '../db';
import { sendMessage, sendPhoto, sendPhotoBuffer } from '../telegram';
import { generateGirlsComposite } from './girls-composite';
import { buildClientContext } from './context';
import { logAudit } from '../audit';
import { createBookingNotification } from '../booking-notifications';
import { getCalendarGirls } from '../booking-queries';
import { safeEncrypt } from '../crypto';
import { type Lang, t } from '../telegram-i18n';
import type { ClientContext } from './types';

const BREAK_MINUTES = 15; // 15-min break between bookings (global default)

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

function generateBookingCode(date: string): string {
  const datePart = date.replace(/-/g, '');
  const hex = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `LG-${datePart}-${hex}`;
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
  lang: Lang = 'cs',
): Promise<StartBookingResult> {
  // Validate client can book
  if (!ctx.isRegistered || !ctx.clientId) {
    throw new Error(t(lang, 'error.must_register'));
  }

  // Reject past dates
  const today = getPragueToday();
  if (date < today) {
    throw new Error(t(lang, 'error.past_date', { today }));
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
    throw new Error(t(lang, 'error.girl_not_found'));
  }
  const girlName = String(girlResult.rows[0].name);

  // Check any slots exist at all (minimum duration check)
  const slotsCheck = await getAvailableSlots(girlId, date);
  if (slotsCheck.length === 0) {
    await sendMessage(chatId, t(lang, 'error.no_slots', { name: girlName, date }), {
      replyMarkup: {
        inline_keyboard: [[
          { text: t(lang, 'btn.notify_me'), callback_data: `bk_interest:${girlId}:${date}` },
        ]],
      },
    });
    return { sessionId: '', girlName, date, message: `No slots available for ${girlName} on ${date}` };
  }

  // Create session — start with duration selection
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30min expiry per flow diagram

  await db.execute({
    sql: `INSERT INTO booking_drafts
            (client_id, telegram_chat_id, girl_id, date, channel, session_id, step, expires_at)
          VALUES (?, ?, ?, ?, 'telegram', ?, 'select_duration', ?)`,
    args: [ctx.clientId, chatId, girlId, date, sessionId, expiresAt],
  });

  // Show duration selection first
  await showDurationSelection(chatId, sessionId, girlId, girlName, date, ctx.clientId, lang);

  return {
    sessionId,
    girlName,
    date,
    message: `Booking flow started for ${girlName} on ${date}`,
  };
}

// ---------------------------------------------------------------------------
// Step 1b: Duration selection (BEFORE time) — auto-triggered from startBookingFlow
// ---------------------------------------------------------------------------

async function showDurationSelection(
  chatId: string,
  sessionId: string,
  girlId: number,
  girlName: string,
  date: string,
  clientId: number,
  lang: Lang = 'cs',
): Promise<void> {
  // Get all possible durations for this girl
  const config = await getGirlBookingConfig(girlId);
  const allDurations = config.allowedDurations ?? [30, 45, 60, 90, 120];

  // New clients: auto-select 60 min (skip duration selection entirely)
  const clientRes = await db.execute({
    sql: 'SELECT trust_level, total_visits FROM booking_clients WHERE id = ? LIMIT 1',
    args: [clientId],
  });
  const trustLevel = clientRes.rows[0] ? String(clientRes.rows[0].trust_level) : 'new';
  const visits = clientRes.rows[0] ? Number(clientRes.rows[0].total_visits) : 0;
  const isNewClient = visits === 0 || trustLevel === 'new';
  if (isNewClient) {
    const autoDir = allDurations.includes(60) ? 60 : allDurations[0];
    await db.execute({
      sql: `UPDATE booking_drafts SET duration_minutes = ?, step = 'select_time', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [autoDir, sessionId],
    });
    const slots = await getAvailableSlots(girlId, date, autoDir);
    if (slots.length === 0) {
      await sendMessage(chatId, t(lang, 'flow.no_more_slots', { name: girlName }), {
        replyMarkup: {
          inline_keyboard: [[
            { text: t(lang, 'btn.notify_me'), callback_data: `bk_interest:${girlId}:${date}` },
          ]],
        },
      });
      await expireDraft(sessionId);
      return;
    }
    await offerSlot(chatId, sessionId, girlName, date, slots, 0, lang, girlId);
    return;
  }

  // Filter durations that actually have available slots
  const filteredDurations: number[] = [];
  for (const dur of allDurations) {
    const slots = await getAvailableSlots(girlId, date, dur);
    if (slots.length > 0) filteredDurations.push(dur);
  }

  if (filteredDurations.length === 0) {
    await sendMessage(chatId, t(lang, 'flow.no_more_slots', { name: girlName }), {
      replyMarkup: {
        inline_keyboard: [[
          { text: t(lang, 'btn.notify_me'), callback_data: `bk_interest:${girlId}:${date}` },
        ]],
      },
    });
    await expireDraft(sessionId);
    return;
  }

  // If only one duration available, skip selection
  if (filteredDurations.length === 1) {
    const dur = filteredDurations[0];
    await db.execute({
      sql: `UPDATE booking_drafts SET duration_minutes = ?, step = 'select_time', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [dur, sessionId],
    });
    const slots = await getAvailableSlots(girlId, date, dur);
    if (slots.length === 0) {
      await sendMessage(chatId, t(lang, 'flow.no_more_slots', { name: girlName }), {
        replyMarkup: {
          inline_keyboard: [[
            { text: t(lang, 'btn.notify_me'), callback_data: `bk_interest:${girlId}:${date}` },
          ]],
        },
      });
      await expireDraft(sessionId);
      return;
    }
    await offerSlot(chatId, sessionId, girlName, date, slots, 0, lang, girlId);
    return;
  }

  // Get pricing for each duration
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  for (const dur of filteredDurations) {
    const priceResult = await db.execute({
      sql: 'SELECT price, night_price, title_cs, title_en, title_uk FROM pricing_plans WHERE duration = ? AND is_active = 1 LIMIT 1',
      args: [dur],
    });
    if (priceResult.rows.length > 0) {
      const pr = priceResult.rows[0];
      const titleCol = lang === 'en' ? 'title_en' : lang === 'uk' ? 'title_uk' : 'title_cs';
      const title = (pr[titleCol] ? String(pr[titleCol]) : null) ?? (pr.title_cs ? String(pr.title_cs) : `${dur} min`);
      const price = Number(pr.price);
      keyboard.push([{
        text: `${title} (${dur} min) — ${price} CZK`,
        callback_data: `bk_dur:${sessionId}:${dur}`,
      }]);
    }
  }

  const msg = `\u23F0 <b>${girlName}</b> — ${formatDate(date, lang)}\n\n${t(lang, 'flow.select_duration')}`;
  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        ...keyboard,
        [{ text: t(lang, 'btn.cancel'), callback_data: `bk_cancel:${sessionId}` }],
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// Single-slot offer: show one time, Yes/No buttons
// ---------------------------------------------------------------------------

async function offerSlot(
  chatId: string,
  sessionId: string,
  girlName: string,
  date: string,
  slots: string[],
  index: number,
  lang: Lang = 'cs',
  girlId?: number,
): Promise<void> {
  if (index >= slots.length) {
    const msgOpts = girlId ? {
      replyMarkup: {
        inline_keyboard: [[
          { text: t(lang, 'btn.notify_me'), callback_data: `bk_interest:${girlId}:${date}` },
        ]],
      },
    } : undefined;
    await sendMessage(chatId, t(lang, 'flow.no_more_slots', { name: girlName }), msgOpts);
    await expireDraft(sessionId);
    return;
  }

  const time = slots[index];
  const msg = `\u23F0 <b>${girlName}</b> — ${formatDate(date, lang)} ${t(lang, 'flow.slot_offer_at')} <b>${time}</b>. ${t(lang, 'flow.slot_offer_want')}`;
  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        [
          { text: t(lang, 'btn.yes'), callback_data: `bk_slot_yes:${sessionId}:${time}` },
          { text: t(lang, 'btn.no_next'), callback_data: `bk_slot_no:${sessionId}:${time}` },
        ],
        [
          { text: t(lang, 'btn.back'), callback_data: `bk_back:${sessionId}` },
          { text: t(lang, 'btn.cancel'), callback_data: `bk_cancel:${sessionId}` },
        ],
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// Legacy: Time selected → show duration options (old flow, kept for bk_time callback compat)
// ---------------------------------------------------------------------------

export async function handleTimeSelected(
  chatId: string,
  sessionId: string,
  time: string,
  lang: Lang = 'cs',
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft) {
    await sendMessage(chatId, t(lang, 'flow.draft_expired'));
    return;
  }

  // Deduplicate: ignore if step already advanced (double-click)
  if (draft.step !== 'select_time') return;

  // Update draft
  await db.execute({
    sql: `UPDATE booking_drafts
          SET start_time = ?, step = 'select_duration', updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ?`,
    args: [time, sessionId],
  });

  // Get available durations based on remaining shift time
  const durations = await getAvailableDurations(draft.girlId, draft.date, time, lang);

  if (durations.length === 0) {
    // Not enough time for any program — offer next slot
    await db.execute({
      sql: `UPDATE booking_drafts SET start_time = NULL, step = 'select_time', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    const slots = await getAvailableSlots(draft.girlId, draft.date);
    const rejectedIndex = slots.indexOf(time);
    await sendMessage(chatId, t(lang, 'flow.no_time_for_program', { time }));
    await offerSlot(chatId, sessionId, draft.girlName, draft.date, slots, rejectedIndex >= 0 ? rejectedIndex + 1 : 0, lang, draft.girlId);
    return;
  }

  // Filter durations for new clients: only 30 and 60 min
  let filteredDurations = durations;
  if (draft.clientId) {
    const clientRes = await db.execute({
      sql: 'SELECT trust_level, total_visits FROM booking_clients WHERE id = ? LIMIT 1',
      args: [draft.clientId],
    });
    const trustLevel = clientRes.rows[0] ? String(clientRes.rows[0].trust_level) : 'new';
    const visits = clientRes.rows[0] ? Number(clientRes.rows[0].total_visits) : 0;
    if (visits === 0 || trustLevel === 'new') {
      filteredDurations = durations.filter(d => d.minutes === 30 || d.minutes === 60);
    }
  }

  if (filteredDurations.length === 0) {
    // Fallback: no 30/60 available — show all durations
    filteredDurations = durations;
  }

  // Build duration keyboard — include program title from DB
  const keyboard = filteredDurations.map((d) => [{
    text: `${d.title} (${d.minutes} min) — ${d.price} CZK`,
    callback_data: `bk_dur:${sessionId}:${d.minutes}`,
  }]);

  const msg = `\u23F0 <b>${draft.girlName}</b> — ${formatDate(draft.date, lang)} v <b>${time}</b>\n\n${t(lang, 'flow.select_duration')}`;
  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        ...keyboard,
        [
          { text: t(lang, 'btn.back'), callback_data: `bk_back:${sessionId}` },
          { text: t(lang, 'btn.cancel'), callback_data: `bk_cancel:${sessionId}` },
        ],
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// Legacy: Duration selected after time (old flow, kept for backward compat)
// ---------------------------------------------------------------------------

export async function handleDurationSelected(
  chatId: string,
  sessionId: string,
  durationMinutes: number,
  lang: Lang = 'cs',
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft || !draft.startTime) {
    await sendMessage(chatId, t(lang, 'flow.draft_expired'));
    return;
  }

  // Deduplicate: ignore if step already advanced (double-click)
  if (draft.step !== 'select_duration') return;

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
  const locationName = calGirl?.locationName ?? null;
  const locationAddress = calGirl?.locationAddress ?? null;
  const location = locationName
    ? (locationAddress ? `${locationName} — ${locationAddress}` : locationName)
    : null;

  // Show confirmation — flowing text summary
  await showConfirmation(chatId, sessionId, draft.girlName, draft.date, draft.startTime, endTime, durationMinutes, price, location, null, lang);
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
  lang: Lang = 'cs',
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

  const msg = `<b>${girlName}</b>, ${formatDate(date, lang)}, ${startTime}–${endTime} (${durationMinutes} min)` +
    (location ? `, ${location}` : '') +
    ` — ${priceText}. ${t(lang, 'flow.confirm_question')}`;

  await sendMessage(chatId, msg, {
    replyMarkup: {
      inline_keyboard: [
        [
          { text: t(lang, 'btn.confirm'), callback_data: `bk_ok:${sessionId}` },
          { text: t(lang, 'btn.promo'), callback_data: `bk_promo:${sessionId}` },
        ],
        [
          { text: t(lang, 'btn.cancel'), callback_data: `bk_cancel:${sessionId}` },
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
  lang: Lang = 'cs',
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft || !draft.startTime || !draft.endTime || !draft.durationMinutes || !draft.clientId) {
    await sendMessage(chatId, t(lang, 'flow.draft_expired'));
    return;
  }

  // Deduplicate: ignore if step already advanced (double-click on confirm)
  if (draft.step !== 'confirm') return;

  // Check slot is still available
  const conflictCheck = await db.execute({
    sql: `SELECT id FROM bookings_v2
          WHERE girl_id = ? AND date = ?
            AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired')
            AND start_time < ? AND end_time > ?`,
    args: [draft.girlId, draft.date, draft.endTime, draft.startTime],
  });

  if (conflictCheck.rows.length > 0) {
    await sendMessage(chatId, t(lang, 'flow.slot_taken'));
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
    await sendMessage(chatId, t(lang, 'flow.slot_locked'));
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
  const bookingCode = generateBookingCode(draft.date);

  // Compute confirmation_due_at = booking start - 2h (for pending bookings / cron reminders)
  // Cron compares against new Date().toISOString() (UTC), so we store UTC ISO string.
  // Use Intl to resolve Prague offset correctly (handles CET +01:00 / CEST +02:00).
  const needsConfirmation = isNewClient ? 1 : 0;
  const confirmationDueAt = (() => {
    const [bh, bm] = draft.startTime!.split(':').map(Number);
    // Get current Prague offset by comparing UTC and Prague representations of the booking date
    const refDate = new Date(`${draft.date}T12:00:00Z`);
    const pragueStr = refDate.toLocaleString('en-US', { timeZone: 'Europe/Prague' });
    const pragueDate = new Date(pragueStr);
    const offsetMs = pragueDate.getTime() - refDate.getTime();
    // Booking start in UTC = Prague local time - offset
    const bookingStartUtc = new Date(`${draft.date}T${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}:00Z`);
    bookingStartUtc.setTime(bookingStartUtc.getTime() - offsetMs);
    // Subtract 2 hours for confirmation deadline
    bookingStartUtc.setTime(bookingStartUtc.getTime() - 2 * 60 * 60 * 1000);
    return bookingStartUtc.toISOString();
  })();

  const bookingResult = await db.execute({
    sql: `INSERT INTO bookings_v2 (
            client_id, girl_id, location_id, date, start_time, end_time, duration_minutes,
            booking_code, price, discount_code_id, discount_amount, points_earned,
            status, needs_confirmation, confirmation_due_at,
            source, channel, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booking_flow', 'telegram', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [draft.clientId, draft.girlId, locationId, draft.date, draft.startTime, draft.endTime, draft.durationMinutes,
           bookingCode, finalPrice, draft.discountCodeId ?? null, discountAmount, finalPrice, bookingStatus,
           needsConfirmation, confirmationDueAt],
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
    sql: `SELECT l.display_name AS location_name, l.address AS location_address, g.girl_type
          FROM girls g
          LEFT JOIN girl_schedules gs ON gs.girl_id = g.id AND gs.day_of_week = ? AND gs.is_active = 1
          LEFT JOIN locations l ON l.id = gs.location_id
          WHERE g.id = ?
          LIMIT 1`,
    args: [(() => { const js = new Date(draft.date + 'T12:00:00').getDay(); return js === 0 ? 6 : js - 1; })(), draft.girlId],
  });
  const girlType = locResult.rows[0]?.girl_type ? String(locResult.rows[0].girl_type) : 'apartment';
  const locName = locResult.rows[0]?.location_name ? String(locResult.rows[0].location_name) : null;
  const locAddr = locResult.rows[0]?.location_address ? String(locResult.rows[0].location_address) : null;
  const location = (girlType === 'escort_only' || girlType === 'both')
    ? 'Escort'
    : (locName ? (locAddr ? `${locName} — ${locAddr}` : locName) : null);

  // Build price text with discount
  let priceText: string;
  if (discountInfo && discountAmount > 0) {
    priceText = `<s>${price} CZK</s> <b>${finalPrice} CZK</b> (${discountInfo.code} -${discountInfo.type === 'percentage' ? discountInfo.value + '%' : discountAmount + ' CZK'})`;
  } else {
    priceText = `<b>${finalPrice} CZK</b>`;
  }

  // Send confirmation — flowing text, different for pending vs confirmed
  const summary = `<b>${draft.girlName}</b>, ${formatDate(draft.date, lang)}, ${draft.startTime}–${draft.endTime} (${draft.durationMinutes} min)` +
    (location ? `, ${location}` : '') +
    ` — ${priceText}`;

  const msg = bookingStatus === 'pending'
    ? t(lang, 'flow.booking_pending', { code: bookingCode, summary })
    : t(lang, 'flow.booking_confirmed', { code: bookingCode, summary });

  if (bookingStatus === 'pending') {
    await sendMessage(chatId, msg, {
      replyMarkup: {
        inline_keyboard: [
          [
            { text: t(lang, 'btn.confirm_arrival'), callback_data: `bk_remind_ok:${bookingId}` },
            { text: t(lang, 'btn.cancel_booking'), callback_data: `bk_remind_cancel:${bookingId}` },
          ],
        ],
      },
    });
  } else {
    // Confirmed bookings also get a cancel button
    await sendMessage(chatId, msg, {
      replyMarkup: {
        inline_keyboard: [
          [{ text: t(lang, 'btn.cancel_booking'), callback_data: `bk_remind_cancel:${bookingId}` }],
        ],
      },
    });
  }

  // ── Notify operator(s) and girl about new booking ──────────────────
  const clientInfo = await db.execute({
    sql: 'SELECT nickname FROM booking_clients WHERE id = ? LIMIT 1',
    args: [draft.clientId],
  });
  const clientNickname = clientInfo.rows[0]?.nickname ? String(clientInfo.rows[0].nickname) : 'Neznamy';

  sendBookingCreatedNotifications({
    bookingId,
    bookingCode,
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
    title: `Nova rezervace ${bookingCode}`,
    message: `${clientNickname} \u2192 ${draft.girlName}, ${formatDate(draft.date)} ${draft.startTime}\u2013${draft.endTime} (${finalPrice} CZK)`,
    bookingId,
    link: `/booking/calendar?date=${draft.date}`,
  }).catch(() => {});

  // Schedule antispam confirmation reminder (30 min after booking)
  const sendAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  db.execute({
    sql: `INSERT INTO booking_reminders (booking_id, chat_id, booking_code, send_at) VALUES (?, ?, ?, ?)`,
    args: [bookingId, chatId, bookingCode, sendAt],
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Staff notifications (operator + girl)
// ---------------------------------------------------------------------------

async function sendBookingCreatedNotifications(params: {
  bookingId: number;
  bookingCode: string;
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
  const { bookingId, bookingCode, clientNickname, girlId, girlName, date, startTime, endTime, durationMinutes, price, status } = params;

  const statusText = status === 'confirmed' ? 'Potvrzena' : 'Ceka na potvrzeni';

  const msg = [
    `\u{1F4C5} <b>Nova rezervace ${bookingCode}</b>`,
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
  lang: Lang = 'cs',
): Promise<void> {
  await expireDraft(sessionId);
  await sendMessage(chatId, t(lang, 'flow.cancelled'));
}

// ---------------------------------------------------------------------------
// Promo code flow
// ---------------------------------------------------------------------------

async function handlePromoPrompt(chatId: string, sessionId: string, lang: Lang = 'cs'): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft) {
    await sendMessage(chatId, t(lang, 'flow.draft_expired'));
    return;
  }

  await db.execute({
    sql: `UPDATE booking_drafts SET step = 'enter_promo', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
    args: [sessionId],
  });

  await sendMessage(chatId, t(lang, 'flow.enter_promo'));
}

/**
 * Called from telegram-bot.ts when user sends text and has active draft in "enter_promo" step.
 * Returns true if handled.
 */
export async function handlePromoCodeInput(chatId: string, text: string, lang: Lang = 'cs'): Promise<boolean> {
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
    await sendMessage(chatId, t(lang, 'flow.promo_invalid', { code }));
    // Go back to confirm step
    await db.execute({
      sql: `UPDATE booking_drafts SET step = 'confirm', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    await reshowConfirmation(chatId, sessionId, r, undefined, lang);
    return true;
  }

  const dc = codeResult.rows[0];
  const maxUses = dc.max_uses ? Number(dc.max_uses) : null;
  const currentUses = Number(dc.current_uses);
  if (maxUses && currentUses >= maxUses) {
    await sendMessage(chatId, t(lang, 'flow.promo_used', { code }));
    await db.execute({
      sql: `UPDATE booking_drafts SET step = 'confirm', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    await reshowConfirmation(chatId, sessionId, r, undefined, lang);
    return true;
  }

  const minDuration = dc.min_duration ? Number(dc.min_duration) : null;
  const draftDuration = r.duration_minutes ? Number(r.duration_minutes) : 0;
  if (minDuration && draftDuration < minDuration) {
    await sendMessage(chatId, t(lang, 'flow.promo_min_duration', { code, min: minDuration, current: draftDuration }));
    await db.execute({
      sql: `UPDATE booking_drafts SET step = 'confirm', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      args: [sessionId],
    });
    await reshowConfirmation(chatId, sessionId, r, undefined, lang);
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
  }, lang);

  return true;
}

async function reshowConfirmation(
  chatId: string,
  sessionId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: any,
  discount?: { code: string; type: string; value: number } | null,
  lang: Lang = 'cs',
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
  const locNameBack = calGirlLoc?.locationName ?? null;
  const locAddrBack = calGirlLoc?.locationAddress ?? null;
  const location = locNameBack ? (locAddrBack ? `${locNameBack} — ${locAddrBack}` : locNameBack) : null;

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

  await showConfirmation(chatId, sessionId, girlName, date, startTime, endTime, durationMinutes, price, location, discount ?? null, lang);
}

// ---------------------------------------------------------------------------
// Back step — go to previous step
// ---------------------------------------------------------------------------

async function handleBack(
  chatId: string,
  sessionId: string,
  lang: Lang = 'cs',
): Promise<void> {
  const draft = await getDraft(sessionId, chatId);
  if (!draft) {
    await sendMessage(chatId, t(lang, 'flow.draft_expired'));
    return;
  }

  if (draft.step === 'confirm') {
    // Back to time selection (keep duration, reset time)
    await db.execute({
      sql: `UPDATE booking_drafts
            SET step = 'select_time', start_time = NULL, end_time = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?`,
      args: [sessionId],
    });

    const slots = await getAvailableSlots(draft.girlId, draft.date, draft.durationMinutes ?? undefined);
    await offerSlot(chatId, sessionId, draft.girlName, draft.date, slots, 0, lang, draft.girlId);
    return;
  }

  if (draft.step === 'select_time') {
    // Back to duration selection (reset time + duration)
    await db.execute({
      sql: `UPDATE booking_drafts
            SET step = 'select_duration', start_time = NULL, end_time = NULL, duration_minutes = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?`,
      args: [sessionId],
    });

    await showDurationSelection(chatId, sessionId, draft.girlId, draft.girlName, draft.date, draft.clientId, lang);
  }
}

// ---------------------------------------------------------------------------
// Button-driven booking menu — no AI chat, just clicks
// ---------------------------------------------------------------------------

/**
 * Standard girl photo caption — used everywhere for consistency.
 */
export function buildGirlCaption(opts: {
  name: string;
  age: number;
  rating: number | null;
  reviewsCount: number;
  shiftStart: string;
  shiftEnd: string;
  location: string | null;
  isEscort: boolean;
  lang?: Lang;
}): string {
  const { name, age, rating, reviewsCount, shiftStart, shiftEnd, location, isEscort, lang = 'cs' } = opts;
  let caption = `<b>${name}</b>, ${t(lang, 'caption.age', { age })}`;
  if (rating) {
    caption += ` | \u2B50 ${rating}/5`;
    if (reviewsCount > 0) caption += ` (${t(lang, 'caption.reviews', { count: reviewsCount })})`;
  }
  caption += `\n\u{1F7E2} ${shiftStart}–${shiftEnd}`;
  if (isEscort) {
    caption += ` | ${t(lang, 'caption.escort')}`;
  } else if (location) {
    caption += ` | \u{1F4CD} ${location}`;
  }
  return caption;
}

/**
 * Show today's available girls with booking buttons.
 * This is the MAIN entry point — called for /start and all text messages.
 * No AI involved, pure button flow.
 */
export async function showAvailableGirlsMenu(chatId: string, lang: Lang = 'cs'): Promise<void> {
  const today = getPragueToday();
  const todayDate = new Date(today + 'T12:00:00');

  // Scan next 7 days — collect which girls actually work this week
  const girlShifts = new Map<number, {
    name: string;
    photoUrl: string | null;
    girlType: string;
    locationName: string | null;
    shifts: { date: string; label: string; start: string; end: string }[];
  }>();

  for (let i = 0; i < 7; i++) {
    const d = new Date(todayDate.getTime() + i * 86400000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const calGirls = await getCalendarGirls(dateStr);
    for (const girl of calGirls) {
      if (!girl.isWorking || !girl.shiftStart || !girl.shiftEnd) continue;

      if (!girlShifts.has(girl.id)) {
        girlShifts.set(girl.id, {
          name: girl.name,
          photoUrl: girl.photoUrl,
          girlType: girl.girlType,
          locationName: girl.locationName,
          shifts: [],
        });
      }

      girlShifts.get(girl.id)!.shifts.push({
        date: dateStr,
        label: formatDate(dateStr, lang),
        start: girl.shiftStart,
        end: girl.shiftEnd,
      });
    }
  }

  if (girlShifts.size === 0) {
    await sendMessage(chatId, t(lang, 'flow.no_girls_today'));
    return;
  }

  // Get age + height + weight + rating for each girl
  const extraInfo = new Map<number, { age: number; height: number | null; weight: number | null; rating: number | null; reviewsCount: number }>();
  for (const gid of girlShifts.keys()) {
    const res = await db.execute({
      sql: 'SELECT age, height, weight, rating, reviews_count FROM girls WHERE id = ? LIMIT 1',
      args: [gid],
    });
    if (res.rows.length > 0) {
      extraInfo.set(gid, {
        age: Number(res.rows[0].age),
        height: res.rows[0].height ? Number(res.rows[0].height) : null,
        weight: res.rows[0].weight ? Number(res.rows[0].weight) : null,
        rating: res.rows[0].rating ? Number(res.rows[0].rating) : null,
        reviewsCount: Number(res.rows[0].reviews_count ?? 0),
      });
    }
  }

  // Build girl list for composite image + caption
  const girlList: Array<{
    girlId: number;
    name: string;
    photoUrl: string;
    age: number;
    height: number | null;
    weight: number | null;
    rating: number | null;
    reviewsCount: number;
  }> = [];

  for (const [girlId, info] of girlShifts) {
    if (!info.photoUrl) continue;
    const extra = extraInfo.get(girlId);
    girlList.push({
      girlId,
      name: info.name,
      photoUrl: info.photoUrl,
      age: extra?.age ?? 0,
      height: extra?.height ?? null,
      weight: extra?.weight ?? null,
      rating: extra?.rating ?? null,
      reviewsCount: extra?.reviewsCount ?? 0,
    });
  }

  if (girlList.length === 0) {
    await sendMessage(chatId, t(lang, 'flow.no_girls_today'));
    return;
  }

  // Generate composite image (just circular photos, no text)
  const composite = await generateGirlsComposite(girlList.map(g => g.photoUrl));

  // Build caption with girl info
  const captionLines = [`<b>✨ ${t(lang, 'flow.choose_girl')}</b>`, ''];
  for (const g of girlList) {
    let line = `<b>${g.name}</b>`;
    const infoParts: string[] = [];
    if (g.age > 0) infoParts.push(`${g.age} ${t(lang, 'caption.years_short')}`);
    if (g.height) infoParts.push(`${g.height} cm`);
    if (g.weight) infoParts.push(`${g.weight} kg`);
    if (infoParts.length > 0) line += ` · ${infoParts.join(' · ')}`;
    if (g.rating) line += ` ⭐ ${g.rating}/5`;
    captionLines.push(line);
  }

  // Build inline keyboard — 2 girls per row
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < girlList.length; i += 2) {
    const row: Array<{ text: string; callback_data: string }> = [];
    row.push({ text: `💋 ${girlList[i].name}`, callback_data: `bk_girl:${girlList[i].girlId}` });
    if (i + 1 < girlList.length) {
      row.push({ text: `💋 ${girlList[i + 1].name}`, callback_data: `bk_girl:${girlList[i + 1].girlId}` });
    }
    buttons.push(row);
  }

  // "My bookings" button at the bottom
  buttons.push([{ text: `📋 ${t(lang, 'btn.my_bookings')}`, callback_data: 'bk_my_bookings' }]);

  await sendPhotoBuffer(chatId, composite, {
    caption: captionLines.join('\n'),
    replyMarkup: { inline_keyboard: buttons },
  });
}

/**
 * Girl selected via button → show available dates this week.
 */
export async function handleGirlSelectedCallback(
  chatId: string,
  girlId: number,
  lang: Lang = 'cs',
): Promise<void> {
  const girlResult = await db.execute({
    sql: "SELECT id, name FROM girls WHERE id = ? AND status = 'active' LIMIT 1",
    args: [girlId],
  });
  if (girlResult.rows.length === 0) {
    await sendMessage(chatId, t(lang, 'flow.girl_not_found_short'));
    return;
  }
  const girlName = String(girlResult.rows[0].name);

  const today = getPragueToday();
  const todayDate = new Date(today + 'T12:00:00');
  const dates: { date: string; label: string; shift: string }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(todayDate.getTime() + i * 86400000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const calGirls = await getCalendarGirls(dateStr);
    const girl = calGirls.find((g) => g.id === girlId);
    if (girl?.isWorking && girl.shiftStart && girl.shiftEnd) {
      const slots = await getAvailableSlots(girlId, dateStr);
      if (slots.length > 0) {
        dates.push({
          date: dateStr,
          label: formatDate(dateStr, lang),
          shift: `${girl.shiftStart}–${girl.shiftEnd}`,
        });
      }
    }
  }

  if (dates.length === 0) {
    await sendMessage(chatId, t(lang, 'flow.no_dates_this_week', { name: girlName }));
    return;
  }

  // Only 1 available date → skip date selection, go to duration selection
  if (dates.length === 1) {
    await handleDateSelectedCallback(chatId, girlId, dates[0].date, lang);
    return;
  }

  const keyboard = dates.map((d) => [{
    text: `${d.label} (${d.shift})`,
    callback_data: `bk_date:${girlId}:${d.date}`,
  }]);
  keyboard.push([{ text: t(lang, 'btn.cancel_short'), callback_data: 'bk_cancel_pre' }]);

  await sendMessage(chatId, `\u{1F4C5} <b>${girlName}</b> — ${t(lang, 'flow.select_day')}`, {
    replyMarkup: { inline_keyboard: keyboard },
  });
}

/**
 * Date selected via button → start booking flow (duration selection first, then time).
 */
export async function handleDateSelectedCallback(
  chatId: string,
  girlId: number,
  date: string,
  lang: Lang = 'cs',
): Promise<void> {
  const ctx = await buildClientContext(chatId, null);

  if (!ctx.isRegistered || !ctx.clientId) {
    // Store intent so after registration we can continue
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const sessionId = `reg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute({
      sql: `INSERT INTO booking_drafts
              (telegram_chat_id, girl_id, date, channel, session_id, step, expires_at)
            VALUES (?, ?, ?, 'telegram', ?, 'awaiting_name', ?)`,
      args: [chatId, girlId, date, sessionId, expiresAt],
    });
    await sendMessage(chatId, t(lang, 'flow.first_visit_name'));
    return;
  }

  try {
    await startBookingFlow(chatId, ctx, girlId, date, lang);
  } catch (error) {
    await sendMessage(chatId,
      error instanceof Error ? error.message : t(lang, 'flow.error_generic'),
    );
  }
}

/**
 * Handle text message when user is in "awaiting_name" registration step.
 * Returns true if handled (user was in registration flow).
 */
export async function handlePendingRegistration(
  chatId: string,
  text: string,
  lang: Lang = 'cs',
): Promise<boolean> {
  const pending = await db.execute({
    sql: `SELECT id, girl_id, date FROM booking_drafts
          WHERE telegram_chat_id = ? AND step = 'awaiting_name'
            AND is_converted = 0 AND expires_at > datetime('now')
          ORDER BY created_at DESC LIMIT 1`,
    args: [chatId],
  });

  if (pending.rows.length === 0) return false;

  const row = pending.rows[0];
  const draftId = Number(row.id);
  const girlId = Number(row.girl_id);
  const date = String(row.date);
  const nickname = text.trim();

  if (nickname.length < 2 || nickname.startsWith('/')) {
    await sendMessage(chatId, t(lang, 'flow.name_too_short'));
    return true;
  }

  // Register client
  const maxRes = await db.execute(
    "SELECT MAX(CAST(REPLACE(client_number, 'LG-', '') AS INTEGER)) AS mx FROM booking_clients WHERE client_number LIKE 'LG-%'",
  );
  const maxNum = Number(maxRes.rows[0]?.mx ?? 0);
  const clientNumber = `LG-${maxNum + 1}`;

  const { randomBytes } = await import('crypto');
  const deepLinkToken = randomBytes(8).toString('hex');

  await db.execute({
    sql: `INSERT INTO booking_clients
            (client_number, nickname, telegram_id, source, trust_level, total_visits, language, deep_link_token, created_at, updated_at)
          VALUES (?, ?, ?, 'telegram', 'new', 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [clientNumber, nickname, chatId, lang, deepLinkToken],
  });

  // Expire the awaiting_name draft
  await db.execute({
    sql: `UPDATE booking_drafts SET expires_at = datetime('now') WHERE id = ?`,
    args: [draftId],
  });

  await sendMessage(chatId, t(lang, 'flow.welcome', { name: nickname }));

  // Continue with booking
  const ctx = await buildClientContext(chatId, null);
  try {
    await startBookingFlow(chatId, ctx, girlId, date, lang);
  } catch (error) {
    await sendMessage(chatId, error instanceof Error ? error.message : t(lang, 'flow.error_generic'));
  }

  return true;
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
  lang: Lang = 'cs',
): Promise<boolean> {
  // bk_girl:{girlId} — girl selected from menu
  if (callbackData.startsWith('bk_girl:')) {
    const girlId = parseInt(callbackData.slice(8), 10);
    await handleGirlSelectedCallback(chatId, girlId, lang);
    return true;
  }

  // bk_date:{girlId}:{YYYY-MM-DD} — date selected
  if (callbackData.startsWith('bk_date:')) {
    const parts = callbackData.split(':');
    if (parts.length >= 3) {
      const girlId = parseInt(parts[1], 10);
      const date = parts[2];
      await handleDateSelectedCallback(chatId, girlId, date, lang);
      return true;
    }
  }

  // bk_interest:{girlId}:{date} — register interest in a girl/date combo
  if (callbackData.startsWith('bk_interest:')) {
    const parts = callbackData.split(':');
    if (parts.length >= 3) {
      const girlId = parseInt(parts[1], 10);
      const date = parts[2];
      await handleInterestRegistration(chatId, girlId, date, lang);
      return true;
    }
  }

  // bk_my_bookings — show client's active bookings
  if (callbackData === 'bk_my_bookings') {
    await handleMyBookings(chatId, lang);
    return true;
  }

  // bk_cancel_pre — cancel before draft
  if (callbackData === 'bk_cancel_pre') {
    await sendMessage(chatId, t(lang, 'flow.cancelled_pre'));
    return true;
  }

  // bk_time:{sessionId}:{HH:MM}
  if (callbackData.startsWith('bk_time:')) {
    const parts = callbackData.split(':');
    // bk_time : sessionId : HH : MM
    if (parts.length >= 4) {
      const sessionId = parts[1];
      const time = `${parts[2]}:${parts[3]}`;
      await handleTimeSelected(chatId, sessionId, time, lang);
      return true;
    }
  }

  // bk_slot_yes:{sessionId}:{HH}:{MM} — accept offered slot → go to confirmation
  if (callbackData.startsWith('bk_slot_yes:')) {
    const parts = callbackData.split(':');
    if (parts.length >= 4) {
      const sessionId = parts[1];
      const time = `${parts[2]}:${parts[3]}`;
      const draft = await getDraft(sessionId, chatId);
      if (!draft) {
        await sendMessage(chatId, t(lang, 'flow.draft_expired'));
        return true;
      }
      // Deduplicate: ignore if step already advanced
      if (draft.step !== 'select_time') return true;
      // Duration was already chosen — compute end_time and go to confirmation
      const durationMinutes = draft.durationMinutes ?? 30;
      const endTime = addMinutes(time, durationMinutes);
      // Get price
      const priceResult = await db.execute({
        sql: 'SELECT price, night_price FROM pricing_plans WHERE duration = ? AND is_active = 1 LIMIT 1',
        args: [durationMinutes],
      });
      const priceRow = priceResult.rows[0];
      const [sh] = time.split(':').map(Number);
      const isNight = sh >= 22 || sh < 6;
      const price = priceRow
        ? (isNight && priceRow.night_price ? Number(priceRow.night_price) : Number(priceRow.price))
        : 0;
      // Update draft with time and advance to confirm
      await db.execute({
        sql: `UPDATE booking_drafts
              SET start_time = ?, end_time = ?, step = 'confirm', updated_at = CURRENT_TIMESTAMP
              WHERE session_id = ?`,
        args: [time, endTime, sessionId],
      });
      // Get location
      const calGirls = await getCalendarGirls(draft.date);
      const calGirl = calGirls.find((g) => g.id === draft.girlId);
      const locationName = calGirl?.locationName ?? null;
      const locationAddress = calGirl?.locationAddress ?? null;
      const location = locationName
        ? (locationAddress ? `${locationName} — ${locationAddress}` : locationName)
        : null;
      await showConfirmation(chatId, sessionId, draft.girlName, draft.date, time, endTime, durationMinutes, price, location, null, lang);
      return true;
    }
  }

  // bk_slot_no:{sessionId}:{HH}:{MM} — reject slot, offer next
  if (callbackData.startsWith('bk_slot_no:')) {
    const parts = callbackData.split(':');
    if (parts.length >= 4) {
      const sessionId = parts[1];
      const rejectedTime = `${parts[2]}:${parts[3]}`;
      const draft = await getDraft(sessionId, chatId);
      if (!draft) {
        await sendMessage(chatId, t(lang, 'flow.draft_expired'));
        return true;
      }
      // Re-fetch fresh slots filtered by stored duration and find next one after the rejected time
      const slots = await getAvailableSlots(draft.girlId, draft.date, draft.durationMinutes ?? undefined);
      const nextIndex = slots.findIndex((s) => s > rejectedTime);
      await offerSlot(chatId, sessionId, draft.girlName, draft.date, slots, nextIndex >= 0 ? nextIndex : slots.length, lang, draft.girlId);
      return true;
    }
  }

  // bk_dur:{sessionId}:{minutes} — duration selected, now offer time slots
  if (callbackData.startsWith('bk_dur:')) {
    const parts = callbackData.split(':');
    if (parts.length >= 3) {
      const sessionId = parts[1];
      const minutes = parseInt(parts[2], 10);
      const draft = await getDraft(sessionId, chatId);
      if (!draft) {
        await sendMessage(chatId, t(lang, 'flow.draft_expired'));
        return true;
      }
      // Deduplicate: ignore if step already advanced
      if (draft.step !== 'select_duration') return true;
      // Save duration and advance to select_time
      await db.execute({
        sql: `UPDATE booking_drafts SET duration_minutes = ?, step = 'select_time', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
        args: [minutes, sessionId],
      });
      // Get slots filtered by chosen duration
      const slots = await getAvailableSlots(draft.girlId, draft.date, minutes);
      if (slots.length === 0) {
        await sendMessage(chatId, t(lang, 'flow.no_more_slots', { name: draft.girlName }), {
          replyMarkup: {
            inline_keyboard: [[
              { text: t(lang, 'btn.notify_me'), callback_data: `bk_interest:${draft.girlId}:${draft.date}` },
            ]],
          },
        });
        await expireDraft(sessionId);
        return true;
      }
      await offerSlot(chatId, sessionId, draft.girlName, draft.date, slots, 0, lang, draft.girlId);
      return true;
    }
  }

  // bk_promo:{sessionId} — enter promo code
  if (callbackData.startsWith('bk_promo:')) {
    const sessionId = callbackData.slice(9);
    await handlePromoPrompt(chatId, sessionId, lang);
    return true;
  }

  // bk_ok:{sessionId}
  if (callbackData.startsWith('bk_ok:')) {
    const sessionId = callbackData.slice(6);
    await handleConfirm(chatId, sessionId, lang);
    return true;
  }

  // bk_cancel:{sessionId}
  if (callbackData.startsWith('bk_cancel:')) {
    const sessionId = callbackData.slice(10);
    await handleCancel(chatId, sessionId, lang);
    return true;
  }

  // bk_back:{sessionId}
  if (callbackData.startsWith('bk_back:')) {
    const sessionId = callbackData.slice(8);
    await handleBack(chatId, sessionId, lang);
    return true;
  }

  // bk_remind_ok:{bookingId} — client confirms attendance
  if (callbackData.startsWith('bk_remind_ok:')) {
    const bookingId = parseInt(callbackData.slice(13), 10);
    await handleClientConfirm(chatId, bookingId, lang);
    return true;
  }

  // bk_remind_cancel:{bookingId} — client cancels
  if (callbackData.startsWith('bk_remind_cancel:')) {
    const bookingId = parseInt(callbackData.slice(17), 10);
    await handleClientCancel(chatId, bookingId, lang);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// My bookings — show client's active reservations with cancel buttons
// ---------------------------------------------------------------------------

async function handleMyBookings(chatId: string, lang: Lang = 'cs'): Promise<void> {
  const today = getPragueToday();

  const result = await db.execute({
    sql: `SELECT b.id, b.date, b.start_time, b.end_time, b.status,
                 g.name AS girl_name
          FROM bookings_v2 b
          JOIN booking_clients bc ON bc.id = b.client_id
          JOIN girls g ON g.id = b.girl_id
          WHERE bc.telegram_id = ?
            AND b.status IN ('pending', 'confirmed')
            AND b.date >= ?
          ORDER BY b.date ASC, b.start_time ASC`,
    args: [chatId, today],
  });

  if (result.rows.length === 0) {
    await sendMessage(chatId, t(lang, 'bookings.none'));
    return;
  }

  // Send each booking as a message with cancel button
  for (const row of result.rows) {
    const bookingId = Number(row.id);
    const girlName = String(row.girl_name);
    const date = String(row.date);
    const startTime = String(row.start_time).substring(0, 5);
    const endTime = String(row.end_time).substring(0, 5);
    const status = String(row.status);

    const statusEmoji = status === 'confirmed' ? '✅' : '⏳';
    const statusLabel = status === 'confirmed'
      ? t(lang, 'status.confirmed')
      : t(lang, 'status.pending');

    const text = [
      `${statusEmoji} <b>${girlName}</b>`,
      `📅 ${formatDate(date, lang)}`,
      `⏰ ${startTime}–${endTime}`,
      `${t(lang, 'bookings.status')}: ${statusLabel}`,
    ].join('\n');

    await sendMessage(chatId, text, {
      replyMarkup: {
        inline_keyboard: [[
          { text: `❌ ${t(lang, 'btn.cancel_booking')}`, callback_data: `bk_remind_cancel:${bookingId}` },
        ]],
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Client self-confirm / cancel (for pending bookings)
// ---------------------------------------------------------------------------

async function handleClientConfirm(chatId: string, bookingId: number, lang: Lang = 'cs'): Promise<void> {
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
    await sendMessage(chatId, t(lang, 'confirm.not_found'));
    return;
  }

  const booking = result.rows[0];
  if (String(booking.status) !== 'pending') {
    const label = String(booking.status) === 'confirmed' ? t(lang, 'status.already_confirmed') : t(lang, 'status.not_active');
    await sendMessage(chatId, t(lang, 'status.booking_is', { label }));
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
    `\u2705 <b>${String(booking.girl_name)}</b>, ${formatDate(String(booking.date), lang)}, ${startTime}–${endTime} — ${t(lang, 'confirm.success')}`
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

async function handleClientCancel(chatId: string, bookingId: number, lang: Lang = 'cs'): Promise<void> {
  const result = await db.execute({
    sql: `SELECT b.id, b.status, b.girl_id, b.date, b.start_time, b.end_time,
                 g.name AS girl_name, bc.telegram_id
          FROM bookings_v2 b
          JOIN booking_clients bc ON bc.id = b.client_id
          JOIN girls g ON g.id = b.girl_id
          WHERE b.id = ? AND bc.telegram_id = ?`,
    args: [bookingId, chatId],
  });

  if (result.rows.length === 0) {
    await sendMessage(chatId, t(lang, 'confirm.not_found'));
    return;
  }

  const booking = result.rows[0];
  const status = String(booking.status);
  if (status !== 'pending' && status !== 'confirmed') {
    await sendMessage(chatId, t(lang, 'status.booking_is', { label: t(lang, 'status.not_active') }));
    return;
  }

  await db.execute({
    sql: `UPDATE bookings_v2 SET status = 'cancelled_client',
          cancel_reason = 'Klient zrusil pres Telegram',
          cancel_reason_encrypted = ?,
          cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status IN ('pending', 'confirmed')`,
    args: [safeEncrypt('Klient zrusil pres Telegram'), bookingId],
  });

  // Release slot lock
  await db.execute({
    sql: 'DELETE FROM slot_locks WHERE locked_by = ?',
    args: [`booking:${bookingId}`],
  }).catch(() => {});

  await sendMessage(chatId, t(lang, 'cancel.client_done'));

  logAudit({
    bookingId,
    action: 'booking.client_cancel',
    actorType: 'bot',
    entityType: 'booking',
    entityId: bookingId,
    details: { chatId, source: 'client_self_cancel' },
  }).catch(() => {});

  // ── Notify interested clients about freed slot ──────────────
  try {
    const girlId = Number(booking.girl_id);
    const date = String(booking.date);
    const startTime = String(booking.start_time).substring(0, 5);
    const endTime = String(booking.end_time).substring(0, 5);
    const girlName = String(booking.girl_name);

    const interested = await db.execute({
      sql: `SELECT DISTINCT bi.telegram_chat_id, bc.language
            FROM booking_interest bi
            LEFT JOIN booking_clients bc ON bc.telegram_id = bi.telegram_chat_id
            WHERE bi.girl_id = ? AND bi.date = ?
              AND bi.telegram_chat_id != ?
              AND bi.created_at > datetime('now', '-7 days')`,
      args: [girlId, date, chatId],
    });

    for (const intRow of interested.rows) {
      const intChatId = String(intRow.telegram_chat_id);
      const intLang = (intRow.language === 'en' || intRow.language === 'uk'
        ? intRow.language : 'cs') as Lang;
      sendMessage(intChatId, [
        t(intLang, 'cron.freed_slot'),
        '',
        `\u{1F469} ${girlName}`,
        `\u23F0 ${startTime}\u2013${endTime} (${formatDate(date, intLang)})`,
        '',
        t(intLang, 'cron.freed_slot_cta'),
      ].join('\n')).catch(() => {});
    }

    // Cleanup interest records for this girl/date
    await db.execute({
      sql: `DELETE FROM booking_interest WHERE girl_id = ? AND date = ?`,
      args: [girlId, date],
    }).catch(() => {});
  } catch { /* silent — cancel itself succeeded */ }
}

// ---------------------------------------------------------------------------
// Waitlist — "Notify me" when no slots available
// ---------------------------------------------------------------------------

async function handleInterestRegistration(
  chatId: string,
  girlId: number,
  date: string,
  lang: Lang = 'cs',
): Promise<void> {
  // Deduplicate — check if already registered
  const existing = await db.execute({
    sql: `SELECT id FROM booking_interest
          WHERE telegram_chat_id = ? AND girl_id = ? AND date = ?
          LIMIT 1`,
    args: [chatId, girlId, date],
  });
  if (existing.rows.length > 0) {
    await sendMessage(chatId, t(lang, 'flow.interest_already'));
    return;
  }

  // Get girl name for confirmation message
  const girlRes = await db.execute({
    sql: 'SELECT name FROM girls WHERE id = ? LIMIT 1',
    args: [girlId],
  });
  const girlName = girlRes.rows[0]?.name ? String(girlRes.rows[0].name) : '???';

  // Insert interest
  await db.execute({
    sql: `INSERT INTO booking_interest (telegram_chat_id, girl_id, date)
          VALUES (?, ?, ?)`,
    args: [chatId, girlId, date],
  });

  await sendMessage(chatId, t(lang, 'flow.interest_registered', { name: girlName, date: formatDate(date, lang) }));
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

export async function getAvailableSlots(girlId: number, date: string, durationMinutes?: number): Promise<string[]> {
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

  // Generate free slots — dynamic gaps based on bookings + break, rounded to 15min
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);
  const shiftStartMin = startH * 60 + startM + config.startOffset; // Apply booking_start_offset
  const shiftEndMin = endH * 60 + endM;

  // Filter out past times if date is today
  const today = getPragueToday();
  const now = getPragueNow();
  const currentMin = date === today ? now.getHours() * 60 + now.getMinutes() + 30 : 0; // +30min buffer

  // Use explicit duration if provided (new flow: duration chosen before time),
  // otherwise fall back to minimum bookable duration for slot existence check
  const minDuration = durationMinutes
    ?? (config.allowedDurations ? Math.min(...config.allowedDurations) : 30);

  // Sort blocked ranges by start time
  const sortedBlocked = [...blockedRanges].sort((a, b) => a.start - b.start);

  // Build candidate start times: shift start, then after each booking ends + break (rounded to 15min)
  const candidates = new Set<number>();
  // Shift start (rounded up to 15min)
  const roundedShiftStart = Math.ceil(shiftStartMin / 15) * 15;
  candidates.add(roundedShiftStart);
  // After each blocked range: end + break, rounded up to 15min
  for (const b of sortedBlocked) {
    const afterBlock = Math.ceil((b.end + config.breakMinutes) / 15) * 15;
    candidates.add(afterBlock);
  }

  const freeSlots: string[] = [];
  for (const m of [...candidates].sort((a, b) => a - b)) {
    if (m < currentMin) continue;
    if (m >= shiftEndMin) continue;

    // Check not inside a blocked range (including break)
    const isBlocked = sortedBlocked.some(b => m < b.end + config.breakMinutes && m + minDuration > b.start);
    if (isBlocked) continue;

    // Check if minimum duration fits before shift end (+30min overflow tolerance)
    if (m + minDuration > shiftEndMin + 30) continue;

    // Check if minimum duration fits before next blocked range
    const nextBlock = sortedBlocked.find(b => b.start > m);
    if (nextBlock && m + minDuration + config.breakMinutes > nextBlock.start) continue;

    freeSlots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }

  return freeSlots;
}

async function getAvailableDurations(
  girlId: number,
  date: string,
  startTime: string,
  lang: Lang = 'cs',
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
      sql: 'SELECT price, night_price, title_cs, title_en, title_uk FROM pricing_plans WHERE duration = ? AND is_active = 1 LIMIT 1',
      args: [dur],
    });
    if (priceResult.rows.length > 0) {
      const pr = priceResult.rows[0];
      const price = isNight && pr.night_price ? Number(pr.night_price) : Number(pr.price);
      const titleCol = lang === 'en' ? 'title_en' : lang === 'uk' ? 'title_uk' : 'title_cs';
      const title = (pr[titleCol] ? String(pr[titleCol]) : null) ?? (pr.title_cs ? String(pr.title_cs) : `${dur} min`);
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

const DAY_NAMES: Record<Lang, string[]> = {
  cs: ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  uk: ['\u041D\u0434', '\u041F\u043D', '\u0412\u0442', '\u0421\u0440', '\u0427\u0442', '\u041F\u0442', '\u0421\u0431'],
};

function formatDate(date: string, lang: Lang = 'cs'): string {
  const d = new Date(date + 'T12:00:00');
  const days = DAY_NAMES[lang] ?? DAY_NAMES.cs;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${days[d.getDay()]} ${day}.${month}.`;
}
