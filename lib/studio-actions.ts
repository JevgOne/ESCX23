'use server';

import { put } from '@vercel/blob';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireGirl, requireAdmin } from './auth';
import { db } from './db';
import { saveReviewReply } from './queries';
import { extractVimeoId } from './vimeo';

async function studioRedirect(path: string): Promise<never> {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';
  const match = pathname.match(/^\/(cs|en|de|uk)\//);
  const locale = match ? match[1] : 'cs';
  redirect(`/${locale}${path}`);
}

export async function updateGirlBasic(formData: FormData) {
  await requireAdmin();
  const girlId = Number(formData.get('girl_id') ?? 0);
  if (!girlId) await studioRedirect('/admin/divky');

  const name = String(formData.get('name') ?? '').trim();
  const age = Number(formData.get('age') ?? 18);
  const bio = String(formData.get('bio') ?? '').trim() || null;

  await db.execute({
    sql: `UPDATE girls SET name=?, age=?, bio=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [name, age, bio, girlId],
  });

  revalidatePath('/cs/studio');
  revalidatePath('/cs/studio/zakladni');
  await studioRedirect('/studio/zakladni?saved=1');
}

export async function updateGirlBody(formData: FormData) {
  await requireAdmin();
  const girlId = Number(formData.get('girl_id') ?? 0);
  if (!girlId) await studioRedirect('/admin/divky');

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
  await studioRedirect('/studio/telo?saved=1');
}

export async function updateGirlLifestyle(formData: FormData) {
  await requireAdmin();
  const girlId = Number(formData.get('girl_id') ?? 0);
  if (!girlId) await studioRedirect('/admin/divky');

  const nationality = String(formData.get('nationality') ?? '').trim() || null;

  // TODO: smoker, drinks, orientation, education, profession — columns not in girls schema yet

  await db.execute({
    sql: `UPDATE girls SET nationality=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [nationality, girlId],
  });

  revalidatePath('/cs/studio/zivotni-styl');
  await studioRedirect('/studio/zivotni-styl?saved=1');
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
  await studioRedirect('/studio/profil-status?saved=1');
}

export async function replyToReview(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const reviewId = Number(formData.get('reviewId') ?? 0);
  const replyText = String(formData.get('reply') ?? '').trim();

  if (!reviewId || !replyText) {
    await studioRedirect('/studio/recenze?error=empty');
  }

  await saveReviewReply(reviewId, girlId, replyText);

  revalidatePath('/cs/studio/recenze');
  revalidatePath('/cs/recenze');
  await studioRedirect('/studio/recenze?replied=1');
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
  await studioRedirect('/studio/sluzby?saved=1');
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
  await studioRedirect('/studio/jazyky?saved=1');
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
  await studioRedirect('/studio/zprava?saved=1');
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
  await studioRedirect('/studio/program?saved=1');
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
    await studioRedirect('/studio/hlas?saved=1');
  }

  if (!file || file.size === 0) {
    return studioRedirect('/studio/hlas?error=nofile');
  }

  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const allowed = new Set(['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac']);
  if (!allowed.has(ext)) {
    await studioRedirect('/studio/hlas?error=format');
  }

  if (file.size > 5 * 1024 * 1024) {
    await studioRedirect('/studio/hlas?error=size');
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
  await studioRedirect('/studio/hlas?saved=1');
}

export async function addStory(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const mediaUrl = String(formData.get('media_url') ?? '').trim();
  const mediaType = String(formData.get('media_type') ?? 'image');

  if (!mediaUrl) await studioRedirect('/studio/stories');

  await db.execute({
    sql: `INSERT INTO stories (girl_id, media_url, media_type, expires_at)
          VALUES (?, ?, ?, datetime('now', '+7 days'))`,
    args: [girlId, mediaUrl, mediaType],
  });

  revalidatePath('/cs/studio/stories');
  await studioRedirect('/studio/stories?saved=1');
}

export async function updateGirlHashtags(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const slugs = formData.getAll('hashtag_slugs').map(String).filter(Boolean);
  const hashtagsJson = JSON.stringify(slugs);

  await db.execute({
    sql: `UPDATE girls SET hashtags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [hashtagsJson, girlId],
  });

  revalidatePath('/cs/studio/hashtagy');
  await studioRedirect('/studio/hashtagy?saved=1');
}

export async function deleteStory(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id!;

  const storyId = Number(formData.get('storyId') ?? 0);
  if (!storyId) await studioRedirect('/studio/stories');

  await db.execute({
    sql: `DELETE FROM stories WHERE id = ? AND girl_id = ?`,
    args: [storyId, girlId],
  });

  revalidatePath('/cs/studio/stories');
  await studioRedirect('/studio/stories?deleted=1');
}

export async function addStudioVideo(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id;
  if (!girlId) return studioRedirect('/studio');

  const rawUrl = String(formData.get('vimeo_url') ?? '').trim();
  if (!rawUrl) return studioRedirect('/studio/videa?error=empty');

  const vimeoId = extractVimeoId(rawUrl);
  if (!vimeoId) return studioRedirect('/studio/videa?error=invalid');

  const url = `https://vimeo.com/${vimeoId}`;

  const orderRes = await db.execute({
    sql: `SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM girl_videos WHERE girl_id = ?`,
    args: [girlId],
  });
  const nextOrder = Number((orderRes.rows[0] as Record<string, unknown>)?.next_order ?? 0);

  await db.execute({
    sql: `INSERT INTO girl_videos (girl_id, filename, url, display_order, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    args: [girlId, `vimeo-${vimeoId}`, url, nextOrder],
  });

  revalidatePath('/cs/studio/videa');
  revalidatePath('/cs/profil');
  await studioRedirect('/studio/videa?saved=1');
}

export async function removeStudioVideo(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id;
  if (!girlId) return studioRedirect('/studio');

  const videoId = Number(formData.get('video_id'));
  if (!videoId) return studioRedirect('/studio/videa');

  await db.execute({
    sql: `DELETE FROM girl_videos WHERE id = ? AND girl_id = ?`,
    args: [videoId, girlId],
  });

  revalidatePath('/cs/studio/videa');
  revalidatePath('/cs/profil');
  await studioRedirect('/studio/videa');
}
