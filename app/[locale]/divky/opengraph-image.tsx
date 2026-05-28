import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Our companions';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'Our companions', headline: 'Verified companions in Prague', tagline: 'Browse 13 companions · daily 10:00–22:30' },
  cs: { eyebrow: 'Naše společnice', headline: 'Ověřené společnice v Praze', tagline: 'Vyberte ze 13 dívek · denně 10:00–22:30' },
  de: { eyebrow: 'Unsere Begleiterinnen', headline: 'Verifizierte Begleiterinnen Prag', tagline: '13 Begleiterinnen · täglich 10:00–22:30' },
  uk: { eyebrow: 'Наші супутниці', headline: 'Перевірені супутниці у Празі', tagline: 'Виберіть з 13 дівчат · щодня 10:00–22:30' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
