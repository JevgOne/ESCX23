import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Contact';
export const size = OG_SIZE;
export const contentType = 'image/png';

const T: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  en: { eyebrow: 'Contact', headline: 'WhatsApp · Telegram · Call', tagline: 'Reply within 5 min · discreet · 24/7 chat' },
  cs: { eyebrow: 'Kontakt', headline: 'Napište nám', tagline: 'WhatsApp · Telegram · telefon · odpovídáme do 5 min' },
  de: { eyebrow: 'Kontakt', headline: 'Schreiben Sie uns', tagline: 'WhatsApp · Telegram · Anruf · Antwort in 5 Min' },
  uk: { eyebrow: 'Контакт', headline: 'Напишіть нам', tagline: 'WhatsApp · Telegram · дзвінок · 5 хв' },
};

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = params?.locale ?? 'en';
  const c = T[locale] ?? T.en;
  return renderOgImage({ eyebrow: c.eyebrow, headline: c.headline, tagline: c.tagline });
}
