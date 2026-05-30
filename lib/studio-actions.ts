'use server';

import { put } from '@vercel/blob';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireGirl } from './auth';
import { db } from './db';
import { saveReviewReply } from './queries';

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

export async function replyToReview(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const reviewId = Number(formData.get('reviewId') ?? 0);
  const replyText = String(formData.get('reply') ?? '').trim();

  if (!reviewId || !replyText) {
    redirect('/cs/studio/recenze?error=empty');
  }

  await saveReviewReply(reviewId, girlId, replyText);

  revalidatePath('/cs/studio/recenze');
  revalidatePath('/cs/recenze');
  redirect('/cs/studio/recenze?replied=1');
}

export async function updateGirlServices(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const serviceIds = formData.getAll('services').map(Number).filter(Boolean);

  // Delete all existing, then insert selected
  await db.execute({ sql: `DELETE FROM girl_services WHERE girl_id = ?`, args: [girlId] });

  for (const sid of serviceIds) {
    await db.execute({
      sql: `INSERT INTO girl_services (girl_id, service_id) VALUES (?, ?)`,
      args: [girlId, sid],
    });
  }

  revalidatePath('/cs/studio/sluzby');
  redirect('/cs/studio/sluzby?saved=1');
}

export async function updateGirlLanguages(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const langs = formData.getAll('languages').map(String).filter(Boolean);
  const langsJson = JSON.stringify(langs);

  await db.execute({
    sql: `UPDATE girls SET languages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [langsJson, girlId],
  });

  revalidatePath('/cs/studio/jazyky');
  redirect('/cs/studio/jazyky?saved=1');
}

export async function updatePersonalMessage(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const clear = formData.get('clear') === '1';
  const message = clear ? null : (String(formData.get('message') ?? '').trim().slice(0, 160) || null);

  await db.execute({
    sql: `UPDATE girls SET personal_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [message, girlId],
  });

  revalidatePath('/cs/studio/zprava');
  redirect('/cs/studio/zprava?saved=1');
}

export async function updatePreferredProgram(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const raw = String(formData.get('program_id') ?? '').trim();
  const programId = raw ? Number(raw) : null;

  await db.execute({
    sql: `UPDATE girls SET preferred_program_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [programId, girlId],
  });

  revalidatePath('/cs/studio/program');
  redirect('/cs/studio/program?saved=1');
}

export async function uploadVoiceMessage(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const file = formData.get('voice') as File | null;
  const deleteOnly = formData.get('delete') === '1';

  if (deleteOnly) {
    await db.execute({
      sql: `UPDATE girls SET voice_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [girlId],
    });
    revalidatePath('/cs/studio/hlas');
    redirect('/cs/studio/hlas?saved=1');
  }

  if (!file || file.size === 0) {
    redirect('/cs/studio/hlas?error=nofile');
  }

  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const allowed = new Set(['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac']);
  if (!allowed.has(ext)) {
    redirect('/cs/studio/hlas?error=format');
  }

  if (file.size > 5 * 1024 * 1024) {
    redirect('/cs/studio/hlas?error=size');
  }

  const filename = `voices/${girlId}/${Date.now()}.${ext}`;
  const blob = await put(filename, file, {
    access: 'public',
    contentType: file.type || `audio/${ext}`,
    addRandomSuffix: false,
  });

  await db.execute({
    sql: `UPDATE girls SET voice_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [blob.url, girlId],
  });

  revalidatePath('/cs/studio/hlas');
  redirect('/cs/studio/hlas?saved=1');
}

export async function addStory(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const mediaUrl = String(formData.get('media_url') ?? '').trim();
  const mediaType = String(formData.get('media_type') ?? 'image');

  if (!mediaUrl) redirect('/cs/studio/stories');

  await db.execute({
    sql: `INSERT INTO stories (girl_id, media_url, media_type, expires_at)
          VALUES (?, ?, ?, datetime('now', '+24 hours'))`,
    args: [girlId, mediaUrl, mediaType],
  });

  revalidatePath('/cs/studio/stories');
  redirect('/cs/studio/stories?saved=1');
}

export async function deleteStory(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const storyId = Number(formData.get('storyId') ?? 0);
  if (!storyId) redirect('/cs/studio/stories');

  await db.execute({
    sql: `DELETE FROM stories WHERE id = ? AND girl_id = ?`,
    args: [storyId, girlId],
  });

  revalidatePath('/cs/studio/stories');
  redirect('/cs/studio/stories?deleted=1');
}
