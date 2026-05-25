'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireGirl } from './auth';
import { db } from './db';

export async function updateGirlBasic(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const name = String(formData.get('name') ?? '').trim();
  const age = Number(formData.get('age') ?? 18);
  const bio = String(formData.get('bio') ?? '').trim() || null;

  await db.execute({
    sql: `UPDATE girls SET name=?, age=?, bio=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [name, age, bio, girlId],
  });

  revalidatePath('/cs/studio');
  revalidatePath('/cs/studio/zakladni');
  redirect('/cs/studio/zakladni?saved=1');
}

export async function updateGirlBody(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const height = formData.get('height') ? Number(formData.get('height')) : null;
  const weight = formData.get('weight') ? Number(formData.get('weight')) : null;
  const bust = String(formData.get('bust') ?? '').trim() || null;
  const eyes = String(formData.get('eyes') ?? '').trim() || null;
  const hair = String(formData.get('hair') ?? '').trim() || null;
  const tattoo = formData.get('tattoo') === 'on' ? 1 : 0;
  const tattoo_description = String(formData.get('tattoo_description') ?? '').trim() || null;
  const piercing = formData.get('piercing') === 'on' ? 1 : 0;

  await db.execute({
    sql: `UPDATE girls SET height=?, weight=?, bust=?, eyes=?, hair=?,
          tattoo_percentage=?, tattoo_description=?, piercing=?,
          updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [height, weight, bust, eyes, hair, tattoo, tattoo_description, piercing, girlId],
  });

  revalidatePath('/cs/studio/telo');
  redirect('/cs/studio/telo?saved=1');
}

export async function updateGirlLifestyle(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const nationality = String(formData.get('nationality') ?? '').trim() || null;

  // TODO: smoker, drinks, orientation, education, profession — columns not in girls schema yet

  await db.execute({
    sql: `UPDATE girls SET nationality=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [nationality, girlId],
  });

  revalidatePath('/cs/studio/zivotni-styl');
  redirect('/cs/studio/zivotni-styl?saved=1');
}

export async function updateGirlStatus(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const profileStatus = String(formData.get('profile_status') ?? 'active');

  let dbStatus: string;
  if (profileStatus === 'live') dbStatus = 'active';
  else if (profileStatus === 'paused') dbStatus = 'inactive';
  else dbStatus = 'active'; // vip_only → active for now (no vip_only_profile column yet)

  await db.execute({
    sql: `UPDATE girls SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [dbStatus, girlId],
  });

  revalidatePath('/cs/studio/profil-status');
  revalidatePath('/cs/studio');
  redirect('/cs/studio/profil-status?saved=1');
}
