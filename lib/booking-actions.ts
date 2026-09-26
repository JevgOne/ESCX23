'use server';

import { db } from './db';
import { requireBooking } from './auth';
import { safeEncrypt } from './crypto';

const BREAK_MINUTES = 10; // 10-min break between bookings

// ---------------------------------------------------------------------------
// Client lookup by phone HMAC or nickname
// ---------------------------------------------------------------------------

export interface ClientSearchResult {
  id: number;
  clientNumber: string;
  nickname: string;
  trustLevel: string;
  totalVisits: number;
  noShowCount: number;
  telegramId: string | null;
  lastVisitDate: string | null;
  lastVisitGirl: string | null;
}

export async function searchClient(query: string): Promise<ClientSearchResult | null> {
  await requireBooking();

  if (!query.trim()) return null;

  // Try exact match on client_number or nickname
  const result = await db.execute({
    sql: `
      SELECT
        bc.id, bc.client_number, bc.nickname, bc.trust_level,
        bc.total_visits, bc.no_show_count, bc.telegram_id,
        (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id ORDER BY b.date DESC LIMIT 1) AS last_date,
        (SELECT g.name FROM bookings_v2 b JOIN girls g ON g.id = b.girl_id WHERE b.client_id = bc.id ORDER BY b.date DESC LIMIT 1) AS last_girl
      FROM booking_clients bc
      WHERE bc.client_number = ? OR bc.nickname = ?
      LIMIT 1
    `,
    args: [query.trim(), query.trim()],
  });

  if (result.rows.length === 0) return null;

  const r = result.rows[0];
  return {
    id: Number(r.id),
    clientNumber: String(r.client_number),
    nickname: String(r.nickname),
    trustLevel: String(r.trust_level),
    totalVisits: Number(r.total_visits),
    noShowCount: Number(r.no_show_count),
    telegramId: r.telegram_id ? String(r.telegram_id) : null,
    lastVisitDate: r.last_date ? String(r.last_date) : null,
    lastVisitGirl: r.last_girl ? String(r.last_girl) : null,
  };
}

export async function searchClients(query: string): Promise<ClientSearchResult[]> {
  await requireBooking();

  const q = query.trim();
  if (!q || q.length < 2) return [];

  const result = await db.execute({
    sql: `
      SELECT
        bc.id, bc.client_number, bc.nickname, bc.trust_level,
        bc.total_visits, bc.no_show_count, bc.telegram_id,
        (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id ORDER BY b.date DESC LIMIT 1) AS last_date,
        (SELECT g.name FROM bookings_v2 b JOIN girls g ON g.id = b.girl_id WHERE b.client_id = bc.id ORDER BY b.date DESC LIMIT 1) AS last_girl
      FROM booking_clients bc
      WHERE bc.nickname LIKE ? OR bc.client_number LIKE ?
      ORDER BY bc.total_visits DESC
      LIMIT 8
    `,
    args: [`%${q}%`, `%${q}%`],
  });

  return result.rows.map((r) => ({
    id: Number(r.id),
    clientNumber: String(r.client_number),
    nickname: String(r.nickname),
    trustLevel: String(r.trust_level),
    totalVisits: Number(r.total_visits),
    noShowCount: Number(r.no_show_count),
    telegramId: r.telegram_id ? String(r.telegram_id) : null,
    lastVisitDate: r.last_date ? String(r.last_date) : null,
    lastVisitGirl: r.last_girl ? String(r.last_girl) : null,
  }));
}

// ---------------------------------------------------------------------------
// Available girls for a given date
// ---------------------------------------------------------------------------

export interface AvailableGirl {
  id: number;
  name: string;
  photoUrl: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  locationName: string | null;
  isWorking: boolean;
  bookedSlots: string[]; // ["14:00-15:00", "17:00-18:00"]
  allowedDurations: number[] | null; // null = all durations, e.g. [60] = only 60min
}

export async function getAvailableGirls(date: string): Promise<AvailableGirl[]> {
  await requireBooking();

  const d = new Date(date + 'T12:00:00');
  const jsDay = d.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  const result = await db.execute({
    sql: `
      SELECT
        g.id, g.name, g.booking_allowed_durations,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo_url,
        gs.start_time AS shift_start, gs.end_time AS shift_end,
        l.display_name AS location_name,
        se.exception_type AS exception_type, se.start_time AS ex_start, se.end_time AS ex_end
      FROM girls g
      LEFT JOIN (
        SELECT girl_id, start_time, end_time, location_id,
               ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
        FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
          AND (effective_from IS NULL OR effective_from <= ?)
      ) gs ON gs.girl_id = g.id AND gs.rn = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.status IN ('active', 'inactive')
      ORDER BY
        CASE WHEN gs.start_time IS NOT NULL THEN 0 ELSE 1 END,
        g.name
    `,
    args: [dayOfWeek, date, date],
  });

  // Get existing bookings for this date
  const bookingsRes = await db.execute({
    sql: `SELECT girl_id, start_time, end_time FROM bookings_v2 WHERE date = ? AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')`,
    args: [date],
  });
  const bookedByGirl = new Map<number, string[]>();
  for (const r of bookingsRes.rows) {
    const gid = Number(r.girl_id);
    const slots = bookedByGirl.get(gid) ?? [];
    slots.push(`${String(r.start_time).substring(0, 5)}-${String(r.end_time).substring(0, 5)}`);
    bookedByGirl.set(gid, slots);
  }

  return result.rows.map((r) => {
    const exType = r.exception_type ? String(r.exception_type) : null;
    let shiftStart = r.shift_start ? String(r.shift_start).substring(0, 5) : null;
    let shiftEnd = r.shift_end ? String(r.shift_end).substring(0, 5) : null;

    if (exType === 'unavailable') { shiftStart = null; shiftEnd = null; }
    else if (exType === 'custom_hours') {
      shiftStart = r.ex_start ? String(r.ex_start).substring(0, 5) : shiftStart;
      shiftEnd = r.ex_end ? String(r.ex_end).substring(0, 5) : shiftEnd;
    }

    return {
      id: Number(r.id),
      name: String(r.name),
      photoUrl: r.photo_url ? String(r.photo_url) : null,
      shiftStart,
      shiftEnd,
      locationName: r.location_name ? String(r.location_name) : null,
      isWorking: shiftStart !== null && shiftEnd !== null,
      bookedSlots: bookedByGirl.get(Number(r.id)) ?? [],
      allowedDurations: r.booking_allowed_durations
        ? JSON.parse(String(r.booking_allowed_durations)) as number[]
        : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Available time slots for a girl on a date
// ---------------------------------------------------------------------------

export async function getAvailableSlots(
  girlId: number,
  date: string,
  durationMinutes: number,
): Promise<{ time: string; available: boolean }[]> {
  await requireBooking();

  const d = new Date(date + 'T12:00:00');
  const jsDay = d.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  // Get girl's shift
  const shiftRes = await db.execute({
    sql: `
      SELECT gs.start_time, gs.end_time, se.exception_type AS ex_type, se.start_time AS ex_start, se.end_time AS ex_end
      FROM girls g
      LEFT JOIN (
        SELECT girl_id, start_time, end_time,
               ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
        FROM girl_schedules WHERE girl_id = ? AND day_of_week = ? AND is_active = 1
          AND (effective_from IS NULL OR effective_from <= ?)
      ) gs ON gs.girl_id = g.id AND gs.rn = 1
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.id = ?
    `,
    args: [girlId, dayOfWeek, date, date, girlId],
  });

  if (shiftRes.rows.length === 0) return [];

  const row = shiftRes.rows[0];
  const exType = row.ex_type ? String(row.ex_type) : null;
  let shiftStart = row.start_time ? String(row.start_time).substring(0, 5) : null;
  let shiftEnd = row.end_time ? String(row.end_time).substring(0, 5) : null;

  if (exType === 'unavailable') return [];
  if (exType === 'custom_hours') {
    shiftStart = row.ex_start ? String(row.ex_start).substring(0, 5) : shiftStart;
    shiftEnd = row.ex_end ? String(row.ex_end).substring(0, 5) : shiftEnd;
  }

  if (!shiftStart || !shiftEnd) return [];

  // Per-girl booking config (Emily etc.)
  const configRes = await db.execute({
    sql: 'SELECT booking_start_offset, booking_break_minutes FROM girls WHERE id = ? LIMIT 1',
    args: [girlId],
  });
  const configRow = configRes.rows[0];
  const startOffset = configRow?.booking_start_offset ? Number(configRow.booking_start_offset) : 0;
  const girlBreak = configRow?.booking_break_minutes ? Number(configRow.booking_break_minutes) : BREAK_MINUTES;

  // Get existing bookings
  const bookingsRes = await db.execute({
    sql: `SELECT start_time, end_time FROM bookings_v2 WHERE girl_id = ? AND date = ? AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')`,
    args: [girlId, date],
  });

  const bookedRanges = bookingsRes.rows.map((r) => ({
    start: String(r.start_time).substring(0, 5),
    end: String(r.end_time).substring(0, 5),
  }));

  // Generate 30-min slots within shift
  const [sh, sm] = shiftStart.split(':').map(Number);
  const [eh, em] = shiftEnd.split(':').map(Number);
  const shiftStartMin = sh * 60 + sm + startOffset; // Apply booking_start_offset
  const shiftEndMin = eh * 60 + em;

  // For today: skip slots that already passed (Prague timezone)
  const pragueNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const todayStr = `${pragueNow.getFullYear()}-${String(pragueNow.getMonth() + 1).padStart(2, '0')}-${String(pragueNow.getDate()).padStart(2, '0')}`;
  const isToday = date === todayStr;
  const nowMin = isToday ? pragueNow.getHours() * 60 + pragueNow.getMinutes() : 0;

  const slots: { time: string; available: boolean }[] = [];

  for (let min = shiftStartMin; min + durationMinutes <= shiftEndMin; min += 30) {
    // Skip past time slots for today
    if (isToday && min < nowMin) continue;
    const h = Math.floor(min / 60);
    const m = min % 60;
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const endMin = min + durationMinutes;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Check overlap with existing bookings (including break buffer)
    const isAvailable = !bookedRanges.some((b) => {
      const [bsh, bsm] = b.start.split(':').map(Number);
      const [beh, bem] = b.end.split(':').map(Number);
      const bStart = bsh * 60 + bsm;
      const bEnd = beh * 60 + bem;
      return min < bEnd + girlBreak && endMin > bStart - girlBreak;
    });

    slots.push({ time, available: isAvailable });
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Create booking
// ---------------------------------------------------------------------------

export interface CreateBookingInput {
  clientId: number;
  girlId: number;
  date: string;
  startTime: string;
  durationMinutes: number;
  channel: string;
  notes?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<{ id: number } | { error: string }> {
  const user = await requireBooking();

  // Calculate end time
  const [h, m] = input.startTime.split(':').map(Number);
  const endMin = h * 60 + m + input.durationMinutes;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // Buffered times for 10-min break check
  const bufStartMin = h * 60 + m - BREAK_MINUTES;
  const bufStart = `${String(Math.floor(bufStartMin / 60)).padStart(2, '0')}:${String(bufStartMin % 60).padStart(2, '0')}`;
  const bufEndMin2 = endMin + BREAK_MINUTES;
  const bufEnd = `${String(Math.floor(bufEndMin2 / 60)).padStart(2, '0')}:${String(bufEndMin2 % 60).padStart(2, '0')}`;

  // Check for conflicts (including BREAK_MINUTES buffer)
  const conflicts = await db.execute({
    sql: `
      SELECT id FROM bookings_v2
      WHERE girl_id = ? AND date = ?
        AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')
        AND (
          (start_time < ? AND end_time > ?)
        )
    `,
    args: [input.girlId, input.date, bufEnd, bufStart],
  });

  if (conflicts.rows.length > 0) {
    return { error: 'Casovy konflikt — termin je obsazeny.' };
  }

  // Get girl name for points calculation
  const girlRes = await db.execute({
    sql: 'SELECT name FROM girls WHERE id = ?',
    args: [input.girlId],
  });
  const girlName = girlRes.rows[0] ? String(girlRes.rows[0].name) : '?';

  // Get price from pricing_plans
  const priceRes = await db.execute({
    sql: 'SELECT price FROM pricing_plans WHERE duration = ? LIMIT 1',
    args: [input.durationMinutes],
  });
  const price = priceRes.rows[0] ? Number(priceRes.rows[0].price) : null;

  // Points = price (1 CZK = 1 point)
  const points = price ?? 0;

  // Get location from girl's schedule for this date
  const d = new Date(input.date + 'T12:00:00');
  const jsDay = d.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const locRes = await db.execute({
    sql: `
      SELECT gs.location_id FROM girl_schedules gs
      WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
        AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
      ORDER BY gs.effective_from DESC NULLS LAST LIMIT 1
    `,
    args: [input.girlId, dayOfWeek, input.date],
  });
  const locationId = locRes.rows[0] ? Number(locRes.rows[0].location_id) : null;

  const result = await db.execute({
    sql: `
      INSERT INTO bookings_v2 (
        client_id, girl_id, location_id, date, start_time, end_time,
        duration_minutes, price, points_earned, status, channel,
        source, notes_encrypted, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 'manual', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    args: [
      input.clientId, input.girlId, locationId, input.date,
      input.startTime, endTime, input.durationMinutes,
      price, points, input.channel,
      safeEncrypt(input.notes ?? null), user.id,
    ],
  });

  const bookingId = Number(result.lastInsertRowid);

  // Update client total_visits
  await db.execute({
    sql: 'UPDATE booking_clients SET total_visits = total_visits + 1, total_points = total_points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [points, input.clientId],
  });

  // Get client nickname for notification
  const clientRes = await db.execute({
    sql: 'SELECT nickname FROM booking_clients WHERE id = ?',
    args: [input.clientId],
  });
  const clientName = clientRes.rows[0] ? String(clientRes.rows[0].nickname) : 'Klient';

  // Send push + Telegram notification to the girl (fire and forget)
  import('./push').then(({ sendPushToGirl }) => {
    sendPushToGirl(input.girlId, {
      title: 'Nova rezervace',
      body: `${clientName} — ${input.date} ${input.startTime}–${endTime} (${input.durationMinutes} min)`,
      url: '/studio/dashboard',
      tag: `booking-${bookingId}`,
    }).catch(() => {});
  }).catch(() => {});

  // Telegram notification to girl
  import('./telegram').then(async ({ notifyGirlNewBooking }) => {
    const chatRes = await db.execute({
      sql: "SELECT telegram_chat_id FROM users WHERE girl_id = ? AND role = 'girl' AND telegram_chat_id IS NOT NULL LIMIT 1",
      args: [input.girlId],
    });
    if (chatRes.rows[0]?.telegram_chat_id) {
      notifyGirlNewBooking(
        String(chatRes.rows[0].telegram_chat_id),
        bookingId, input.date, input.startTime, endTime, input.durationMinutes,
      ).catch(() => {});
    }
  }).catch(() => {});

  return { id: bookingId };
}

// ---------------------------------------------------------------------------
// Create break/pause (no client)
// ---------------------------------------------------------------------------

export async function createBreak(input: {
  girlId: number;
  date: string;
  startTime: string;
  durationMinutes: number;
  notes?: string;
}): Promise<{ id: number } | { error: string }> {
  const user = await requireBooking();

  // Calculate end time
  const [h, m] = input.startTime.split(':').map(Number);
  const endMin = h * 60 + m + input.durationMinutes;
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

  // Buffered times for 10-min break check
  const bufStartMin = h * 60 + m - BREAK_MINUTES;
  const bufStart = `${String(Math.floor(Math.max(0, bufStartMin) / 60)).padStart(2, '0')}:${String(Math.max(0, bufStartMin) % 60).padStart(2, '0')}`;
  const bufEndMin2 = endMin + BREAK_MINUTES;
  const bufEnd = `${String(Math.floor(bufEndMin2 / 60)).padStart(2, '0')}:${String(bufEndMin2 % 60).padStart(2, '0')}`;

  // Check for conflicts (including BREAK_MINUTES buffer)
  const conflicts = await db.execute({
    sql: `
      SELECT id FROM bookings_v2
      WHERE girl_id = ? AND date = ?
        AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')
        AND (start_time < ? AND end_time > ?)
    `,
    args: [input.girlId, input.date, bufEnd, bufStart],
  });

  if (conflicts.rows.length > 0) {
    return { error: 'Casovy konflikt — termin je obsazeny.' };
  }

  // Get location from girl's schedule for this date
  const d = new Date(input.date + 'T12:00:00');
  const jsDay = d.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const locRes = await db.execute({
    sql: `
      SELECT gs.location_id FROM girl_schedules gs
      WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
        AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
      ORDER BY gs.effective_from DESC NULLS LAST LIMIT 1
    `,
    args: [input.girlId, dayOfWeek, input.date],
  });
  const locationId = locRes.rows[0] ? Number(locRes.rows[0].location_id) : null;

  const result = await db.execute({
    sql: `
      INSERT INTO bookings_v2 (
        client_id, girl_id, location_id, date, start_time, end_time,
        duration_minutes, price, points_earned, status, channel,
        source, booking_type, notes_encrypted, created_by, created_at, updated_at
      ) VALUES (0, ?, ?, ?, ?, ?, ?, 0, 0, 'confirmed', 'admin', 'manual', 'break', ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    args: [
      input.girlId, locationId, input.date,
      input.startTime, endTime, input.durationMinutes,
      safeEncrypt(input.notes ?? 'Pauza'), user.id,
    ],
  });

  return { id: Number(result.lastInsertRowid) };
}

// ---------------------------------------------------------------------------
// Create new client (quick inline)
// ---------------------------------------------------------------------------

export async function createClient(
  nickname: string,
  channel: string,
): Promise<{ id: number; clientNumber: string }> {
  await requireBooking();

  // Generate client number
  const countRes = await db.execute('SELECT COUNT(*) AS c FROM booking_clients');
  const count = Number(countRes.rows[0]?.c ?? 0);
  const clientNumber = `KLIENT${String(count + 1).padStart(4, '0')}`;

  const result = await db.execute({
    sql: `
      INSERT INTO booking_clients (client_number, nickname, source, trust_level, created_at, updated_at)
      VALUES (?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    args: [clientNumber, nickname, channel],
  });

  return {
    id: Number(result.lastInsertRowid),
    clientNumber,
  };
}

// ---------------------------------------------------------------------------
// Update booking status (confirm, complete, cancel, no-show, etc.)
// ---------------------------------------------------------------------------

export async function updateBookingStatus(
  bookingId: number,
  newStatus: string,
  cancelReason?: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireBooking();
  const isAdmin = user.role === 'admin';

  const validStatuses = [
    'confirmed', 'completed', 'in_progress',
    'no_show', 'cancelled_client', 'cancelled_girl',
    'declined', 'rescheduled',
  ];
  if (!validStatuses.includes(newStatus)) {
    return { error: 'Neplatny status' };
  }

  // Operator must provide cancel reason
  if (!isAdmin && ['cancelled_client', 'cancelled_girl', 'declined'].includes(newStatus)) {
    if (!cancelReason || cancelReason.trim().length === 0) {
      return { error: 'Musis zadat duvod zruseni' };
    }
  }

  const current = await db.execute({
    sql: 'SELECT id, status, client_id, price FROM bookings_v2 WHERE id = ?',
    args: [bookingId],
  });
  if (current.rows.length === 0) {
    return { error: 'Rezervace nenalezena' };
  }

  const booking = current.rows[0];
  const oldStatus = String(booking.status);

  // Admin can change status from ANY state
  if (!isAdmin) {
    const allowedTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'declined', 'cancelled_client'],
      confirmed: ['completed', 'in_progress', 'no_show', 'cancelled_client', 'cancelled_girl', 'rescheduled'],
      in_progress: ['completed', 'no_show'],
    };

    const allowed = allowedTransitions[oldStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return { error: `Nelze zmenit stav z "${oldStatus}" na "${newStatus}"` };
    }
  }

  const setClauses = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const args: (string | number | null)[] = [newStatus];

  if (['cancelled_client', 'cancelled_girl', 'declined'].includes(newStatus)) {
    setClauses.push('cancel_reason = ?', 'cancelled_at = CURRENT_TIMESTAMP');
    args.push(cancelReason ?? null);
  }

  if (newStatus === 'completed') {
    setClauses.push('completed_at = CURRENT_TIMESTAMP');
  }

  args.push(bookingId);

  await db.execute({
    sql: `UPDATE bookings_v2 SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  if (newStatus === 'no_show') {
    await db.execute({
      sql: 'UPDATE booking_clients SET no_show_count = no_show_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [Number(booking.client_id)],
    });
  }

  if (newStatus === 'completed' && booking.price) {
    await db.execute({
      sql: 'UPDATE booking_clients SET total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [Number(booking.price), Number(booking.client_id)],
    });
  }

  await db.execute({
    sql: `INSERT INTO booking_audit_log (booking_id, user_id, action, actor_type, details, severity, created_at)
          VALUES (?, ?, 'status_change', 'user', ?, 'info', CURRENT_TIMESTAMP)`,
    args: [bookingId, user.id, `${oldStatus} -> ${newStatus}${cancelReason ? ': ' + cancelReason : ''}`],
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Week schedules for ALL active girls (for quick booking panel)
// ---------------------------------------------------------------------------

export interface DaySchedule {
  date: string;       // "2026-09-14"
  dayOfWeek: number;
  dayName: string;    // "NEDELE"
  dateLabel: string;  // "14.9 NEDELE"
  shiftStart: string | null;
  shiftEnd: string | null;
  locationName: string | null;
}

export interface GirlSummary {
  id: number;
  name: string;
  photoUrl: string | null;
  allowedDurations: number[] | null; // null = all durations, e.g. [60] = only 60min
}

const CZECH_DAYS = ['NEDELE', 'PONDELI', 'UTERY', 'STREDA', 'CTVRTEK', 'PATEK', 'SOBOTA'];

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T12:00:00');
  return `${d.getDate()}.${d.getMonth() + 1} ${CZECH_DAYS[d.getDay()]}`;
}

export async function getWeekSchedulesForAll(): Promise<{
  girls: GirlSummary[];
  schedules: Record<number, DaySchedule[]>;
}> {
  await requireBooking();

  // Build day range: from today to Sunday of the current week (Prague timezone)
  // After midnight Sunday → shows next Mon-Sun
  const now = new Date();
  const pragueDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const jsToday = pragueDate.getDay(); // 0=Sun..6=Sat
  // Days remaining until Sunday (inclusive): Sun=0, Mon=6, Tue=5, ..., Sat=1
  const daysUntilSunday = jsToday === 0 ? 0 : 7 - jsToday;
  // Include today + remaining days until Sunday
  const totalDays = daysUntilSunday + 1;
  const days: { date: string; dayOfWeek: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(pragueDate);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const jsDay = d.getDay();
    days.push({ date: dateStr, dayOfWeek: jsDay === 0 ? 6 : jsDay - 1 });
  }

  // Get all active girls
  const girlsRes = await db.execute({
    sql: `
      SELECT g.id, g.name, g.booking_allowed_durations,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo_url
      FROM girls g WHERE g.status = 'active' ORDER BY g.name
    `,
    args: [],
  });

  const girls: GirlSummary[] = girlsRes.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    photoUrl: r.photo_url ? String(r.photo_url) : null,
    allowedDurations: r.booking_allowed_durations
      ? JSON.parse(String(r.booking_allowed_durations)) as number[]
      : null,
  }));

  const girlIds = girls.map((g) => g.id);
  if (girlIds.length === 0) return { girls, schedules: {} };

  // Get all schedules for these girls for all 7 day_of_week values
  const schedulesRes = await db.execute({
    sql: `
      SELECT gs.girl_id, gs.day_of_week, gs.start_time, gs.end_time, l.display_name AS location_name
      FROM girl_schedules gs
      LEFT JOIN locations l ON l.id = gs.location_id
      WHERE gs.girl_id IN (${girlIds.map(() => '?').join(',')})
        AND gs.is_active = 1
      ORDER BY gs.girl_id, gs.day_of_week, gs.effective_from DESC NULLS LAST
    `,
    args: [...girlIds],
  });

  // Build lookup: girlId -> dayOfWeek -> first match (most recent effective_from)
  const shiftLookup = new Map<string, { start: string; end: string; location: string | null }>();
  for (const r of schedulesRes.rows) {
    const key = `${r.girl_id}_${r.day_of_week}`;
    if (!shiftLookup.has(key)) {
      shiftLookup.set(key, {
        start: String(r.start_time).substring(0, 5),
        end: String(r.end_time).substring(0, 5),
        location: r.location_name ? String(r.location_name) : null,
      });
    }
  }

  // Get exceptions for the 7-day range
  const dateStrs = days.map((d) => d.date);
  const exceptionsRes = await db.execute({
    sql: `
      SELECT girl_id, date, exception_type, start_time, end_time
      FROM schedule_exceptions
      WHERE girl_id IN (${girlIds.map(() => '?').join(',')})
        AND date IN (${dateStrs.map(() => '?').join(',')})
    `,
    args: [...girlIds, ...dateStrs],
  });

  const exceptionLookup = new Map<string, { type: string; start: string | null; end: string | null }>();
  for (const r of exceptionsRes.rows) {
    const key = `${r.girl_id}_${r.date}`;
    exceptionLookup.set(key, {
      type: String(r.exception_type),
      start: r.start_time ? String(r.start_time).substring(0, 5) : null,
      end: r.end_time ? String(r.end_time).substring(0, 5) : null,
    });
  }

  // Build per-girl schedules
  const schedules: Record<number, DaySchedule[]> = {};
  for (const girl of girls) {
    schedules[girl.id] = days.map((day) => {
      const shift = shiftLookup.get(`${girl.id}_${day.dayOfWeek}`);
      const exception = exceptionLookup.get(`${girl.id}_${day.date}`);

      let shiftStart = shift?.start ?? null;
      let shiftEnd = shift?.end ?? null;
      let locationName = shift?.location ?? null;

      if (exception?.type === 'unavailable') {
        shiftStart = null;
        shiftEnd = null;
      } else if (exception?.type === 'custom_hours') {
        shiftStart = exception.start ?? shiftStart;
        shiftEnd = exception.end ?? shiftEnd;
      }

      return {
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        dayName: CZECH_DAYS[day.dayOfWeek],
        dateLabel: formatDateLabel(day.date),
        shiftStart,
        shiftEnd,
        locationName,
      };
    });
  }

  return { girls, schedules };
}
