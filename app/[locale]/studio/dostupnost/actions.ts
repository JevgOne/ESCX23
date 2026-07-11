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
