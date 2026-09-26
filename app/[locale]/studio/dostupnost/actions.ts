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

/** Compute Monday of the week containing the given date. */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
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

  const times = SHIFT_TIMES[shiftType];

  await db.execute({
    sql: `INSERT OR REPLACE INTO shift_requests (girl_id, week_start, day_of_week, shift_type, start_time, end_time, location_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    args: [girlId, weekStart, dayOfWeek, shiftType, times.start, times.end, locationId],
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
