'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { put } from '@vercel/blob';
import { db } from './db';
import { requireAdmin, requireFullAdmin } from './auth';
import {
  updateGirlById,
  deleteGirlById,
} from './queries';

export async function updateGirl(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const age = Number(formData.get('age'));

  if (!name) throw new Error('Jméno je povinné');
  if (!slug) throw new Error('Slug je povinný');
  if (!age || age < 18) throw new Error('Věk musí být minimálně 18');

  const hashtagSlugs = formData.getAll('hashtag_slugs').map(String).filter(Boolean);
  const hashtagsJson = hashtagSlugs.length > 0 ? JSON.stringify(hashtagSlugs) : null;

  const langCodes = formData.getAll('lang_codes').map(String).filter(Boolean);
  const languagesCsv = langCodes.length > 0 ? langCodes.join(',') : null;

  const getStr = (k: string) => (formData.get(k) ? String(formData.get(k)).trim() : null);
  const getNum = (k: string) => (formData.get(k) ? Number(formData.get(k)) : null);

  await updateGirlById(id, {
    name,
    slug,
    age,
    height: getNum('height'),
    weight: getNum('weight'),
    bust: getStr('bust'),
    bust_natural: formData.get('bust_natural') !== null ? Number(formData.get('bust_natural')) : 1,
    waist: getNum('waist'),
    hips: getNum('hips'),
    eyes: getStr('eyes'),
    hair: getStr('hair'),
    tattoo_percentage: formData.get('tattoo_percentage') ? Number(formData.get('tattoo_percentage')) : 0,
    tattoo_description: getStr('tattoo_description'),
    piercing: formData.get('piercing') ? Number(formData.get('piercing')) : 0,
    piercing_description: getStr('piercing_description'),
    bio: getStr('bio'),
    status: String(formData.get('status') ?? 'pending'),
    online: formData.get('online') === 'on' ? 1 : 0,
    badge_type: getStr('badge_type'),
    location: getStr('location'),
    nationality: getStr('nationality'),
    telegram: getStr('telegram'),
    email: getStr('email'),
    phone: getStr('phone'),
    languages: languagesCsv,
    is_new: formData.get('is_new') === 'on' ? 1 : 0,
    is_top: formData.get('is_top') === 'on' ? 1 : 0,
    is_featured: formData.get('is_featured') === 'on' ? 1 : 0,
    verified: formData.get('verified') === 'on' ? 1 : 0,
    hashtags: hashtagsJson,
    vip: formData.get('vip') === 'on' ? 1 : 0,
    description_cs: getStr('description_cs'),
    description_en: getStr('description_en'),
    description_de: getStr('description_de'),
    description_uk: getStr('description_uk'),
    subtitle_cs: getStr('subtitle_cs'),
    subtitle_en: getStr('subtitle_en'),
    subtitle_de: getStr('subtitle_de'),
    subtitle_uk: getStr('subtitle_uk'),
    meta_title_cs: getStr('meta_title_cs'),
    meta_title_en: getStr('meta_title_en'),
    meta_title_de: getStr('meta_title_de'),
    meta_title_uk: getStr('meta_title_uk'),
    meta_description_cs: getStr('meta_description_cs'),
    meta_description_en: getStr('meta_description_en'),
    meta_description_de: getStr('meta_description_de'),
    meta_description_uk: getStr('meta_description_uk'),
    og_title_cs: getStr('og_title_cs'),
    og_title_en: getStr('og_title_en'),
    og_title_de: getStr('og_title_de'),
    og_title_uk: getStr('og_title_uk'),
    og_description_cs: getStr('og_description_cs'),
    og_description_en: getStr('og_description_en'),
    og_description_de: getStr('og_description_de'),
    og_description_uk: getStr('og_description_uk'),
    calendar_embed_url: getStr('calendar_embed_url'),
  });

  const serviceIds = formData.getAll('service_ids').map(Number).filter((n) => n > 0);
  await db.execute({ sql: `DELETE FROM girl_services WHERE girl_id=?`, args: [id] });
  for (const sid of serviceIds) {
    await db.execute({
      sql: `INSERT INTO girl_services (girl_id, service_id, is_included, extra_price) VALUES (?, ?, 1, NULL)`,
      args: [id, sid],
    });
  }

  revalidatePath('/admin/divky');
  revalidatePath(`/cs/admin/divky`);
  revalidatePath(`/cs/divky`);
  redirect(`/cs/admin/divky/${id}`);
}

export async function createGirl(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const rawSlug = String(formData.get('slug') ?? '').trim();
  const age = Number(formData.get('age'));
  const email = formData.get('email') ? String(formData.get('email')).trim() : null;
  const phone = formData.get('phone') ? String(formData.get('phone')).trim() : null;

  if (!name) throw new Error('Jméno je povinné');
  if (!rawSlug) throw new Error('Slug je povinný');
  if (!age || age < 18) throw new Error('Věk musí být minimálně 18');

  const nameCheck = await db.execute({ sql: `SELECT id FROM girls WHERE name=? LIMIT 1`, args: [name] });
  if (nameCheck.rows.length > 0) throw new Error('Dívka s tímto jménem již existuje');

  const slugCheck = await db.execute({ sql: `SELECT id FROM girls WHERE slug=? LIMIT 1`, args: [rawSlug] });
  if (slugCheck.rows.length > 0) throw new Error('Slug již existuje');

  const getStr = (k: string) => (formData.get(k) ? String(formData.get(k)).trim() : null);
  const getNum = (k: string) => (formData.get(k) ? Number(formData.get(k)) : null);

  const hashtagSlugs = formData.getAll('hashtag_slugs').map(String).filter(Boolean);
  const hashtagsJson = hashtagSlugs.length > 0 ? JSON.stringify(hashtagSlugs) : null;

  const result = await db.execute({
    sql: `INSERT INTO girls (
      name, slug, age, email, phone, status,
      nationality, location,
      height, weight, bust, bust_natural, hair, eyes,
      tattoo_percentage, tattoo_description,
      piercing, piercing_description,
      description_cs, description_en, description_de, description_uk,
      vip, is_featured, badge_type,
      hashtags,
      subtitle_cs, subtitle_en, subtitle_de, subtitle_uk,
      meta_title_cs, meta_title_en, meta_title_de, meta_title_uk,
      meta_description_cs, meta_description_en, meta_description_de, meta_description_uk,
      og_title_cs, og_title_en, og_title_de, og_title_uk,
      og_description_cs, og_description_en, og_description_de, og_description_uk,
      calendar_embed_url,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`,
    args: [
      name, rawSlug, age, email, phone,
      String(formData.get('status') ?? 'pending'),
      getStr('nationality'), getStr('location'),
      getNum('height'), getNum('weight'),
      getStr('bust'),
      formData.get('bust_natural') !== null ? Number(formData.get('bust_natural')) : 1,
      getStr('hair'), getStr('eyes'),
      formData.get('tattoo_percentage') ? Number(formData.get('tattoo_percentage')) : 0,
      getStr('tattoo_description'),
      formData.get('piercing') ? Number(formData.get('piercing')) : 0,
      getStr('piercing_description'),
      getStr('description_cs'), getStr('description_en'), getStr('description_de'), getStr('description_uk'),
      formData.get('vip') === 'on' ? 1 : 0,
      formData.get('is_featured') === 'on' ? 1 : 0,
      getStr('badge_type'),
      hashtagsJson,
      getStr('subtitle_cs'), getStr('subtitle_en'), getStr('subtitle_de'), getStr('subtitle_uk'),
      getStr('meta_title_cs'), getStr('meta_title_en'), getStr('meta_title_de'), getStr('meta_title_uk'),
      getStr('meta_description_cs'), getStr('meta_description_en'), getStr('meta_description_de'), getStr('meta_description_uk'),
      getStr('og_title_cs'), getStr('og_title_en'), getStr('og_title_de'), getStr('og_title_uk'),
      getStr('og_description_cs'), getStr('og_description_en'), getStr('og_description_de'), getStr('og_description_uk'),
      getStr('calendar_embed_url'),
    ],
  });

  const newId = Number(result.lastInsertRowid);

  const serviceIds = formData.getAll('service_ids').map(Number).filter((n) => n > 0);
  for (const sid of serviceIds) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO girl_services (girl_id, service_id, is_included, extra_price) VALUES (?, ?, 1, NULL)`,
      args: [newId, sid],
    });
  }

  const fromApplication = Number(formData.get('from_application_id') ?? 0);
  if (fromApplication > 0) {
    await db.execute({
      sql: `UPDATE girl_applications
            SET status='approved', reviewed_at=CURRENT_TIMESTAMP, converted_to_girl_id=?
            WHERE id=?`,
      args: [newId, fromApplication],
    });

    const appRes = await db.execute({
      sql: `SELECT services FROM girl_applications WHERE id=?`,
      args: [fromApplication],
    });
    const rawServices = appRes.rows[0]?.services;
    if (rawServices) {
      const slugs = String(rawServices).split(',').map((s) => s.trim()).filter(Boolean);
      if (slugs.length > 0) {
        const slugPlaceholders = slugs.map(() => '?').join(',');
        const svcRes = await db.execute({
          sql: `SELECT id FROM services WHERE slug IN (${slugPlaceholders})`,
          args: slugs,
        });
        for (const r of svcRes.rows) {
          await db.execute({
            sql: `INSERT OR IGNORE INTO girl_services (girl_id, service_id, is_included, extra_price) VALUES (?, ?, 1, NULL)`,
            args: [newId, Number(r.id)],
          });
        }
      }
    }
  }

  // revalidatePath/redirect failures shouldn't surface as 500 once data is committed.
  try { revalidatePath('/cs/admin/divky'); } catch {}
  try { revalidatePath('/cs/admin/aplikace'); } catch {}

  redirect(`/cs/admin/divky/${newId}/edit`);
}

/**
 * One-shot: takes a girl_application by id, creates a girl with all the data
 * straight from the application (jméno, věk, míry, prsa+typ, vlasy, oči, tetování,
 * piercing, email, telefon, bio, vybrané extras), marks the application approved
 * and redirects to /cs/admin/divky/{newId}/edit so admin can polish the profile.
 */
export async function createGirlFromApplication(formData: FormData) {
  await requireAdmin();
  const appId = Number(formData.get('application_id'));
  if (!appId) throw new Error('Missing application_id');

  const res = await db.execute({
    sql: `SELECT * FROM girl_applications WHERE id = ? LIMIT 1`,
    args: [appId],
  });
  const app = res.rows[0];
  if (!app) throw new Error('Aplikace nenalezena');

  const name = String(app.name ?? '').trim();
  if (!name) throw new Error('Aplikace nemá jméno');
  const age = Number(app.age ?? 0);
  if (age < 18) throw new Error('Aplikace má věk pod 18');

  // Generate a unique slug. If `slugify(name)` is taken, append -2, -3, …
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const check = await db.execute({ sql: `SELECT id FROM girls WHERE slug = ? LIMIT 1`, args: [slug] });
    if (check.rows.length === 0) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const email = app.email != null ? String(app.email).trim() || null : null;
  const phone = app.phone != null ? String(app.phone).trim() || null : null;
  const height = app.height != null ? Number(app.height) : null;
  const weight = app.weight != null ? Number(app.weight) : null;
  const bust = app.bust != null ? String(app.bust) : null;
  const bustNatural = app.bust_natural != null ? Number(app.bust_natural) : 1;
  const hair = app.hair != null ? String(app.hair) : null;
  const eyes = app.eyes != null ? String(app.eyes) : null;
  const tattoo = Number(app.tattoo ?? 0);
  const tattooDesc = app.tattoo_description != null ? String(app.tattoo_description) : null;
  const piercing = Number(app.piercing ?? 0);
  const bioCs = app.bio_cs != null ? String(app.bio_cs) : null;
  const bioEn = app.bio_en != null ? String(app.bio_en) : null;

  const insertRes = await db.execute({
    sql: `INSERT INTO girls (
      name, slug, age, email, phone, status,
      height, weight, bust, bust_natural, hair, eyes,
      tattoo_percentage, tattoo_description,
      piercing,
      description_cs, description_en,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, 'pending',
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?,
      ?, ?,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`,
    args: [
      name, slug, age, email, phone,
      height, weight, bust, bustNatural, hair, eyes,
      tattoo > 0 ? 10 : 0, tattooDesc,
      piercing,
      bioCs, bioEn,
    ],
  });
  const newId = Number(insertRes.lastInsertRowid);

  // Import extras (services CSV → girl_services)
  const rawServices = app.services != null ? String(app.services) : '';
  if (rawServices) {
    const slugs = rawServices.split(',').map((s) => s.trim()).filter(Boolean);
    if (slugs.length > 0) {
      const placeholders = slugs.map(() => '?').join(',');
      const svcRes = await db.execute({
        sql: `SELECT id FROM services WHERE slug IN (${placeholders})`,
        args: slugs,
      });
      for (const r of svcRes.rows) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO girl_services (girl_id, service_id, is_included, extra_price) VALUES (?, ?, 1, NULL)`,
          args: [newId, Number(r.id)],
        });
      }
    }
  }

  // Mark application approved + link to created girl
  await db.execute({
    sql: `UPDATE girl_applications
          SET status='approved', reviewed_at=CURRENT_TIMESTAMP, converted_to_girl_id=?
          WHERE id=?`,
    args: [newId, appId],
  });

  try { revalidatePath('/cs/admin/divky'); } catch {}
  try { revalidatePath('/cs/admin/aplikace'); } catch {}

  redirect(`/cs/admin/divky/${newId}/edit`);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function rejectApplication(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');
  const reason = formData.get('rejection_reason')
    ? String(formData.get('rejection_reason')).trim()
    : null;

  await db.execute({
    sql: `UPDATE girl_applications
          SET status='rejected', reviewed_at=CURRENT_TIMESTAMP, rejection_reason=?
          WHERE id=?`,
    args: [reason, id],
  });

  revalidatePath('/cs/admin/aplikace');
  redirect('/cs/admin/aplikace');
}

export async function reopenApplication(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({
    sql: `UPDATE girl_applications
          SET status='pending', reviewed_at=NULL, rejection_reason=NULL, converted_to_girl_id=NULL
          WHERE id=?`,
    args: [id],
  });

  revalidatePath('/cs/admin/aplikace');
  redirect(`/cs/admin/aplikace/${id}`);
}

export async function updateApplicationNotes(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');
  const notes = formData.get('notes') ? String(formData.get('notes')).trim() : null;

  await db.execute({
    sql: `UPDATE girl_applications SET notes=? WHERE id=?`,
    args: [notes, id],
  });

  revalidatePath('/cs/admin/aplikace');
  redirect(`/cs/admin/aplikace/${id}`);
}

export async function deleteGirl(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await deleteGirlById(id);

  revalidatePath('/admin/divky');
  revalidatePath('/cs/admin/divky');
  redirect('/cs/admin/divky');
}

export async function approvePhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `UPDATE girl_photos SET is_primary=1 WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/verifikace');
}

export async function rejectPhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `DELETE FROM girl_photos WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/verifikace');
}

// ─── POBOCKY ────────────────────────────────────────────────────────────────

export async function createPobocka(formData: FormData) {
  await requireFullAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const display_name = String(formData.get('display_name') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();

  if (!name) throw new Error('Název je povinný');
  if (!display_name) throw new Error('Zobrazovaný název je povinný');
  if (!city) throw new Error('Město je povinné');

  const getStr = (k: string) => (formData.get(k) ? String(formData.get(k)) : null);
  const LANGS = ['', '_en', '_de', '_uk'];
  const langCols = (base: string) => LANGS.map((s) => `${base}${s === '' ? '' : s}`);
  const I18N_FIELDS = ['description', 'transport_text', 'payment_text', 'parking_text', 'features_text', 'hours_text'];

  const insertCols = ['name','display_name','city','district','address','postal_code','phone','email','is_active','is_primary',
    ...I18N_FIELDS.flatMap(langCols)];
  const insertVals = [
    name, display_name, city,
    getStr('district'), getStr('address'), getStr('postal_code'), getStr('phone'), getStr('email'),
    formData.get('is_active') === 'on' ? 1 : 0,
    formData.get('is_primary') === 'on' ? 1 : 0,
    ...I18N_FIELDS.flatMap((f) => [getStr(`${f}_cs`) ?? getStr(f), getStr(`${f}_en`), getStr(`${f}_de`), getStr(`${f}_uk`)]),
  ];
  await db.execute({
    sql: `INSERT INTO locations (${insertCols.join(', ')}) VALUES (${insertCols.map(() => '?').join(', ')})`,
    args: insertVals as (string | number | null)[],
  });

  revalidatePath('/cs/admin/pobocky');
  revalidatePath('/cs');
  redirect('/cs/admin/pobocky');
}

export async function updatePobocka(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  const name = String(formData.get('name') ?? '').trim();
  const display_name = String(formData.get('display_name') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();

  if (!name) throw new Error('Název je povinný');
  if (!display_name) throw new Error('Zobrazovaný název je povinný');
  if (!city) throw new Error('Město je povinné');

  const getStr = (k: string) => (formData.get(k) ? String(formData.get(k)) : null);
  const I18N_FIELDS = ['description', 'transport_text', 'payment_text', 'parking_text', 'features_text', 'hours_text'];
  const baseCols = ['name','display_name','city','district','address','postal_code','phone','email','is_active','is_primary'];
  const i18nCols = I18N_FIELDS.flatMap((f) => [f, `${f}_en`, `${f}_de`, `${f}_uk`]);
  const allCols = [...baseCols, ...i18nCols];
  const baseVals = [
    name, display_name, city,
    getStr('district'), getStr('address'), getStr('postal_code'), getStr('phone'), getStr('email'),
    formData.get('is_active') === 'on' ? 1 : 0,
    formData.get('is_primary') === 'on' ? 1 : 0,
  ];
  const i18nVals = I18N_FIELDS.flatMap((f) => [
    getStr(`${f}_cs`) ?? getStr(f),
    getStr(`${f}_en`),
    getStr(`${f}_de`),
    getStr(`${f}_uk`),
  ]);
  await db.execute({
    sql: `UPDATE locations SET ${allCols.map((c) => `${c}=?`).join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [...baseVals, ...i18nVals, id] as (string | number | null)[],
  });

  revalidatePath('/cs/admin/pobocky');
  revalidatePath('/cs');
  revalidatePath(`/cs/pobocka/${name}`);
  revalidatePath(`/en/pobocka/${name}`);
  revalidatePath(`/de/pobocka/${name}`);
  revalidatePath(`/uk/pobocka/${name}`);
  redirect('/cs/admin/pobocky');
}

export async function deletePobocka(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({ sql: `DELETE FROM locations WHERE id=?`, args: [id] });

  revalidatePath('/cs/admin/pobocky');
  revalidatePath('/cs');
  redirect('/cs/admin/pobocky');
}

// ─── CENIK — PRICING PLANS ──────────────────────────────────────────────────

export async function updatePricingPlan(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({
    sql: `UPDATE pricing_plans SET duration=?, price=?, is_popular=?, display_order=?, is_active=?,
          title_cs=?, title_en=?, title_de=?, title_uk=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [
      Number(formData.get('duration')),
      Number(formData.get('price')),
      formData.get('is_popular') === 'on' ? 1 : 0,
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      String(formData.get('title_cs') ?? ''),
      String(formData.get('title_en') ?? ''),
      String(formData.get('title_de') ?? ''),
      String(formData.get('title_uk') ?? ''),
      id,
    ],
  });

  revalidatePath('/cs/admin/cenik');
  revalidatePath('/cs/cenik');
  redirect('/cs/admin/cenik');
}

export async function createPricingPlan(formData: FormData) {
  await requireFullAdmin();
  await db.execute({
    sql: `INSERT INTO pricing_plans (duration, price, is_popular, display_order, is_active, title_cs, title_en, title_de, title_uk)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      Number(formData.get('duration')),
      Number(formData.get('price')),
      formData.get('is_popular') === 'on' ? 1 : 0,
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      String(formData.get('title_cs') ?? ''),
      String(formData.get('title_en') ?? ''),
      String(formData.get('title_de') ?? ''),
      String(formData.get('title_uk') ?? ''),
    ],
  });

  revalidatePath('/cs/admin/cenik');
  revalidatePath('/cs/cenik');
  redirect('/cs/admin/cenik');
}

export async function deletePricingPlan(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({ sql: `DELETE FROM pricing_plans WHERE id=?`, args: [id] });

  revalidatePath('/cs/admin/cenik');
  revalidatePath('/cs/cenik');
  redirect('/cs/admin/cenik');
}

// ─── CENIK — EXTRAS ─────────────────────────────────────────────────────────

export async function createPricingExtra(formData: FormData) {
  await requireFullAdmin();
  await db.execute({
    sql: `INSERT INTO pricing_extras (price, display_order, is_active, name_cs, name_en, name_de, name_uk)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      Number(formData.get('price')),
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      String(formData.get('name_cs') ?? ''),
      String(formData.get('name_en') ?? ''),
      String(formData.get('name_de') ?? ''),
      String(formData.get('name_uk') ?? ''),
    ],
  });

  revalidatePath('/cs/admin/cenik');
  revalidatePath('/cs/cenik');
  redirect('/cs/admin/cenik');
}

export async function updatePricingExtra(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({
    sql: `UPDATE pricing_extras SET price=?, display_order=?, is_active=?,
          name_cs=?, name_en=?, name_de=?, name_uk=? WHERE id=?`,
    args: [
      Number(formData.get('price')),
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      String(formData.get('name_cs') ?? ''),
      String(formData.get('name_en') ?? ''),
      String(formData.get('name_de') ?? ''),
      String(formData.get('name_uk') ?? ''),
      id,
    ],
  });

  revalidatePath('/cs/admin/cenik');
  revalidatePath('/cs/cenik');
  redirect('/cs/admin/cenik');
}

export async function deletePricingExtra(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({ sql: `DELETE FROM pricing_extras WHERE id=?`, args: [id] });

  revalidatePath('/cs/admin/cenik');
  revalidatePath('/cs/cenik');
  redirect('/cs/admin/cenik');
}

// ─── SLEVY ───────────────────────────────────────────────────────────────────

export async function createSleva(formData: FormData) {
  await requireFullAdmin();
  await db.execute({
    sql: `INSERT INTO discounts (icon, discount_type, discount_value, display_order, is_active, is_featured,
          name_cs, name_en, name_de, name_uk, description_cs, description_en, description_de, description_uk)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      formData.get('icon') ? String(formData.get('icon')) : '🎁',
      String(formData.get('discount_type') ?? 'percentage'),
      formData.get('discount_value') ? Number(formData.get('discount_value')) : null,
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      formData.get('is_featured') === 'on' ? 1 : 0,
      String(formData.get('name_cs') ?? ''),
      String(formData.get('name_en') ?? ''),
      String(formData.get('name_de') ?? ''),
      String(formData.get('name_uk') ?? ''),
      String(formData.get('description_cs') ?? ''),
      String(formData.get('description_en') ?? ''),
      String(formData.get('description_de') ?? ''),
      String(formData.get('description_uk') ?? ''),
    ],
  });

  revalidatePath('/cs/admin/slevy');
  revalidatePath('/cs/slevy');
  redirect('/cs/admin/slevy');
}

export async function updateSleva(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({
    sql: `UPDATE discounts SET icon=?, discount_type=?, discount_value=?, display_order=?, is_active=?, is_featured=?,
          name_cs=?, name_en=?, name_de=?, name_uk=?,
          description_cs=?, description_en=?, description_de=?, description_uk=?,
          updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [
      formData.get('icon') ? String(formData.get('icon')) : '🎁',
      String(formData.get('discount_type') ?? 'percentage'),
      formData.get('discount_value') ? Number(formData.get('discount_value')) : null,
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      formData.get('is_featured') === 'on' ? 1 : 0,
      String(formData.get('name_cs') ?? ''),
      String(formData.get('name_en') ?? ''),
      String(formData.get('name_de') ?? ''),
      String(formData.get('name_uk') ?? ''),
      String(formData.get('description_cs') ?? ''),
      String(formData.get('description_en') ?? ''),
      String(formData.get('description_de') ?? ''),
      String(formData.get('description_uk') ?? ''),
      id,
    ],
  });

  revalidatePath('/cs/admin/slevy');
  revalidatePath('/cs/slevy');
  redirect('/cs/admin/slevy');
}

export async function deleteSleva(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({ sql: `DELETE FROM discounts WHERE id=?`, args: [id] });

  revalidatePath('/cs/admin/slevy');
  revalidatePath('/cs/slevy');
  redirect('/cs/admin/slevy');
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export async function createFaq(formData: FormData) {
  await requireFullAdmin();
  await db.execute({
    sql: `INSERT INTO faq_items (category, display_order, is_active,
          question_cs, question_en, question_de, question_uk,
          answer_cs, answer_en, answer_de, answer_uk)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      String(formData.get('category') ?? 'general'),
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      String(formData.get('question_cs') ?? ''),
      String(formData.get('question_en') ?? ''),
      String(formData.get('question_de') ?? ''),
      String(formData.get('question_uk') ?? ''),
      String(formData.get('answer_cs') ?? ''),
      String(formData.get('answer_en') ?? ''),
      String(formData.get('answer_de') ?? ''),
      String(formData.get('answer_uk') ?? ''),
    ],
  });

  revalidatePath('/cs/admin/faq');
  revalidatePath('/cs/faq');
  redirect('/cs/admin/faq');
}

export async function updateFaq(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({
    sql: `UPDATE faq_items SET category=?, display_order=?, is_active=?,
          question_cs=?, question_en=?, question_de=?, question_uk=?,
          answer_cs=?, answer_en=?, answer_de=?, answer_uk=?,
          updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [
      String(formData.get('category') ?? 'general'),
      Number(formData.get('display_order') ?? 0),
      formData.get('is_active') === 'on' ? 1 : 0,
      String(formData.get('question_cs') ?? ''),
      String(formData.get('question_en') ?? ''),
      String(formData.get('question_de') ?? ''),
      String(formData.get('question_uk') ?? ''),
      String(formData.get('answer_cs') ?? ''),
      String(formData.get('answer_en') ?? ''),
      String(formData.get('answer_de') ?? ''),
      String(formData.get('answer_uk') ?? ''),
      id,
    ],
  });

  revalidatePath('/cs/admin/faq');
  revalidatePath('/cs/faq');
  redirect('/cs/admin/faq');
}

export async function deleteFaq(formData: FormData) {
  await requireFullAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  await db.execute({ sql: `DELETE FROM faq_items WHERE id=?`, args: [id] });

  revalidatePath('/cs/admin/faq');
  revalidatePath('/cs/faq');
  redirect('/cs/admin/faq');
}

// ─── STORIES ─────────────────────────────────────────────────────────────────

export async function approveStory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');
  await db.execute({
    sql: `UPDATE stories SET status='live', is_active=1 WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/stories');
}

export async function expireStory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');
  await db.execute({
    sql: `UPDATE stories SET status='expired', is_active=0, expires_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/stories');
}

export async function deleteStory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');
  await db.execute({ sql: `DELETE FROM stories WHERE id=?`, args: [id] });
  revalidatePath('/cs/admin/stories');
}

export async function createCategoryStory(formData: FormData) {
  await requireAdmin();
  const category = String(formData.get('category') ?? '').trim();
  const bgType = String(formData.get('bg_type') ?? 'COLOR').trim();
  const mediaUrl = String(formData.get('media_url') ?? '').trim();
  const caption = String(formData.get('caption') ?? '').trim().slice(0, 100);
  const expiresAt = formData.get('expires_at')
    ? String(formData.get('expires_at'))
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  if (!category) throw new Error('Kategorie je povinná');
  if (!mediaUrl) throw new Error('URL pozadí je povinné');

  await db.execute({
    sql: `INSERT INTO stories (girl_id, media_url, media_type, bg_type, caption, category, status, is_active, expires_at)
          VALUES (0, ?, ?, ?, ?, ?, 'live', 1, ?)`,
    args: [mediaUrl, bgType === 'VIDEO' ? 'video' : 'image', bgType, caption || null, category, expiresAt],
  });

  revalidatePath('/cs/admin/stories');
  redirect('/cs/admin/stories');
}

// ─── SCHEDULES ───────────────────────────────────────────────────────────────

const PRESET_TIMES: Record<string, [string, string]> = {
  ranni: ['10:00', '16:00'],
  odpoledni: ['16:30', '22:30'],
  celodenni: ['10:00', '22:00'],
};

export async function addGirlSchedule(formData: FormData) {
  await requireAdmin();
  const girlId = Number(formData.get('girl_id'));
  if (!girlId) throw new Error('Chybí girl_id');

  const locationId = formData.get('location_id') ? Number(formData.get('location_id')) : null;

  // Global preset + Od/Do (applied to all selected days)
  const globalPreset = String(formData.get('preset') ?? 'ranni');
  const globalStart = String(formData.get('start_time') ?? '10:00');
  const globalEnd = String(formData.get('end_time') ?? '16:00');

  let anyDaySelected = false;
  for (let i = 0; i <= 6; i++) {
    if (formData.get(`day_${i}`) !== '1') continue;
    anyDaySelected = true;

    // Per-day Od/Do inputs are source of truth (preset radios are visual hints only).
    // Fallback chain: per-day input → preset hardcoded → global input.
    const perDayStart = formData.get(`start_${i}`);
    const perDayEnd = formData.get(`end_${i}`);
    const perDayPreset = formData.get(`preset_${i}`);
    const preset = perDayPreset ? String(perDayPreset) : globalPreset;

    let startTime: string;
    let endTime: string;

    const pds = perDayStart ? String(perDayStart).trim() : '';
    const pde = perDayEnd ? String(perDayEnd).trim() : '';
    if (pds && pde) {
      startTime = pds;
      endTime = pde;
    } else if (PRESET_TIMES[preset]) {
      [startTime, endTime] = PRESET_TIMES[preset];
    } else {
      startTime = globalStart;
      endTime = globalEnd;
    }

    // Avoid duplicate (same girl + same day): replace existing
    await db.execute({
      sql: `DELETE FROM girl_schedules WHERE girl_id=? AND day_of_week=?`,
      args: [girlId, i],
    });
    await db.execute({
      sql: `INSERT INTO girl_schedules (girl_id, day_of_week, start_time, end_time, location_id, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [girlId, i, startTime, endTime, locationId],
    });
  }

  if (!anyDaySelected) {
    throw new Error('Vyberte alespoň jeden den');
  }

  revalidatePath('/cs/admin/schedules');
  revalidatePath('/cs/rozvrh');
  redirect('/cs/admin/schedules');
}

export async function deleteGirlSchedule(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Chybí id');

  await db.execute({ sql: `DELETE FROM girl_schedules WHERE id=?`, args: [id] });

  revalidatePath('/cs/admin/schedules');
  revalidatePath('/cs/rozvrh');
  redirect('/cs/admin/schedules');
}

export async function deleteAllSchedules(formData: FormData) {
  await requireAdmin();
  const girlId = formData.get('girl_id') ? Number(formData.get('girl_id')) : null;

  if (girlId) {
    await db.execute({ sql: `DELETE FROM girl_schedules WHERE girl_id=?`, args: [girlId] });
  } else {
    await db.execute(`DELETE FROM girl_schedules`);
  }

  revalidatePath('/cs/admin/schedules');
  revalidatePath('/cs/rozvrh');
  redirect('/cs/admin/schedules');
}

export async function fixScheduleColors(formData: FormData) {
  await requireAdmin();
  void formData;
  revalidatePath('/cs/admin/schedules');
  redirect('/cs/admin/schedules');
}

export async function approveReview(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `UPDATE reviews SET status='approved', approved_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/recenze');
}

export async function rejectReview(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `UPDATE reviews SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/recenze');
}

/* =========================================================
 *  Blog actions
 * ========================================================= */

export async function createBlogPost(formData: FormData) {
  await requireAdmin();

  const slug = String(formData.get('slug') ?? '').trim();
  const titleCs = String(formData.get('title_cs') ?? '').trim();
  const titleEn = String(formData.get('title_en') ?? '').trim();
  if (!slug || !titleCs) throw new Error('Slug a titulek CS jsou povinné');

  const status = String(formData.get('status') ?? 'draft');
  const author = String(formData.get('author') ?? 'Redakce');
  const readingTime = Number(formData.get('reading_time_min') ?? 5);
  const publishedAt = formData.get('published_at') ? String(formData.get('published_at')).replace('T', ' ') : null;

  const result = await db.execute({
    sql: `INSERT INTO blog_posts (slug, title_cs, title_en, excerpt_cs, excerpt_en,
            content_cs, content_en, meta_description_cs, meta_description_en,
            author, status, reading_time_min, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      slug, titleCs, titleEn,
      String(formData.get('excerpt_cs') || '') || null,
      String(formData.get('excerpt_en') || '') || null,
      String(formData.get('content_cs') || '') || null,
      String(formData.get('content_en') || '') || null,
      String(formData.get('meta_description_cs') || '') || null,
      String(formData.get('meta_description_en') || '') || null,
      author, status, readingTime,
      status === 'published' ? (publishedAt ?? new Date().toISOString()) : publishedAt,
    ],
  });

  const postId = Number(result.lastInsertRowid);

  // Assign tags
  const tagIds = formData.getAll('tag_ids').map(Number).filter(Boolean);
  for (const tagId of tagIds) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
      args: [postId, tagId],
    });
  }

  revalidatePath('/cs/admin/blog');
  revalidatePath('/cs/blog');
  revalidatePath('/en/blog');
  redirect(`/cs/admin/blog/${postId}`);
}

export async function updateBlogPost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Missing id');

  const slug = String(formData.get('slug') ?? '').trim();
  const titleCs = String(formData.get('title_cs') ?? '').trim();
  const titleEn = String(formData.get('title_en') ?? '').trim();
  if (!slug || !titleCs) throw new Error('Slug a titulek CS jsou povinné');

  const status = String(formData.get('status') ?? 'draft');
  const author = String(formData.get('author') ?? 'Redakce');
  const readingTime = Number(formData.get('reading_time_min') ?? 5);
  const publishedAt = formData.get('published_at') ? String(formData.get('published_at')).replace('T', ' ') : null;

  await db.execute({
    sql: `UPDATE blog_posts SET
            slug=?, title_cs=?, title_en=?,
            excerpt_cs=?, excerpt_en=?,
            content_cs=?, content_en=?,
            meta_description_cs=?, meta_description_en=?,
            author=?, status=?, reading_time_min=?,
            published_at=?, updated_at=CURRENT_TIMESTAMP
          WHERE id=?`,
    args: [
      slug, titleCs, titleEn,
      String(formData.get('excerpt_cs') || '') || null,
      String(formData.get('excerpt_en') || '') || null,
      String(formData.get('content_cs') || '') || null,
      String(formData.get('content_en') || '') || null,
      String(formData.get('meta_description_cs') || '') || null,
      String(formData.get('meta_description_en') || '') || null,
      author, status, readingTime,
      status === 'published' ? (publishedAt ?? new Date().toISOString()) : publishedAt,
      id,
    ],
  });

  // Re-sync tags
  await db.execute({ sql: 'DELETE FROM blog_post_tags WHERE post_id = ?', args: [id] });
  const tagIds = formData.getAll('tag_ids').map(Number).filter(Boolean);
  for (const tagId of tagIds) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
      args: [id, tagId],
    });
  }

  revalidatePath('/cs/admin/blog');
  revalidatePath('/cs/blog');
  revalidatePath('/en/blog');
  revalidatePath(`/cs/blog/${slug}`);
  revalidatePath(`/en/blog/${slug}`);
  redirect(`/cs/admin/blog/${id}`);
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({ sql: 'DELETE FROM blog_post_tags WHERE post_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM blog_posts WHERE id = ?', args: [id] });
  revalidatePath('/cs/admin/blog');
  revalidatePath('/cs/blog');
  revalidatePath('/en/blog');
  redirect('/cs/admin/blog');
}

export async function uploadBlogCover(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const file = formData.get('cover') as File | null;
  if (!file || !id) throw new Error('Missing file or id');

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `blog/${id}/${Date.now()}.${ext}`;
  const blob = await put(filename, file, {
    access: 'public',
    contentType: file.type || `image/${ext}`,
    addRandomSuffix: false,
  });

  await db.execute({
    sql: 'UPDATE blog_posts SET cover_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [blob.url, id],
  });

  revalidatePath('/cs/admin/blog');
  revalidatePath(`/cs/admin/blog/${id}`);
  revalidatePath('/cs/blog');
  revalidatePath('/en/blog');
  redirect(`/cs/admin/blog/${id}`);
}
