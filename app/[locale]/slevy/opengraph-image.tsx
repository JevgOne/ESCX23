import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Discounts';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'Discounts', headline: 'Special offers & loyalty', tagline: 'First-visit discount · happy hour · VIP tiers' },
  cs: { eyebrow: 'Slevy', headline: 'Slevy a balíčky', tagline: 'Sleva na první návštěvu · happy hour · věrnost' },
  de: { eyebrow: 'Rabatte', headline: 'Sonderangebote', tagline: 'Erstkundenrabatt · Happy Hour · Treue' },
  uk: { eyebrow: 'Знижки', headline: 'Знижки та лояльність', tagline: 'Перший візит · happy hour · VIP' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
