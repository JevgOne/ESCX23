'use server';

import { db } from '@/lib/db';
import { pragueDateISO } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { requireGirl } from '@/lib/auth';

/** Close a shift by submitting the completed cleaning checklist. */
export async function closeShift(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const closureId = Number(formData.get('closure_id'));
  if (!closureId) return;

  // Collect checked items
  const checkedItems: Array<{ index: number; label: string; checkedAt: string }> = [];
  for (let i = 0; i < 12; i++) {
    if (formData.get(`item_${i}`) === 'on') {
      const label = formData.get(`label_${i}`) as string || '';
      checkedItems.push({ index: i, label, checkedAt: new Date().toISOString() });
    }
  }

  // All 12 items must be checked
  if (checkedItems.length < 12) return;

  await db.execute({
    sql: `UPDATE shift_closures
          SET status = 'closed', checklist_json = ?, closed_at = CURRENT_TIMESTAMP
          WHERE id = ? AND girl_id = ? AND status = 'open'`,
    args: [JSON.stringify(checkedItems), closureId, girlId],
  });

  revalidatePath('/cs/studio/uklid');
}

/** Get open shift closures for a girl. */
export async function getOpenShifts(girlId: number) {
  const result = await db.execute({
    sql: `SELECT * FROM shift_closures WHERE girl_id = ? AND status = 'open' ORDER BY date DESC, created_at DESC`,
    args: [girlId],
  });
  return result.rows;
}

/** Ensure a shift_closure record exists for today's shift. Called when viewing the page. */
export async function ensureTodayClosure(girlId: number, shiftType: string): Promise<void> {
  const today = pragueDateISO();
  // Only create if the girl has an active approved shift for today
  const existing = await db.execute({
    sql: `SELECT id FROM shift_closures WHERE girl_id = ? AND date = ? AND shift_type = ?`,
    args: [girlId, today, shiftType],
  });
  if (existing.rows.length > 0) return;

  await db.execute({
    sql: `INSERT OR IGNORE INTO shift_closures (girl_id, date, shift_type) VALUES (?, ?, ?)`,
    args: [girlId, today, shiftType],
  });
}
