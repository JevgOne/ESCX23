/**
 * STUDIOFLOW — Studio queries (girl's view)
 * Girl sees only her own bookings, schedule, and client nicknames.
 * No prices, no phone numbers, no other girls' data.
 */

import { db } from './db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudioBooking {
  id: number;
  clientNickname: string;
  clientTrustLevel: string;
  clientVisits: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  girlNotes: string | null;
}

export interface StudioShift {
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  locationName: string | null;
  bookingCount: number;
}

export interface StudioNotification {
  id: number;
  type: string;     // new_booking | cancelled | reminder | schedule_change
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Today's bookings for a girl
// ---------------------------------------------------------------------------

export async function getGirlDayBookings(
  girlId: number,
  date: string,
): Promise<StudioBooking[]> {
  const result = await db.execute({
    sql: `
      SELECT
        b.id, b.date, b.start_time, b.end_time, b.duration_minutes,
        b.status, b.girl_notes,
        bc.nickname AS client_nickname,
        bc.trust_level AS client_trust,
        bc.total_visits AS client_visits
      FROM bookings_v2 b
      LEFT JOIN booking_clients bc ON bc.id = b.client_id
      WHERE b.girl_id = ? AND b.date = ?
        AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl', 'declined')
      ORDER BY b.start_time
    `,
    args: [girlId, date],
  });

  return result.rows.map((r) => ({
    id: Number(r.id),
    clientNickname: r.client_nickname ? String(r.client_nickname) : 'Klient',
    clientTrustLevel: r.client_trust ? String(r.client_trust) : 'new',
    clientVisits: r.client_visits ? Number(r.client_visits) : 0,
    date: String(r.date),
    startTime: String(r.start_time).substring(0, 5),
    endTime: String(r.end_time).substring(0, 5),
    durationMinutes: Number(r.duration_minutes),
    status: String(r.status),
    girlNotes: r.girl_notes ? String(r.girl_notes) : null,
  }));
}

// ---------------------------------------------------------------------------
// Girl's shift for a given date
// ---------------------------------------------------------------------------

export async function getGirlShift(
  girlId: number,
  date: string,
): Promise<{ startTime: string; endTime: string; locationName: string | null } | null> {
  const d = new Date(date + 'T12:00:00');
  const dayOfWeek = d.getDay();

  const result = await db.execute({
    sql: `
      SELECT gs.start_time, gs.end_time, l.name AS location_name,
             se.type AS ex_type, se.start_time AS ex_start, se.end_time AS ex_end
      FROM girl_schedules gs
      LEFT JOIN locations l ON l.id = gs.location_id
      LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
      WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
        AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
      ORDER BY gs.effective_from DESC NULLS LAST
      LIMIT 1
    `,
    args: [date, girlId, dayOfWeek, date],
  });

  if (result.rows.length === 0) return null;

  const r = result.rows[0];
  const exType = r.ex_type ? String(r.ex_type) : null;

  if (exType === 'unavailable') return null;

  let start = r.start_time ? String(r.start_time).substring(0, 5) : null;
  let end = r.end_time ? String(r.end_time).substring(0, 5) : null;

  if (exType === 'custom_hours') {
    start = r.ex_start ? String(r.ex_start).substring(0, 5) : start;
    end = r.ex_end ? String(r.ex_end).substring(0, 5) : end;
  }

  if (!start || !end) return null;

  return {
    startTime: start,
    endTime: end,
    locationName: r.location_name ? String(r.location_name) : null,
  };
}

// ---------------------------------------------------------------------------
// Girl's weekly schedule with booking counts
// ---------------------------------------------------------------------------

export async function getGirlWeekSchedule(
  girlId: number,
  weekMonday: string,
): Promise<StudioShift[]> {
  const monday = new Date(weekMonday + 'T12:00:00');
  const shifts: StudioShift[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dow = d.getDay();

    const shiftResult = await db.execute({
      sql: `
        SELECT gs.start_time, gs.end_time, l.name AS location_name,
               se.type AS ex_type, se.start_time AS ex_start, se.end_time AS ex_end
        FROM girl_schedules gs
        LEFT JOIN locations l ON l.id = gs.location_id
        LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
        WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
          AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
        ORDER BY gs.effective_from DESC NULLS LAST
        LIMIT 1
      `,
      args: [dateStr, girlId, dow, dateStr],
    });

    if (shiftResult.rows.length > 0) {
      const r = shiftResult.rows[0];
      const exType = r.ex_type ? String(r.ex_type) : null;

      if (exType === 'unavailable') {
        shifts.push({ date: dateStr, dayOfWeek: dow, startTime: '', endTime: '', locationName: null, bookingCount: 0 });
        continue;
      }

      let start = r.start_time ? String(r.start_time).substring(0, 5) : '';
      let end = r.end_time ? String(r.end_time).substring(0, 5) : '';
      if (exType === 'custom_hours') {
        start = r.ex_start ? String(r.ex_start).substring(0, 5) : start;
        end = r.ex_end ? String(r.ex_end).substring(0, 5) : end;
      }

      // Count bookings for this day
      const countResult = await db.execute({
        sql: `SELECT COUNT(*) AS c FROM bookings_v2 WHERE girl_id = ? AND date = ? AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl', 'declined')`,
        args: [girlId, dateStr],
      });
      const count = Number(countResult.rows[0]?.c ?? 0);

      shifts.push({
        date: dateStr,
        dayOfWeek: dow,
        startTime: start,
        endTime: end,
        locationName: r.location_name ? String(r.location_name) : null,
        bookingCount: count,
      });
    } else {
      shifts.push({ date: dateStr, dayOfWeek: dow, startTime: '', endTime: '', locationName: null, bookingCount: 0 });
    }
  }

  return shifts;
}

// ---------------------------------------------------------------------------
// Girl's points for today
// ---------------------------------------------------------------------------

export async function getGirlDayPoints(
  girlId: number,
  date: string,
): Promise<number> {
  const result = await db.execute({
    sql: `
      SELECT COALESCE(SUM(points_earned), 0) AS total
      FROM bookings_v2
      WHERE girl_id = ? AND date = ?
        AND status IN ('completed', 'confirmed', 'in_progress')
    `,
    args: [girlId, date],
  });

  return Number(result.rows[0]?.total ?? 0);
}

// ---------------------------------------------------------------------------
// Girl's week totals
// ---------------------------------------------------------------------------

export async function getGirlWeekTotals(
  girlId: number,
  weekStart: string,
  weekEnd: string,
): Promise<{ bookings: number; points: number }> {
  const result = await db.execute({
    sql: `
      SELECT COUNT(*) AS cnt, COALESCE(SUM(points_earned), 0) AS pts
      FROM bookings_v2
      WHERE girl_id = ? AND date >= ? AND date <= ?
        AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl', 'declined')
    `,
    args: [girlId, weekStart, weekEnd],
  });

  return {
    bookings: Number(result.rows[0]?.cnt ?? 0),
    points: Number(result.rows[0]?.pts ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Girl's name from girl_id
// ---------------------------------------------------------------------------

export async function getGirlName(girlId: number): Promise<string> {
  const result = await db.execute({
    sql: 'SELECT name FROM girls WHERE id = ? LIMIT 1',
    args: [girlId],
  });
  return result.rows[0] ? String(result.rows[0].name) : 'Studio';
}
