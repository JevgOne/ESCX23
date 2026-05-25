'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export async function submitApplication(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const age = Number(formData.get('age') ?? 0);
  const phone = String(formData.get('phone') ?? '').trim();
  const localeRaw = String(formData.get('locale') ?? 'cs');
  const locale = ['cs', 'en', 'de', 'uk'].includes(localeRaw) ? localeRaw : 'cs';

  if (!name || !phone || age < 18 || age > 70) {
    redirect(`/${locale}/join?error=validation`);
  }

  const height = formData.get('height') ? Number(formData.get('height')) : null;
  const weight = formData.get('weight') ? Number(formData.get('weight')) : null;
  const bust = formData.get('bust') ? Number(formData.get('bust')) : null;
  const bustNaturalRaw = formData.get('bust_natural');
  const bustNatural =
    bustNaturalRaw === '1' ? 1
    : bustNaturalRaw === '0' ? 0
    : null;
  const waist = formData.get('waist') ? Number(formData.get('waist')) : null;
  const hips = formData.get('hips') ? Number(formData.get('hips')) : null;
  const email = formData.get('email') ? String(formData.get('email')) : null;
  const telegram = formData.get('telegram') ? String(formData.get('telegram')) : null;
  const hair = formData.get('hair') ? String(formData.get('hair')) : null;
  const eyes = formData.get('eyes') ? String(formData.get('eyes')) : null;
  const tattoo = formData.get('tattoo') === '1' ? 1 : 0;
  const tattooDescription = formData.get('tattoo_description')
    ? String(formData.get('tattoo_description'))
    : null;
  const piercing = formData.get('piercing') === '1' ? 1 : 0;
  const languages = formData.get('languages') ? String(formData.get('languages')) : null;
  // services: multiple checkboxes → CSV of extra service IDs. Basics are auto-included on conversion to girl.
  const extraServices = formData.getAll('services').map(String).filter(Boolean);
  const services = extraServices.length > 0 ? extraServices.join(',') : null;
  const availability = formData.get('availability')
    ? String(formData.get('availability'))
    : null;
  const bio_cs = formData.get('bio_cs') ? String(formData.get('bio_cs')) : null;
  const bio_en = formData.get('bio_en') ? String(formData.get('bio_en')) : null;
  const experience = formData.get('experience') ? String(formData.get('experience')) : null;

  await db.execute({
    sql: `INSERT INTO girl_applications
      (name, age, height, weight, bust, bust_natural, waist, hips, email, phone, telegram,
       hair, eyes, tattoo, tattoo_description, piercing,
       languages, services, availability, bio_cs, bio_en, experience, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    args: [
      name, age, height, weight, bust, bustNatural, waist, hips,
      email, phone, telegram,
      hair, eyes, tattoo, tattooDescription, piercing,
      languages, services, availability, bio_cs, bio_en, experience,
    ],
  });

  redirect(`/${locale}/join?sent=1`);
}
