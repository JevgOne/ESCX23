'use server';

import { db } from '@/lib/db';
import { pragueDateISO, toStorageTime } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { requireGirl } from '@/lib/auth';

const PRESETS: Record<string, { from: string; to: string }> = {
  morning:    { from: '10:00', to: '16:00' },
  afternoon:  { from: '16:30', to: '22:30' },
  fullday:    { from: '10:00', to: '22:00' },
  allevening: { from: '16:30', to: '31:00' },
  night:      { from: '23:00', to: '31:00' },
};

const SHIFT_TIMES: Record<string, { start: string; end: string }> = {
  morning:   { start: '10:00', end: '16:00' },
  afternoon: { start: '16:30', end: '22:30' },
  fullday:   { start: '10:00', end: '22:00' },
};

// Seniority: selection opens Sunday 00:00, deadline 22:00 Prague = 22 hours total
const SENIORITY_WINDOW_HOURS = 22;

/** Compute Monday of the week containing the given date. */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Get seniority info for a girl: her rank, total active girls,
 * whether her selection window is open, and when it opens.
 */
export async function getSeniorityStatus(girlId: number, nextMonday: string) {
  const nowPrague = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));

  // Get all active girls ordered by seniority (created_at ASC = most senior first)
  const girlsRes = await db.execute(
    `SELECT id, created_at FROM girls WHERE status = 'active' ORDER BY created_at ASC`
  );
  const activeGirls = girlsRes.rows.map(r => Number(r.id));
  const totalGirls = activeGirls.length;

  if (totalGirls === 0) {
    return { rank: 0, totalGirls: 0, isOpen: true, opensAt: null, windowMinutes: 0 };
  }

  const rank = activeGirls.indexOf(girlId) + 1; // 1-based; 0 = not found (inactive)
  if (rank === 0) {
    // Girl is not active — allow anyway (admin can still manage)
    return { rank: 0, totalGirls, isOpen: true, opensAt: null, windowMinutes: 0 };
  }

  // Window per girl in minutes
  const totalMinutes = SENIORITY_WINDOW_HOURS * 60; // 1320 min
  const windowMinutes = Math.floor(totalMinutes / totalGirls);

  // Sunday of the week before nextMonday
  const sundayDate = new Date(nextMonday);
  sundayDate.setDate(sundayDate.getDate() - 1); // Sunday
  const sundayStr = sundayDate.toISOString().slice(0, 10);

  // Sunday 00:00 Prague = start of selection
  const selectionStartPrague = new Date(`${sundayStr}T00:00:00`);

  // This girl's window starts at: selectionStart + (rank - 1) * windowMinutes
  const windowStartMs = selectionStartPrague.getTime() + (rank - 1) * windowMinutes * 60 * 1000;
  const windowStart = new Date(windowStartMs);

  // Check if any girl with lower rank (higher seniority) has already submitted
  // for this week — if so, next girl's window opens immediately
  let effectiveWindowStart = windowStart;

  if (rank > 1) {
    // Check all girls with rank < current
    for (let r = rank - 1; r >= 1; r--) {
      const seniorGirlId = activeGirls[r - 1];
      const submitted = await db.execute({
        sql: `SELECT MAX(created_at) AS last_submit FROM shift_requests
              WHERE girl_id = ? AND week_start = ?`,
        args: [seniorGirlId, nextMonday],
      });
      const lastSubmit = submitted.rows[0]?.last_submit;
      if (lastSubmit) {
        // Senior submitted — this girl's window could open earlier
        const submitTime = new Date(String(lastSubmit));
        // Window opens = max(scheduled window start, senior's submit time)
        // Actually: if senior submitted before her window end, next opens immediately after submit
        const scheduledWindowEnd = new Date(selectionStartPrague.getTime() + r * windowMinutes * 60 * 1000);
        if (submitTime < scheduledWindowEnd) {
          // Senior submitted early — next window can start at submit time
          const earlyStart = submitTime;
          if (earlyStart < effectiveWindowStart) {
            effectiveWindowStart = earlyStart;
          }
        }
        break; // Only need to check the immediately preceding rank
      }
      // Senior didn't submit — check if their window expired
      const seniorWindowEnd = new Date(selectionStartPrague.getTime() + r * windowMinutes * 60 * 1000);
      if (nowPrague >= seniorWindowEnd) {
        // Senior's window expired — this girl's window is open
        if (seniorWindowEnd < effectiveWindowStart) {
          effectiveWindowStart = seniorWindowEnd;
        }
        break;
      }
    }
  }

  const isOpen = nowPrague >= effectiveWindowStart;

  return {
    rank,
    totalGirls,
    isOpen,
    opensAt: isOpen ? null : effectiveWindowStart.toISOString(),
    windowMinutes,
  };
}

/**
 * Get shift capacity for a week at a location.
 * Returns occupancy per day per shift period (morning/afternoon).
 * fullday occupies BOTH morning and afternoon slots.
 */
export async function getShiftCapacity(weekStart: string, locationId: number | null) {
  // Get max capacity for this location
  let maxPerShift = 3; // default
  if (locationId) {
    const locRes = await db.execute({
      sql: 'SELECT max_girls_per_shift FROM locations WHERE id = ? LIMIT 1',
      args: [locationId],
    });
    if (locRes.rows[0]?.max_girls_per_shift != null) {
      maxPerShift = Number(locRes.rows[0].max_girls_per_shift);
    }
  }

  // Count existing requests per day per shift period
  const reqRes = await db.execute({
    sql: `SELECT day_of_week, shift_type, COUNT(*) AS cnt
          FROM shift_requests
          WHERE week_start = ?
            AND (location_id = ? OR (? IS NULL AND location_id IS NULL))
            AND status IN ('pending', 'approved', 'activated')
          GROUP BY day_of_week, shift_type`,
    args: [weekStart, locationId, locationId],
  });

  // Build capacity map: { dayOfWeek: { morning: { taken, max }, afternoon: { taken, max } } }
  const capacity: Record<number, { morning: { taken: number; max: number }; afternoon: { taken: number; max: number } }> = {};
  for (let d = 0; d < 7; d++) {
    capacity[d] = {
      morning: { taken: 0, max: maxPerShift },
      afternoon: { taken: 0, max: maxPerShift },
    };
  }

  for (const r of reqRes.rows) {
    const day = Number(r.day_of_week);
    const type = String(r.shift_type);
    const cnt = Number(r.cnt);
    if (type === 'morning' || type === 'fullday') {
      capacity[day].morning.taken += cnt;
    }
    if (type === 'afternoon' || type === 'fullday') {
      capacity[day].afternoon.taken += cnt;
    }
  }

  return capacity;
}

/** Check if a specific shift type has capacity on a given day. */
function hasCapacity(
  capacity: Record<number, { morning: { taken: number; max: number }; afternoon: { taken: number; max: number } }>,
  dayOfWeek: number,
  shiftType: string,
): boolean {
  const day = capacity[dayOfWeek];
  if (!day) return true;
  if (shiftType === 'morning') return day.morning.taken < day.morning.max;
  if (shiftType === 'afternoon') return day.afternoon.taken < day.afternoon.max;
  if (shiftType === 'fullday') return day.morning.taken < day.morning.max && day.afternoon.taken < day.afternoon.max;
  return true;
}

/** Submit a shift request for a specific day. */
export async function submitShiftRequest(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const shiftType = formData.get('shift_type') as string;
  const dayOfWeek = Number(formData.get('day_of_week'));
  const weekStart = formData.get('week_start') as string;
  const locationId = formData.get('location_id') ? Number(formData.get('location_id')) : null;

  if (!shiftType || !SHIFT_TIMES[shiftType]) return;
  if (dayOfWeek < 0 || dayOfWeek > 6) return;
  if (!weekStart) return;

  // Validate: date must not be in the past or today
  const today = pragueDateISO();
  const shiftDate = new Date(weekStart);
  shiftDate.setDate(shiftDate.getDate() + dayOfWeek);
  const shiftDateStr = shiftDate.toISOString().slice(0, 10);
  if (shiftDateStr <= today) return;

  // Validate: max 2 weeks ahead
  const nowPrague = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const thisMonday = getMonday(nowPrague);
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextMondayStr = nextMonday.toISOString().slice(0, 10);

  if (weekStart !== thisMonday && weekStart !== nextMondayStr) return;

  // Seniority check: only for next week's shifts (this week = always open)
  if (weekStart === nextMondayStr) {
    const seniority = await getSeniorityStatus(girlId, nextMondayStr);
    if (!seniority.isOpen) return; // Window not open yet — silently reject
  }

  // Capacity check: ensure shift is not full
  const capacity = await getShiftCapacity(weekStart, locationId);
  if (!hasCapacity(capacity, dayOfWeek, shiftType)) return; // Full — silently reject

  // Get seniority rank for audit
  const rankRes = await db.execute(
    `SELECT id FROM girls WHERE status = 'active' ORDER BY created_at ASC`
  );
  const activeIds = rankRes.rows.map(r => Number(r.id));
  const rank = activeIds.indexOf(girlId) + 1;

  const times = SHIFT_TIMES[shiftType];

  await db.execute({
    sql: `INSERT OR REPLACE INTO shift_requests (girl_id, week_start, day_of_week, shift_type, start_time, end_time, location_id, status, seniority_rank)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    args: [girlId, weekStart, dayOfWeek, shiftType, times.start, times.end, locationId, rank || null],
  });

  revalidatePath('/cs/studio/dostupnost');
  revalidatePath('/cs/admin/schedules');
}

/** Cancel a pending shift request. Cannot cancel approved shifts. */
export async function cancelShiftRequest(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const requestId = Number(formData.get('request_id'));
  if (!requestId) return;

  await db.execute({
    sql: `DELETE FROM shift_requests WHERE id = ? AND girl_id = ? AND status = 'pending'`,
    args: [requestId, girlId],
  });

  revalidatePath('/cs/studio/dostupnost');
  revalidatePath('/cs/admin/schedules');
}

export async function studioSaveWeeklySchedule(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const bulk = formData.get('bulk') as string | null;

  for (let day = 0; day < 7; day++) {
    let active = formData.get(`day_${day}_active`) === 'on';
    let preset = (formData.get(`day_${day}_preset`) as string) ?? 'fullday';
    let customFrom = (formData.get(`day_${day}_from`) as string) ?? '10:00';
    let customTo   = (formData.get(`day_${day}_to`)   as string) ?? '22:00';

    if (bulk === 'weekdays_same' && day <= 4) {
      active = true;
      preset = 'fullday';
    }
    if (bulk === 'weekend_off' && day >= 5) {
      active = false;
    }
    if (bulk === 'reset') {
      active = false;
    }

    await db.execute({
      sql: `DELETE FROM girl_schedules WHERE girl_id = ? AND day_of_week = ?`,
      args: [girlId, day],
    });

    if (active) {
      const times = preset === 'custom'
        ? toStorageTime(customFrom, customTo)
        : (PRESETS[preset] ?? PRESETS.fullday);

      await db.execute({
        sql: `INSERT INTO girl_schedules (girl_id, day_of_week, start_time, end_time, is_active)
              VALUES (?, ?, ?, ?, 1)`,
        args: [girlId, day, times.from, times.to],
      });
    }
  }

  revalidatePath('/cs/studio/dostupnost');
}

export async function studioSetTodayOff(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const today = pragueDateISO();

  await db.execute({
    sql: `DELETE FROM schedule_exceptions WHERE girl_id = ? AND date = ?`,
    args: [girlId, today],
  });

  await db.execute({
    sql: `INSERT INTO schedule_exceptions (girl_id, date, exception_type) VALUES (?, ?, 'unavailable')`,
    args: [girlId, today],
  });

  revalidatePath('/cs/studio/dostupnost');
}

export async function studioApplyMonthBulk(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const action = formData.get('month_action') as string;
  const month  = formData.get('month') as string;
  if (!action || !month) return;

  const [year, mon] = month.split('-').map(Number);

  if (action === 'clear_month') {
    const startDate = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    await db.execute({
      sql: `DELETE FROM schedule_exceptions WHERE girl_id = ? AND date >= ? AND date <= ?`,
      args: [girlId, startDate, endDate],
    });
  }

  if (action === 'next_week_off') {
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);

      await db.execute({
        sql: `DELETE FROM schedule_exceptions WHERE girl_id = ? AND date = ?`,
        args: [girlId, dateStr],
      });
      await db.execute({
        sql: `INSERT INTO schedule_exceptions (girl_id, date, exception_type) VALUES (?, ?, 'unavailable')`,
        args: [girlId, dateStr],
      });
    }
  }

  revalidatePath('/cs/studio/dostupnost');
}
