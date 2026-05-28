import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — FAQ';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'FAQ', headline: 'Questions answered', tagline: 'Legality · payment · etiquette · booking' },
  cs: { eyebrow: 'Časté dotazy', headline: 'Odpovědi na vše', tagline: 'Legalita · platba · etiketa · rezervace' },
  de: { eyebrow: 'FAQ', headline: 'Antworten auf alles', tagline: 'Legalität · Zahlung · Etikette · Buchung' },
  uk: { eyebrow: 'Часті питання', headline: 'Відповіді на все', tagline: 'Легальність · оплата · етикет · бронювання' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
