import { renderOgImage, OG_SIZE } from '@/lib/seo/og-template';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Category';
export const size = OG_SIZE;
export const contentType = 'image/png';

const TAG_NAMES: Record<string, { cs: string; en: string; de: string; uk: string }> = {
  'blondynky-praha': { cs: 'Blondýnky Praha', en: 'Blondes Prague', de: 'Blondinen Prag', uk: 'Блондинки Прага' },
  'brunetky-praha': { cs: 'Brunetky Praha', en: 'Brunettes Prague', de: 'Brünette Prag', uk: 'Брюнетки Прага' },
  'cernovlasky-praha': { cs: 'Černovlásky Praha', en: 'Dark Hair Prague', de: 'Schwarzhaarige Prag', uk: 'Темноволосі Прага' },
  'gfe-praha': { cs: 'GFE Praha', en: 'GFE Prague', de: 'GFE Prag', uk: 'GFE Прага' },
  'studentky-praha': { cs: 'Studentky Praha', en: 'Students Prague', de: 'Studentinnen Prag', uk: 'Студентки Прага' },
  'spolecnice-praha': { cs: 'Společnice Praha', en: 'Companions Prague', de: 'Begleiterinnen Prag', uk: 'Супутниці Прага' },
  'prirodni-poprsi': { cs: 'Přírodní poprsí', en: 'Natural breasts', de: 'Natürliche Brüste', uk: 'Натуральний бюст' },
  'tetovani': { cs: 'Tetování', en: 'Tattooed', de: 'Tätowiert', uk: 'Татуйовані' },
  'fit-holky': { cs: 'Fit tělo', en: 'Fit body', de: 'Fit', uk: 'Підтягнуті' },
  'elegantni-holky': { cs: 'Elegantní společnice', en: 'Elegant companions', de: 'Elegant', uk: 'Елегантні' },
  'luxusni-sluzby': { cs: 'Luxusní služby', en: 'Luxury services', de: 'Luxus', uk: 'Люкс' },
  'ceske-holky': { cs: 'České společnice', en: 'Czech companions', de: 'Tschechisch', uk: 'Чеські' },
  'ukrajinske-holky': { cs: 'Ukrajinské společnice', en: 'Ukrainian companions', de: 'Ukrainisch', uk: 'Українські' },
};

const EYEBROW: Record<string, string> = {
  cs: 'Kategorie',
  en: 'Category',
  de: 'Kategorie',
  uk: 'Категорія',
};

const TAGLINE: Record<string, string> = {
  cs: 'Ověřené společnice · diskrétní apartmány · Praha',
  en: 'Verified companions · discreet apartments · Prague',
  de: 'Verifizierte Begleiterinnen · diskret · Prag',
  uk: 'Перевірені супутниці · дискретно · Прага',
};

export default async function OgImage({ params }: { params: { locale: string; slug: string } }) {
  const locale = params?.locale ?? 'en';
  const slug = params?.slug ?? '';
  const tag = TAG_NAMES[slug];
  const headline = tag ? (tag[locale as 'cs' | 'en' | 'de' | 'uk'] ?? tag.cs) : `#${slug}`;
  return renderOgImage({
    eyebrow: EYEBROW[locale] ?? EYEBROW.en,
    headline,
    tagline: TAGLINE[locale] ?? TAGLINE.en,
  });
}
