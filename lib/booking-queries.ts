/**
 * STUDIOFLOW — Booking calendar queries
 * Reads from bookings_v2, booking_drafts, girls, girl_schedules, etc.
 */

import { db } from './db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarGirl {
  id: number;
  name: string;
  photoUrl: string | null;
  shiftStart: string | null; // HH:MM
  shiftEnd: string | null;   // HH:MM
  locationName: string | null;
  isWorking: boolean;
}

export interface CalendarBooking {
  id: number;
  clientId: number | null;
  clientNickname: string;
  clientTrustLevel: string;
  girlId: number;
  girlName: string;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:MM
  endTime: string;      // HH:MM
  durationMinutes: number;
  status: string;
  channel: string;      // phone | telegram | whatsapp | admin
  pointsEarned: number;
  price: number | null;
  locationName: string | null;
  notes: string | null;
  isDraft: boolean;
  bookingType: string; // 'booking' | 'break'
}

export interface WeekGirlSchedule {
  girlId: number;
  /** day_of_week (0=Sun, 1=Mon, ..., 6=Sat) -> shift info */
  shifts: Map<number, { start: string; end: string; location: string | null }>;
}

// ---------------------------------------------------------------------------
// Day view: girls working on a given date + their bookings
// ---------------------------------------------------------------------------

export async function getCalendarGirls(date: string): Promise<CalendarGirl[]> {
  const d = new Date(date + 'T12:00:00');
  const jsDay = d.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to DB convention (Mon=0..Sun=6)

  const result = await db.execute({
    sql: `
      SELECT
        g.id,
        g.name,
        (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo_url,
        gs.start_time AS shift_start,
        gs.end_time AS shift_end,
        l.display_name AS location_name,
        se.exception_type AS exception_type,
        se.start_time AS ex_start,
        se.end_time AS ex_end
      FROM girls g
      LEFT JOIN (
        SELECT girl_id, start_time, end_time, location_id, is_active,
               ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
        FROM girl_schedules
        WHERE day_of_week = ? AND is_active = 1
          AND (effective_from IS NULL OR effective_from <= ?)
      ) gs ON gs.girl_id = g.id AND gs.rn = 1
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
      WHERE g.status IN ('active', 'inactive')
      ORDER BY
        CASE WHEN gs.start_time IS NOT NULL AND (se.exception_type IS NULL OR se.exception_type != 'unavailable') THEN 0 ELSE 1 END,
        g.name
    `,
    args: [dayOfWeek, date, date],
  });

  const girls = result.rows.map((r) => {
    const exType = r.exception_type ? String(r.exception_type) : null;
    let shiftStart = r.shift_start ? String(r.shift_start).substring(0, 5) : null;
    let shiftEnd = r.shift_end ? String(r.shift_end).substring(0, 5) : null;

    if (exType === 'unavailable') {
      shiftStart = null;
      shiftEnd = null;
    } else if (exType === 'custom_hours') {
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
    };
  });

  // Fallback: if no girls found, use demo data (only in dev, never for API consumers)
  if (girls.length === 0 && process.env.NODE_ENV !== 'production') {
    return getDemoGirls();
  }

  return girls;
}

// ---------------------------------------------------------------------------
// Bookings for a date range
// ---------------------------------------------------------------------------

export async function getCalendarBookings(
  dateFrom: string,
  dateTo: string,
): Promise<CalendarBooking[]> {
  // Real bookings from bookings_v2
  const bookingsResult = await db.execute({
    sql: `
      SELECT
        b.id, b.client_id, b.girl_id, b.date, b.start_time, b.end_time,
        b.duration_minutes, b.status, b.channel, b.points_earned,
        b.price, b.notes, b.source,
        COALESCE(b.booking_type, 'booking') AS booking_type,
        bc.nickname AS client_nickname,
        bc.trust_level AS client_trust,
        g.name AS girl_name,
        l.display_name AS location_name
      FROM bookings_v2 b
      LEFT JOIN booking_clients bc ON bc.id = b.client_id
      LEFT JOIN girls g ON g.id = b.girl_id
      LEFT JOIN locations l ON l.id = b.location_id
      WHERE b.date >= ? AND b.date <= ?
        AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')
      ORDER BY b.date, b.start_time
    `,
    args: [dateFrom, dateTo],
  });

  const bookings: CalendarBooking[] = bookingsResult.rows.map((r) => ({
    id: Number(r.id),
    clientId: r.client_id != null ? Number(r.client_id) : null,
    clientNickname: String(r.source) === 'gcal_import' && r.notes
      ? String(r.notes)
      : r.client_nickname ? String(r.client_nickname) : 'Neznámý',
    clientTrustLevel: r.client_trust ? String(r.client_trust) : 'new',
    girlId: Number(r.girl_id),
    girlName: r.girl_name ? String(r.girl_name) : '?',
    date: String(r.date),
    startTime: String(r.start_time).substring(0, 5),
    endTime: String(r.end_time).substring(0, 5),
    durationMinutes: Number(r.duration_minutes),
    status: String(r.status),
    channel: String(r.channel),
    pointsEarned: Number(r.points_earned),
    price: r.price != null ? Number(r.price) : null,
    locationName: r.location_name ? String(r.location_name) : null,
    notes: r.notes ? String(r.notes) : null,
    isDraft: false,
    bookingType: String(r.booking_type ?? 'booking'),
  }));

  // Active drafts from booking_drafts (show as yellow dashed blocks)
  const draftsResult = await db.execute({
    sql: `
      SELECT
        bd.id, bd.girl_id, bd.date, bd.start_time, bd.end_time,
        bd.duration_minutes, bd.channel, bd.telegram_chat_id,
        g.name AS girl_name
      FROM booking_drafts bd
      LEFT JOIN girls g ON g.id = bd.girl_id
      WHERE bd.date >= ? AND bd.date <= ?
        AND bd.is_converted = 0
        AND bd.expires_at > datetime('now')
        AND bd.girl_id IS NOT NULL
        AND bd.date IS NOT NULL
        AND bd.start_time IS NOT NULL
      ORDER BY bd.date, bd.start_time
    `,
    args: [dateFrom, dateTo],
  });

  for (const r of draftsResult.rows) {
    bookings.push({
      id: Number(r.id),
      clientId: null,
      clientNickname: 'TG Draft',
      clientTrustLevel: 'new',
      girlId: Number(r.girl_id),
      girlName: r.girl_name ? String(r.girl_name) : '?',
      date: String(r.date),
      startTime: String(r.start_time).substring(0, 5),
      endTime: r.end_time ? String(r.end_time).substring(0, 5) : '',
      durationMinutes: r.duration_minutes ? Number(r.duration_minutes) : 0,
      status: 'draft',
      channel: String(r.channel),
      pointsEarned: 0,
      price: null,
      locationName: null,
      notes: null,
      isDraft: true,
      bookingType: 'booking',
    });
  }

  // Fallback: if DB is empty, use demo data for visual development
  if (bookings.length === 0 && draftsResult.rows.length === 0) {
    return getDemoBookings(dateFrom, dateTo);
  }

  return bookings;
}

// ---------------------------------------------------------------------------
// Week view: girls with their week schedules
// ---------------------------------------------------------------------------

export async function getWeekSchedules(
  weekStart: string, // YYYY-MM-DD (Monday)
): Promise<Map<number, WeekGirlSchedule>> {
  const result = await db.execute({
    sql: `
      SELECT
        gs.girl_id, gs.day_of_week, gs.start_time, gs.end_time,
        l.display_name AS location_name
      FROM girl_schedules gs
      LEFT JOIN locations l ON l.id = gs.location_id
      WHERE gs.is_active = 1
        AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
      ORDER BY gs.girl_id, gs.day_of_week
    `,
    args: [weekStart],
  });

  const schedules = new Map<number, WeekGirlSchedule>();

  for (const r of result.rows) {
    const girlId = Number(r.girl_id);
    if (!schedules.has(girlId)) {
      schedules.set(girlId, { girlId, shifts: new Map() });
    }
    const entry = schedules.get(girlId)!;
    const dow = Number(r.day_of_week);
    // Only keep the latest effective_from per day (first row due to ordering)
    if (!entry.shifts.has(dow)) {
      entry.shifts.set(dow, {
        start: String(r.start_time).substring(0, 5),
        end: String(r.end_time).substring(0, 5),
        location: r.location_name ? String(r.location_name) : null,
      });
    }
  }

  return schedules;
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

export interface DayStats {
  totalBookings: number;
  confirmed: number;
  pending: number;
  workingGirls: number;
}

export function computeDayStats(
  bookings: CalendarBooking[],
  girls: CalendarGirl[],
): DayStats {
  const nonDraft = bookings.filter((b) => !b.isDraft);
  return {
    totalBookings: nonDraft.length,
    confirmed: nonDraft.filter((b) => b.status === 'confirmed' || b.status === 'completed' || b.status === 'in_progress').length,
    pending: nonDraft.filter((b) => b.status === 'pending').length,
    workingGirls: girls.filter((g) => g.isWorking).length,
  };
}

// ---------------------------------------------------------------------------
// Demo data fallback (from mockup 02 — 57 bookings across 9 girls)
// ---------------------------------------------------------------------------

const DEMO_GIRLS: CalendarGirl[] = [
  { id: 41, name: 'Aneta', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/41/1781886676034-237b1200-7c66-4c09-a881-2a429b15bfec.webp', shiftStart: '10:00', shiftEnd: '20:00', locationName: 'Vinohrady', isWorking: true },
  { id: 31, name: 'Caty', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/31/1766987005779.jpg', shiftStart: '10:00', shiftEnd: '20:00', locationName: 'Karlin', isWorking: true },
  { id: 44, name: 'Eliska', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/44/1779557426027.png', shiftStart: '12:00', shiftEnd: '21:00', locationName: 'Vinohrady', isWorking: true },
  { id: 28, name: 'Emily', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/28/1766928171377.jpg', shiftStart: '10:00', shiftEnd: '21:00', locationName: 'Vinohrady', isWorking: true },
  { id: 46, name: 'Kim', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/46/1779618571371.jpg', shiftStart: '12:00', shiftEnd: '18:00', locationName: 'Smichov', isWorking: true },
  { id: 22, name: 'Luna', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/22/1766737202940.jpeg', shiftStart: '12:00', shiftEnd: '20:00', locationName: 'Vinohrady', isWorking: true },
  { id: 26, name: 'Natalie', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/26/1766927460248.jpg', shiftStart: '11:00', shiftEnd: '20:00', locationName: 'Zizkov', isWorking: true },
  { id: 25, name: 'Nika', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/25/1781852134764-27ecbb5e-4b5d-4166-be0d-af06b0ac2cd8.jpg', shiftStart: '10:00', shiftEnd: '20:00', locationName: 'Smichov', isWorking: true },
  { id: 56, name: 'Nina', photoUrl: 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/56/1787423439144-91fb48af-d84b-480a-b55f-624f3c047b39.webp', shiftStart: '12:00', shiftEnd: '21:00', locationName: 'Karlin', isWorking: true },
];

export function getDemoGirls(): CalendarGirl[] {
  return DEMO_GIRLS;
}

interface DemoSlot {
  girlId: number;
  /** day offset from Monday: 0=Po, 1=Ut, ..., 6=Ne */
  dayOffset: number;
  startTime: string;
  duration: number;
  client: string;
  trust: string;
  channel: string;
  status: string;
}

// 57 bookings from mockup (condensed)
const DEMO_SLOTS: DemoSlot[] = [
  // Aneta (5)
  { girlId: 41, dayOffset: 0, startTime: '14:00', duration: 60, client: 'Kl02310', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 41, dayOffset: 2, startTime: '13:00', duration: 45, client: 'Pavel0807', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 41, dayOffset: 3, startTime: '12:00', duration: 60, client: 'Klient04093', trust: 'vip', channel: 'phone', status: 'confirmed' },
  { girlId: 41, dayOffset: 3, startTime: '17:00', duration: 60, client: 'Tom2205', trust: 'regular', channel: 'telegram', status: 'confirmed' },
  { girlId: 41, dayOffset: 5, startTime: '14:00', duration: 30, client: 'NOVY1309', trust: 'new', channel: 'phone', status: 'pending' },
  // Caty (6)
  { girlId: 31, dayOffset: 0, startTime: '13:00', duration: 60, client: 'Randy24', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 31, dayOffset: 1, startTime: '11:00', duration: 60, client: 'Sepp25', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 31, dayOffset: 1, startTime: '17:00', duration: 30, client: 'Kl02310', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 31, dayOffset: 2, startTime: '15:00', duration: 45, client: 'Vojta0506', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 31, dayOffset: 4, startTime: '12:00', duration: 60, client: 'Martin05', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 31, dayOffset: 5, startTime: '13:00', duration: 60, client: 'Miloslav2208', trust: 'vip', channel: 'phone', status: 'confirmed' },
  // Eliska (6)
  { girlId: 44, dayOffset: 1, startTime: '16:00', duration: 60, client: 'Fritz0411', trust: 'regular', channel: 'whatsapp', status: 'confirmed' },
  { girlId: 44, dayOffset: 2, startTime: '15:00', duration: 30, client: 'Novy0910', trust: 'new', channel: 'phone', status: 'pending' },
  { girlId: 44, dayOffset: 3, startTime: '14:30', duration: 60, client: 'Klient08116', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 44, dayOffset: 3, startTime: '19:00', duration: 45, client: 'JozefN1211', trust: 'vip', channel: 'telegram', status: 'confirmed' },
  { girlId: 44, dayOffset: 4, startTime: '16:00', duration: 60, client: 'Daniel291', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 44, dayOffset: 6, startTime: '15:00', duration: 45, client: 'M.k0903', trust: 'regular', channel: 'phone', status: 'confirmed' },
  // Emily (14)
  { girlId: 28, dayOffset: 0, startTime: '11:00', duration: 60, client: 'Klient04093', trust: 'vip', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 0, startTime: '16:00', duration: 30, client: 'HynekSvoboda', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 1, startTime: '10:30', duration: 60, client: 'Cizinec711', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 1, startTime: '14:00', duration: 60, client: 'JozefN1211', trust: 'vip', channel: 'telegram', status: 'confirmed' },
  { girlId: 28, dayOffset: 1, startTime: '19:00', duration: 45, client: 'LiborN2807', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 2, startTime: '13:00', duration: 60, client: 'Cizinec140301', trust: 'regular', channel: 'whatsapp', status: 'confirmed' },
  { girlId: 28, dayOffset: 3, startTime: '11:00', duration: 60, client: 'Klient04093', trust: 'vip', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 3, startTime: '17:00', duration: 45, client: 'NO1018', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 4, startTime: '14:00', duration: 60, client: 'Daniel291', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 5, startTime: '12:00', duration: 60, client: 'Klient04093', trust: 'vip', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 5, startTime: '16:00', duration: 60, client: 'JozefN1211', trust: 'vip', channel: 'telegram', status: 'confirmed' },
  { girlId: 28, dayOffset: 5, startTime: '19:30', duration: 30, client: 'NOVY1309', trust: 'new', channel: 'phone', status: 'pending' },
  { girlId: 28, dayOffset: 6, startTime: '12:00', duration: 45, client: 'Danek0110', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 28, dayOffset: 6, startTime: '18:00', duration: 30, client: 'M.k0903', trust: 'regular', channel: 'phone', status: 'confirmed' },
  // Kim (1)
  { girlId: 46, dayOffset: 2, startTime: '14:00', duration: 60, client: 'Nov0412', trust: 'regular', channel: 'phone', status: 'confirmed' },
  // Luna (6)
  { girlId: 22, dayOffset: 1, startTime: '15:00', duration: 60, client: 'N0330', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 22, dayOffset: 2, startTime: '16:00', duration: 45, client: 'Klient01066', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 22, dayOffset: 3, startTime: '14:30', duration: 60, client: 'Novy23052', trust: 'new', channel: 'phone', status: 'pending' },
  { girlId: 22, dayOffset: 5, startTime: '15:00', duration: 30, client: 'Kl1111', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 22, dayOffset: 5, startTime: '18:00', duration: 60, client: 'N0330', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 22, dayOffset: 6, startTime: '14:00', duration: 60, client: 'N1807', trust: 'regular', channel: 'phone', status: 'confirmed' },
  // Natalie (6)
  { girlId: 26, dayOffset: 0, startTime: '15:00', duration: 30, client: 'Lukas1102', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 26, dayOffset: 1, startTime: '13:00', duration: 60, client: 'Stefan0706', trust: 'regular', channel: 'whatsapp', status: 'confirmed' },
  { girlId: 26, dayOffset: 3, startTime: '14:00', duration: 45, client: 'Ondra2903', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 26, dayOffset: 4, startTime: '13:00', duration: 60, client: 'Klient04093', trust: 'vip', channel: 'phone', status: 'confirmed' },
  { girlId: 26, dayOffset: 4, startTime: '18:00', duration: 30, client: 'Tom2205', trust: 'regular', channel: 'telegram', status: 'confirmed' },
  { girlId: 26, dayOffset: 5, startTime: '14:00', duration: 60, client: 'HynekSvoboda', trust: 'regular', channel: 'phone', status: 'confirmed' },
  // Nika (7)
  { girlId: 25, dayOffset: 0, startTime: '12:00', duration: 60, client: 'Nov0412', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 25, dayOffset: 1, startTime: '15:00', duration: 45, client: 'Klient08116', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 25, dayOffset: 3, startTime: '11:00', duration: 60, client: 'L1307', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 25, dayOffset: 3, startTime: '16:00', duration: 60, client: 'Vladimir1806', trust: 'vip', channel: 'whatsapp', status: 'confirmed' },
  { girlId: 25, dayOffset: 4, startTime: '14:00', duration: 60, client: 'Stefano1006', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 25, dayOffset: 5, startTime: '10:30', duration: 30, client: 'Martin2004', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 25, dayOffset: 5, startTime: '14:00', duration: 60, client: 'Vladimir1806', trust: 'vip', channel: 'whatsapp', status: 'confirmed' },
  // Nina (6)
  { girlId: 56, dayOffset: 1, startTime: '15:00', duration: 60, client: 'Petr0503', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 56, dayOffset: 2, startTime: '16:00', duration: 45, client: 'Jakub1204', trust: 'regular', channel: 'phone', status: 'confirmed' },
  { girlId: 56, dayOffset: 4, startTime: '17:00', duration: 60, client: 'Hans0812', trust: 'regular', channel: 'whatsapp', status: 'confirmed' },
  { girlId: 56, dayOffset: 5, startTime: '15:00', duration: 60, client: 'Klient04093', trust: 'vip', channel: 'phone', status: 'confirmed' },
  { girlId: 56, dayOffset: 5, startTime: '19:00', duration: 30, client: 'Lukas1102', trust: 'regular', channel: 'telegram', status: 'confirmed' },
  { girlId: 56, dayOffset: 6, startTime: '16:00', duration: 30, client: 'Ondra2903', trust: 'regular', channel: 'phone', status: 'confirmed' },
];

// Price map by duration
const DEMO_PRICES: Record<number, number> = { 30: 3000, 45: 3500, 60: 4500, 90: 6500, 120: 8000 };
const DEMO_POINTS: Record<number, number> = { 30: 800, 45: 900, 60: 1000, 90: 1000, 120: 1000 };

function getWeekMondayDate(refDate: string): Date {
  const d = new Date(refDate + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function getDemoBookings(dateFrom: string, dateTo: string): CalendarBooking[] {
  const monday = getWeekMondayDate(dateFrom);
  const girlNames = new Map(DEMO_GIRLS.map((g) => [g.id, g.name]));

  const from = new Date(dateFrom + 'T00:00:00');
  const to = new Date(dateTo + 'T23:59:59');

  return DEMO_SLOTS
    .map((slot, idx) => {
      const bookDate = new Date(monday);
      bookDate.setDate(monday.getDate() + slot.dayOffset);
      const dateStr = toISO(bookDate);
      const endTime = addMinutes(slot.startTime, slot.duration);

      return {
        id: 200 + idx,
        clientId: null,
        clientNickname: slot.client,
        clientTrustLevel: slot.trust,
        girlId: slot.girlId,
        girlName: girlNames.get(slot.girlId) ?? '?',
        date: dateStr,
        startTime: slot.startTime,
        endTime,
        durationMinutes: slot.duration,
        status: slot.status,
        channel: slot.channel,
        pointsEarned: DEMO_POINTS[slot.duration] ?? 1000,
        price: DEMO_PRICES[slot.duration] ?? null,
        locationName: DEMO_GIRLS.find((g) => g.id === slot.girlId)?.locationName ?? null,
        notes: null,
        isDraft: false,
        bookingType: 'booking',
      };
    })
    .filter((b) => {
      const bd = new Date(b.date + 'T12:00:00');
      return bd >= from && bd <= to;
    });
}
