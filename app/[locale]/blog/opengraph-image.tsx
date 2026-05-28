import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Blog';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'Blog & Guides', headline: 'Discreet companion insights', tagline: 'Tips, guides, news from LovelyGirls Prague' },
  cs: { eyebrow: 'Blog & průvodci', headline: 'Vše o diskrétních setkáních', tagline: 'Tipy, průvodci, novinky z agentury' },
  de: { eyebrow: 'Blog & Guides', headline: 'Diskrete Begleiterinnen-Einblicke', tagline: 'Tipps, Guides, Nachrichten' },
  uk: { eyebrow: 'Блог', headline: 'Все про дискретні зустрічі', tagline: 'Поради, гайди, новини' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
