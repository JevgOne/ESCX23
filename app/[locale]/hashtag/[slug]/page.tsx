import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGirlsForHashtag } from '@/lib/queries';
import GirlCardGrid from '@/components/girl/GirlCardGrid';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const TAG_NAMES: Record<string, { cs: string; en: string; de: string; uk: string }> = {
  'blondynky-praha': { cs: 'Blondýnky Praha', en: 'Blondes Prague', de: 'Blondinen Prag', uk: 'Блондинки Прага' },
  'brunetky-praha': { cs: 'Brunetky Praha', en: 'Brunettes Prague', de: 'Brünette Prag', uk: 'Брюнетки Прага' },
  'cernovlasky-praha': { cs: 'Černovlásky Praha', en: 'Dark Hair Prague', de: 'Schwarzhaarige Prag', uk: 'Темноволосі Прага' },
  'gfe-praha': { cs: 'GFE — Girlfriend Experience Praha', en: 'GFE — Girlfriend Experience Prague', de: 'GFE Prag', uk: 'GFE Прага' },
  'girlfriend-experience': { cs: 'Girlfriend Experience', en: 'Girlfriend Experience', de: 'Girlfriend Experience', uk: 'Girlfriend Experience' },
  'prirodni-poprsi': { cs: 'Přírodní poprsí', en: 'Natural breasts', de: 'Natürliche Brüste', uk: 'Натуральний бюст' },
  'mlade-holky': { cs: 'Mladé společnice', en: 'Young companions', de: 'Junge Begleiterinnen', uk: 'Молоді супутниці' },
  'studentky-praha': { cs: 'Studentky Praha', en: 'Students Prague', de: 'Studentinnen Prag', uk: 'Студентки Прага' },
  'holky-praha': { cs: 'Společnice Praha', en: 'Companions Prague', de: 'Begleiterinnen Prag', uk: 'Супутниці Прага' },
  'spolecnice-praha': { cs: 'Společnice Praha', en: 'Companions Prague', de: 'Begleiterinnen Prag', uk: 'Супутниці Прага' },
  'ceske-holky': { cs: 'České společnice', en: 'Czech companions', de: 'Tschechische Begleiterinnen', uk: 'Чеські супутниці' },
  'ruske-holky': { cs: 'Ruské společnice', en: 'Russian companions', de: 'Russische Begleiterinnen', uk: 'Російські супутниці' },
  'ukrajinske-holky': { cs: 'Ukrajinské společnice', en: 'Ukrainian companions', de: 'Ukrainische Begleiterinnen', uk: 'Українські супутниці' },
  'tetovani': { cs: 'Tetování', en: 'Tattoos', de: 'Tattoos', uk: 'Татуювання' },
  'piercing-holky': { cs: 'Piercing', en: 'Piercing', de: 'Piercing', uk: 'Пірсинг' },
  'plne-rty': { cs: 'Plné rty', en: 'Full lips', de: 'Volle Lippen', uk: 'Повні губи' },
  'dlouhe-nohy': { cs: 'Dlouhé nohy', en: 'Long legs', de: 'Lange Beine', uk: 'Довгі ноги' },
  'fit-holky': { cs: 'Fit tělo', en: 'Fit body', de: 'Fitter Körper', uk: 'Підтягнуте тіло' },
  'stihla-postava': { cs: 'Štíhlá postava', en: 'Slim figure', de: 'Schlanke Figur', uk: 'Струнка фігура' },
  'krivky': { cs: 'Křivky', en: 'Curves', de: 'Kurven', uk: 'Форми' },
  'velka-prsa': { cs: 'Velká prsa', en: 'Big breasts', de: 'Große Brüste', uk: 'Великий бюст' },
  'kratke-vlasy': { cs: 'Krátké vlasy', en: 'Short hair', de: 'Kurze Haare', uk: 'Коротке волосся' },
  'dlouhe-vlasy': { cs: 'Dlouhé vlasy', en: 'Long hair', de: 'Langes Haar', uk: 'Довге волосся' },
  'milf-praha': { cs: 'MILF Praha', en: 'MILF Prague', de: 'MILF Prag', uk: 'MILF Прага' },
  'modre-oci': { cs: 'Modré oči', en: 'Blue eyes', de: 'Blaue Augen', uk: 'Блакитні очі' },
  'exoticke-krasky': { cs: 'Exotické krásky', en: 'Exotic beauties', de: 'Exotische Schönheiten', uk: 'Екзотичні красуні' },
  'luxusni-sluzby': { cs: 'Luxusní služby', en: 'Luxury services', de: 'Luxusleistungen', uk: 'Люкс послуги' },
  'elegantni-holky': { cs: 'Elegantní společnice', en: 'Elegant companions', de: 'Elegante Begleiterinnen', uk: 'Елегантні супутниці' },
  'sexy-holky': { cs: 'Sexy společnice', en: 'Sexy companions', de: 'Sexy Begleiterinnen', uk: 'Сексуальні супутниці' },
  'krasne-holky': { cs: 'Krásné společnice', en: 'Beautiful companions', de: 'Schöne Begleiterinnen', uk: 'Красиві супутниці' },
  'hot-holky-praha': { cs: 'Hot společnice Praha', en: 'Hot companions Prague', de: 'Heiße Begleiterinnen Prag', uk: 'Гарячі супутниці Прага' },
  'dokonale-telo': { cs: 'Dokonalé tělo', en: 'Perfect body', de: 'Perfekter Körper', uk: 'Ідеальне тіло' },
};

function getTitle(slug: string, locale: string): string | null {
  const meta = TAG_NAMES[slug];
  if (!meta) return null;
  return meta[locale as keyof typeof meta] ?? meta.cs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const title = getTitle(slug, locale);
  if (!title) return {};
  const lowered = title.toLowerCase();
  const description =
    locale === 'cs' ? `Společnice se zaměřením na ${lowered} v Praze.`
    : locale === 'de' ? `Begleiterinnen mit Schwerpunkt ${lowered} in Prag.`
    : locale === 'uk' ? `Супутниці зі спеціалізацією ${lowered} у Празі.`
    : `Companions specialising in ${lowered} in Prague.`;
  const brand =
    locale === 'cs' ? 'LovelyGirls Praha'
    : locale === 'de' ? 'LovelyGirls Prag'
    : locale === 'uk' ? 'LovelyGirls Прага'
    : 'LovelyGirls Prague';
  return {
    title: `${title} — ${brand}`,
    description,
    robots: { index: true, follow: true },
  };
}

export default async function HashtagPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const title = getTitle(slug, locale);
  if (!title) notFound();

  const girls = await getGirlsForHashtag(slug);

  const countLabel =
    locale === 'cs' ? 'společnic v Praze'
    : locale === 'de' ? 'Begleiterinnen in Prag'
    : locale === 'uk' ? 'супутниць у Празі'
    : 'companions in Prague';

  const noResultsLabel =
    locale === 'cs' ? 'Žádné výsledky pro tento tag.'
    : locale === 'de' ? 'Keine Ergebnisse für diesen Tag.'
    : locale === 'uk' ? 'Немає результатів для цього тегу.'
    : 'No results for this tag.';

  const girlsLabel = locale === 'cs' ? 'Dívky' : locale === 'de' ? 'Mädchen' : locale === 'uk' ? 'Дівчата' : 'Girls';

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: girlsLabel, href: `/${locale}/divky` },
          { label: `#${title}` },
        ]}
        locale={locale}
      />
      <div className="hashtag-page-header">
        <div className="container">
          <span className="hashtag-badge">#{slug}</span>
          <h1 className="hashtag-h1">{title}</h1>
          <p className="hashtag-subtitle">{girls.length} {countLabel}</p>
        </div>
      </div>
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        {girls.length > 0 ? (
          <GirlCardGrid girls={girls} />
        ) : (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
            {noResultsLabel}
          </p>
        )}
      </div>
    </main>
  );
}
