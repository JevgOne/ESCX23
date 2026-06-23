import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { Link } from '@/i18n/navigation';
import { getGirlsForHashtag } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import GirlCardGrid from '@/components/girl/GirlCardGrid';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { getHashtagContent, HASHTAG_CONTENT } from '@/lib/seo/landing-content';
import { breadcrumbListJsonLd, faqPageJsonLd, itemListPeopleJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';

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

function localePrefix(locale: string): string {
  return locale === 'en' ? '' : `/${locale}`;
}

function hashtagUrl(locale: string, slug: string): string {
  return `${BASE}${localePrefix(locale)}/hashtag/${slug}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const title = getTitle(slug, locale);
  if (!title) return {};
  const content = getHashtagContent(slug);
  const lowered = title.toLowerCase();
  const fallbackDesc =
    locale === 'cs' ? `Společnice se zaměřením na ${lowered} v Praze. Ověřené profily, transparentní ceny, diskrétní apartmány.`
    : locale === 'de' ? `Begleiterinnen mit Schwerpunkt ${lowered} in Prag. Verifizierte Profile, transparente Preise.`
    : locale === 'uk' ? `Супутниці зі спеціалізацією ${lowered} у Празі. Перевірені профілі.`
    : `Companions specialising in ${lowered} in Prague. Verified profiles, transparent pricing.`;
  const description = content?.metaDesc[locale as 'cs' | 'en' | 'de' | 'uk'] ?? fallbackDesc;
  return applyDBOverride(`/${locale}/hashtag/${slug}`, {
    title,
    description,
    alternates: {
      canonical: hashtagUrl(locale, slug),
      languages: {
        en: hashtagUrl('en', slug),
        cs: hashtagUrl('cs', slug),
        de: hashtagUrl('de', slug),
        uk: hashtagUrl('uk', slug),
        'x-default': hashtagUrl('en', slug),
      },
    },
    openGraph: {
      title,
      description,
      url: hashtagUrl(locale, slug),
      type: 'website',
      locale: locale === 'cs' ? 'cs_CZ' : locale === 'de' ? 'de_DE' : locale === 'uk' ? 'uk_UA' : 'en_US',
    },
    robots: { index: !!content, follow: true },
  });

}

export default async function HashtagPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const title = getTitle(slug, locale);
  if (!title) notFound();

  const girls = await getGirlsForHashtag(slug).catch(() => []);
  const content = getHashtagContent(slug);

  const countLabel =
    locale === 'cs' ? 'společnic v Praze'
    : locale === 'de' ? 'Begleiterinnen in Prag'
    : locale === 'uk' ? 'супутниць у Празі'
    : 'companions in Prague';

  const noResultsLabel =
    locale === 'cs' ? 'Aktuálně žádné výsledky pro tento tag. Podívejte se na související kategorie níže.'
    : locale === 'de' ? 'Aktuell keine Ergebnisse. Schauen Sie sich verwandte Kategorien an.'
    : locale === 'uk' ? 'Наразі немає результатів. Перегляньте суміжні категорії.'
    : 'No results right now. See related categories below.';

  const girlsLabel = locale === 'cs' ? 'Dívky' : locale === 'de' ? 'Mädchen' : locale === 'uk' ? 'Дівчата' : 'Girls';
  const homeLabel = locale === 'cs' ? 'Domů' : locale === 'de' ? 'Start' : locale === 'uk' ? 'Головна' : 'Home';
  const relatedLabel = locale === 'cs' ? 'Související kategorie' : locale === 'de' ? 'Ähnliche Kategorien' : locale === 'uk' ? 'Суміжні категорії' : 'Related categories';
  const faqLabel = locale === 'cs' ? 'Časté dotazy' : locale === 'de' ? 'Häufige Fragen' : locale === 'uk' ? 'Часті питання' : 'FAQ';
  const ctaLabel = locale === 'cs' ? 'Zobrazit všechny společnice' : locale === 'de' ? 'Alle Begleiterinnen' : locale === 'uk' ? 'Усі супутниці' : 'View all companions';
  const scheduleLabel = locale === 'cs' ? 'Kdo dnes pracuje' : locale === 'de' ? 'Wer heute arbeitet' : locale === 'uk' ? 'Хто сьогодні працює' : 'Who works today';

  /* Build JSON-LD blocks */
  const url = hashtagUrl(locale, slug);
  const breadcrumbs = breadcrumbListJsonLd([
    { name: homeLabel, url: `${BASE}${localePrefix(locale)}/` },
    { name: girlsLabel, url: `${BASE}${localePrefix(locale)}/${locale === 'en' ? 'girls' : locale === 'de' ? 'maedchen' : locale === 'uk' ? 'divchata' : 'divky'}` },
    { name: title, url },
  ]);
  const collection = collectionPageJsonLd(
    title,
    url,
    girls.map((g) => g.slug),
  );
  const itemList = itemListPeopleJsonLd(
    girls.map((g) => ({
      slug: g.slug,
      name: g.name,
      url: `${BASE}${localePrefix(locale)}/${locale === 'en' ? 'profile' : 'profil'}/${g.slug}`,
      image: g.primaryPhoto ? photoUrl(g.primaryPhoto) : null,
    })),
    title,
  );
  const faqJsonLd = content && content.faq.length > 0
    ? faqPageJsonLd(content.faq.map((f) => ({
        q: f.q[locale as 'cs' | 'en' | 'de' | 'uk'] ?? f.q.cs,
        a: f.a[locale as 'cs' | 'en' | 'de' | 'uk'] ?? f.a.cs,
      })))
    : null;

  const introText = content?.intro[locale as 'cs' | 'en' | 'de' | 'uk'];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }}
      />
      {girls.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

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

      <div className="container">
        {introText && (
          <section className="lp-intro">
            <p>{introText}</p>
          </section>
        )}

        {girls.length > 0 ? (
          <section className="lp-grid-section">
            <GirlCardGrid girls={girls} />
            <div className="lp-cta-row">
              <Link href="/divky" className="lp-btn lp-btn-ghost">{ctaLabel} →</Link>
              <Link href="/rozvrh" className="lp-btn lp-btn-primary">{scheduleLabel} →</Link>
            </div>
          </section>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
            {noResultsLabel}
          </p>
        )}

        {/* Related hashtags */}
        {content && content.related.length > 0 && (
          <section className="lp-related">
            <h2 className="lp-h2">{relatedLabel}</h2>
            <div className="lp-related-chips">
              {content.related.map((relSlug) => {
                const relName = TAG_NAMES[relSlug];
                if (!relName) return null;
                const label = relName[locale as 'cs' | 'en' | 'de' | 'uk'] ?? relName.cs;
                return (
                  <a
                    key={relSlug}
                    href={`${localePrefix(locale)}/hashtag/${relSlug}`}
                    className="lp-related-chip"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* FAQ */}
        {content && content.faq.length > 0 && (
          <section className="lp-faq-section">
            <h2 className="lp-h2">{faqLabel}</h2>
            <div className="lp-faq-list">
              {content.faq.map((item, i) => (
                <details key={i} className="lp-faq-item">
                  <summary>{item.q[locale as 'cs' | 'en' | 'de' | 'uk'] ?? item.q.cs}</summary>
                  <p>{item.a[locale as 'cs' | 'en' | 'de' | 'uk'] ?? item.a.cs}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return Object.keys(HASHTAG_CONTENT).map((slug) => ({ slug }));
}
