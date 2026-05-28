import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';
import { getLocationBySlug } from '@/lib/queries';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Apartment';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: (n: string) => string; tagline: string }> = {
  en: { eyebrow: () => 'Apartment', tagline: 'Discreet private flat · Prague centre · daily 10:00–22:30' },
  cs: { eyebrow: () => 'Apartmán', tagline: 'Diskrétní privát · centrum Prahy · denně 10:00–22:30' },
  de: { eyebrow: () => 'Apartment', tagline: 'Diskretes Privatapartment · Prag · täglich 10:00–22:30' },
  uk: { eyebrow: () => 'Апартамент', tagline: 'Дискретні апартаменти · центр · щодня 10:00–22:30' },
};

export default async function OgImage({ params }: { params: { locale: string; slug: string } }) {
  const locale = params?.locale ?? 'en';
  const slug = params?.slug ?? '';
  const loc = await getLocationBySlug(slug, locale).catch(() => null);
  const c = T[locale] ?? T.en;
  const headline = loc ? `${c.eyebrow('')} ${loc.displayName}` : (locale === 'cs' ? 'Apartmán Praha' : 'Prague apartment');
  return renderOgImage({
    eyebrow: c.eyebrow(''),
    headline,
    tagline: c.tagline,
  });
}
