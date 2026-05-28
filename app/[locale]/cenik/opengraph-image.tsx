import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Pricing';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'Pricing', headline: 'Transparent companion pricing', tagline: '30 min from 2 500 CZK · 60 min · 90 min · overnight' },
  cs: { eyebrow: 'Ceník', headline: 'Jasné ceny společnic', tagline: '30 min od 2 500 Kč · 60 min · 90 min · noc' },
  de: { eyebrow: 'Preise', headline: 'Transparente Preise', tagline: '30 Min ab 2 500 CZK · 60 · 90 Min · Übernachtung' },
  uk: { eyebrow: 'Ціни', headline: 'Прозорі ціни супутниць', tagline: '30 хв від 2 500 CZK · 60 · 90 хв · ніч' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
