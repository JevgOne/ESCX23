import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — About us';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'About us', headline: 'Verified, discreet, private', tagline: 'Personally checked companions · private apartments · Prague' },
  cs: { eyebrow: 'O nás', headline: 'Ověřeně, diskrétně, soukromě', tagline: 'Osobně ověřené společnice · soukromé apartmány · Praha' },
  de: { eyebrow: 'Über uns', headline: 'Verifiziert, diskret, privat', tagline: 'Persönlich geprüfte Begleiterinnen · Apartments · Prag' },
  uk: { eyebrow: 'Про нас', headline: 'Перевірено, конфіденційно', tagline: 'Особисто перевірені супутниці · приватні апартаменти' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
