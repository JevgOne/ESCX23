'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function updateApplicationStatus(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));

  if (!['approved', 'rejected', 'pending'].includes(status)) return;

  await db.execute({
    sql: `UPDATE member_applications SET status = ? WHERE id = ?`,
    args: [status, id],
  });

  revalidatePath('/cs/admin/clenove');
}
