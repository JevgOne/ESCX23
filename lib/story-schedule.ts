/**
 * Story visibility based on girl's work schedule.
 *
 * Rules:
 * 1. Story is visible ONLY during the girl's active shifts
 * 2. The 24h "budget" only ticks during working hours
 * 3. After 24h of accumulated shift-time, the story expires
 * 4. Admin stories (girl_id=0) use classic expires_at logic
 */

import { db } from './db';
import { pragueDayOfWeek, pragueDateISO, formatPragueTime, isWithinShift, displayTime } from './utils';

interface ShiftEntry {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

interface ExceptionEntry {
  date: string;       // "YYYY-MM-DD"
  type: string;       // "unavailable" | "custom_hours"
  startTime: string | null;
  endTime: string | null;
}

/**
 * Get weekly schedule + exceptions for a set of girl IDs.
 */
async function fetchScheduleData(girlIds: number[]): Promise<{
  schedules: Map<number, ShiftEntry[]>;
  exceptions: Map<number, ExceptionEntry[]>;
}> {
  if (girlIds.length === 0) {
    return { schedules: new Map(), exceptions: new Map() };
  }

  const placeholders = girlIds.map(() => '?').join(',');

  const [schedRes, excRes] = await Promise.all([
    db.execute({
      sql: `SELECT girl_id, day_of_week, start_time, end_time
            FROM girl_schedules
            WHERE girl_id IN (${placeholders}) AND is_active = 1
              AND (effective_from IS NULL OR effective_from <= date('now'))
            ORDER BY girl_id, day_of_week`,
      args: girlIds,
    }),
    db.execute({
      sql: `SELECT girl_id, date, exception_type, start_time, end_time
            FROM schedule_exceptions
            WHERE girl_id IN (${placeholders})
            ORDER BY girl_id, date`,
      args: girlIds,
    }),
  ]);

  const schedules = new Map<number, ShiftEntry[]>();
  for (const r of schedRes.rows) {
    const gid = Number(r.girl_id);
    if (!schedules.has(gid)) schedules.set(gid, []);
    schedules.get(gid)!.push({
      dayOfWeek: Number(r.day_of_week),
      startTime: String(r.start_time).substring(0, 5),
      endTime: String(r.end_time).substring(0, 5),
    });
  }

  const exceptions = new Map<number, ExceptionEntry[]>();
  for (const r of excRes.rows) {
    const gid = Number(r.girl_id);
    if (!exceptions.has(gid)) exceptions.set(gid, []);
    exceptions.get(gid)!.push({
      date: String(r.date),
      type: String(r.exception_type),
      startTime: r.start_time ? String(r.start_time).substring(0, 5) : null,
      endTime: r.end_time ? String(r.end_time).substring(0, 5) : null,
    });
  }

  return { schedules, exceptions };
}

/**
 * Convert a Date to Prague timezone components.
 */
function pragueComponents(date: Date): { dateISO: string; time: string; dow: number } {
  return {
    dateISO: pragueDateISO(date),
    time: formatPragueTime(date),
    dow: pragueDayOfWeek(date),
  };
}

/**
 * Get the shift for a specific date for a girl, considering exceptions.
 * Returns null if the girl is not working that day.
 */
function getShiftForDate(
  dateISO: string,
  dow: number,
  schedule: ShiftEntry[],
  exceptionsList: ExceptionEntry[],
): { start: string; end: string } | null {
  // Check exceptions first
  const exc = exceptionsList.find(e => e.date === dateISO);
  if (exc) {
    if (exc.type === 'unavailable') return null;
    if (exc.type === 'custom_hours' && exc.startTime && exc.endTime) {
      return { start: exc.startTime, end: exc.endTime };
    }
  }

  // Fall back to weekly schedule
  const entry = schedule.find(s => s.dayOfWeek === dow);
  if (!entry) return null;
  return { start: entry.startTime, end: entry.endTime };
}

/**
 * Calculate accumulated shift-hours since story creation.
 * Only counts time during the girl's active shifts.
 */
function calculateAccumulatedShiftMinutes(
  createdAt: Date,
  now: Date,
  schedule: ShiftEntry[],
  exceptionsList: ExceptionEntry[],
): number {
  let totalMinutes = 0;

  // Iterate day by day from createdAt to now (in Prague timezone)
  const cursor = new Date(createdAt);
  // Set to start of day in UTC (we'll use Prague components for logic)
  const startDateISO = pragueDateISO(createdAt);
  const endDateISO = pragueDateISO(now);

  // Build a date cursor starting from createdAt's date
  const [startYear, startMonth, startDay] = startDateISO.split('-').map(Number);
  const dayDate = new Date(startYear, startMonth - 1, startDay);

  const [endYear, endMonth, endDay] = endDateISO.split('-').map(Number);
  const lastDate = new Date(endYear, endMonth - 1, endDay);

  while (dayDate <= lastDate) {
    const dateISO = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
    const jsDay = dayDate.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0..Sun=6

    const shift = getShiftForDate(dateISO, dow, schedule, exceptionsList);

    if (shift) {
      // Parse shift times as minutes from midnight
      const shiftStartMin = parseTimeToMinutes(shift.start);
      const shiftEndMin = parseTimeToMinutes(shift.end);

      // Determine effective window (clamp to [createdAt, now])
      let effectiveStart = shiftStartMin;
      let effectiveEnd = shiftEndMin;

      // If this is the creation day, clamp start to createdAt time
      if (dateISO === startDateISO) {
        const createdTimeMin = parseTimeToMinutes(formatPragueTime(createdAt));
        effectiveStart = Math.max(effectiveStart, createdTimeMin);
      }

      // If this is today, clamp end to now
      if (dateISO === endDateISO) {
        const nowTimeMin = parseTimeToMinutes(formatPragueTime(now));
        effectiveEnd = Math.min(effectiveEnd, nowTimeMin);
      }

      if (effectiveEnd > effectiveStart) {
        totalMinutes += (effectiveEnd - effectiveStart);
      }
    }

    // Check previous day's cross-midnight shift (morning portion on this day)
    const prevDow = dow === 0 ? 6 : dow - 1;
    const prevDate = new Date(dayDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateISO = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
    const prevShift = getShiftForDate(prevDateISO, prevDow, schedule, exceptionsList);
    if (prevShift && parseInt(prevShift.end.split(':')[0]) >= 24) {
      // Previous day's shift extends into this day
      const morningEndMin = parseTimeToMinutes(displayTime(prevShift.end));
      let effectiveStart = 0; // midnight
      let effectiveEnd = morningEndMin;

      if (dateISO === startDateISO) {
        const createdTimeMin = parseTimeToMinutes(formatPragueTime(createdAt));
        effectiveStart = Math.max(effectiveStart, createdTimeMin);
      }
      if (dateISO === endDateISO) {
        const nowTimeMin = parseTimeToMinutes(formatPragueTime(now));
        effectiveEnd = Math.min(effectiveEnd, nowTimeMin);
      }

      if (effectiveEnd > effectiveStart) {
        totalMinutes += (effectiveEnd - effectiveStart);
      }
    }

    dayDate.setDate(dayDate.getDate() + 1);
  }

  return totalMinutes;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Check if a girl is currently on shift.
 */
function isCurrentlyOnShift(
  schedule: ShiftEntry[],
  exceptionsList: ExceptionEntry[],
): boolean {
  const now = new Date();
  const { dateISO, time, dow } = pragueComponents(now);

  // Check today's shift
  const shift = getShiftForDate(dateISO, dow, schedule, exceptionsList);
  if (shift && isWithinShift(time, shift.start, shift.end)) return true;

  // Check previous day's cross-midnight shift (morning portion today)
  const prevDow = dow === 0 ? 6 : dow - 1;
  const prevDate = new Date(now);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateISO = pragueDateISO(prevDate);
  const prevShift = getShiftForDate(prevDateISO, prevDow, schedule, exceptionsList);
  if (prevShift && parseInt(prevShift.end.split(':')[0]) >= 24) {
    const morningEnd = displayTime(prevShift.end);
    if (time <= morningEnd) return true;
  }

  return false;
}

export interface PublicStoryFiltered {
  id: number;
  girlId: number;
  girlName: string;
  girlSlug: string;
  girlPhoto: string | null;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  createdAt: string;
}

const SHIFT_BUDGET_MINUTES = 24 * 60; // 24 hours in minutes

/**
 * Get public stories filtered by schedule logic.
 * - Girl stories: visible only during shifts, expire after 24h of shift-time
 * - Admin stories (girl_id=0): classic expires_at logic
 */
export async function getPublicStoriesFiltered(): Promise<PublicStoryFiltered[]> {
  // Fetch all active stories (admin stories use expires_at, girl stories we filter by schedule)
  const res = await db.execute(`
    SELECT
      s.id, s.girl_id, s.media_url, s.media_type, s.created_at,
      COALESCE(g.name, 'LovelyGirls') AS girl_name,
      COALESCE(g.slug, '') AS girl_slug,
      (SELECT url FROM girl_photos WHERE girl_id=g.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS girl_photo
    FROM stories s
    LEFT JOIN girls g ON g.id = s.girl_id AND g.status = 'active'
    WHERE s.is_active = 1
      AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
      AND (s.girl_id = 0 OR g.id IS NOT NULL)
    ORDER BY s.created_at DESC
    LIMIT 50
  `);

  const stories = res.rows.map((r) => ({
    id: Number(r.id),
    girlId: Number(r.girl_id),
    girlName: String(r.girl_name ?? 'LovelyGirls'),
    girlSlug: String(r.girl_slug ?? ''),
    girlPhoto: r.girl_photo ? String(r.girl_photo) : null,
    mediaUrl: String(r.media_url),
    mediaType: (String(r.media_type) === 'video' ? 'video' : 'image') as 'image' | 'video',
    caption: null,
    createdAt: String(r.created_at),
  }));

  if (stories.length === 0) return [];

  // Separate admin stories and girl stories
  const adminStories = stories.filter(s => s.girlId === 0);
  const girlStories = stories.filter(s => s.girlId > 0);

  if (girlStories.length === 0) return adminStories;

  // Fetch schedule data for all relevant girls
  const girlIds = [...new Set(girlStories.map(s => s.girlId))];
  const { schedules, exceptions } = await fetchScheduleData(girlIds);

  const now = new Date();

  const filteredGirlStories = girlStories.filter(story => {
    const schedule = schedules.get(story.girlId) ?? [];
    const excList = exceptions.get(story.girlId) ?? [];

    // 1. Is the girl currently on shift?
    if (!isCurrentlyOnShift(schedule, excList)) return false;

    // 2. Has the 24h shift-time budget been exhausted?
    const createdAt = new Date(story.createdAt);
    const accumulatedMinutes = calculateAccumulatedShiftMinutes(createdAt, now, schedule, excList);
    if (accumulatedMinutes >= SHIFT_BUDGET_MINUTES) return false;

    return true;
  });

  return [...filteredGirlStories, ...adminStories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Check if a specific story is currently viewable.
 * Used by the story viewer page. More lenient — allows viewing
 * if the story hasn't exhausted its 24h budget, even if girl isn't on shift right now.
 */
export async function isStoryViewable(storyId: number, girlId: number, createdAt: string): Promise<boolean> {
  if (girlId === 0) return true; // Admin stories always viewable

  const { schedules, exceptions } = await fetchScheduleData([girlId]);
  const schedule = schedules.get(girlId) ?? [];
  const excList = exceptions.get(girlId) ?? [];

  const now = new Date();
  const created = new Date(createdAt);
  const accumulatedMinutes = calculateAccumulatedShiftMinutes(created, now, schedule, excList);

  return accumulatedMinutes < SHIFT_BUDGET_MINUTES;
}
