import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Schedule';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'Live schedule', headline: 'Who works today', tagline: 'Updated daily · 7-day outlook · Prague centre' },
  cs: { eyebrow: 'Rozvrh', headline: 'Kdo dnes pracuje', tagline: 'Aktualizace denně · 7denní výhled · Praha centrum' },
  de: { eyebrow: 'Zeitplan', headline: 'Wer heute arbeitet', tagline: 'Täglich aktualisiert · 7-Tage-Ausblick' },
  uk: { eyebrow: 'Розклад', headline: 'Хто сьогодні працює', tagline: 'Щодня · прогноз на 7 днів' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
