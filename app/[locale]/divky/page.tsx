import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getGirlsForListing, getTopServicesForFilter } from '@/lib/queries';
import GirlCardGrid from '@/components/girl/GirlCardGrid';
import FiltersBar from '@/components/divky/FiltersBar';
// Pagination removed — show all girls on one page
import PageHeader from '@/components/ui/PageHeader';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { collectionPageJsonLd, breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; q?: string; sort?: string; service?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'girls' });
  const canonical = getCanonicalUrl(locale, '/divky');
  const languages = getAlternates('/divky');
  const { buildOgImages } = await import('@/lib/seo/og');
  const ogImages = await buildOgImages('divky', locale, '/divky', t('h1'));

  return applyDBOverride(`/${locale}/divky`, {
    title: t('h1'),
    description: t('sub'),
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      images: ogImages,
      title: t('h1'),
      description: t('sub'),
      url: canonical,
      locale: ogLocale(locale),
    },
  });

}

export default async function DivkyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'girls' });

  const { girls, total } = await getGirlsForListing({
    status: sp.status,
    q: sp.q,
    sort: sp.sort,
    service: sp.service,
    page: 1,
    pageSize: 999,
  }).catch(() => ({ girls: [] as Awaited<ReturnType<typeof getGirlsForListing>>['girls'], total: 0 }));

  const services = await getTopServicesForFilter(12).catch(() => []);
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';
  const collectionSchema = collectionPageJsonLd(
    t('h1'),
    `${BASE}/divky`,
    girls.map((g) => g.slug)
  );

  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: tNav('girls'), url: getCanonicalUrl(locale, '/divky') },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <p data-geo-lead className="sr-only">{tGeo('divky_lead')}</p>
      <Breadcrumbs items={[{ label: tNav('girls') }]} locale={locale} />
      <PageHeader title={t('h1')} subtitle={t('sub')} />

      {/* Quick category chips → SEO landing pages */}
      <div className="container">
        <nav className="divky-quick-tags" aria-label={locale === 'cs' ? 'Kategorie' : 'Categories'}>
          {(() => {
            const items = [
              { slug: 'spolecnice-praha', cs: 'Společnice Praha', en: 'Companions', de: 'Begleiterinnen', uk: 'Супутниці' },
              { slug: 'blondynky-praha', cs: 'Blondýnky', en: 'Blondes', de: 'Blondinen', uk: 'Блондинки' },
              { slug: 'brunetky-praha', cs: 'Brunetky', en: 'Brunettes', de: 'Brünette', uk: 'Брюнетки' },
              { slug: 'gfe-praha', cs: 'GFE', en: 'GFE', de: 'GFE', uk: 'GFE' },
              { slug: 'studentky-praha', cs: 'Studentky', en: 'Students', de: 'Studentinnen', uk: 'Студентки' },
              { slug: 'cernovlasky-praha', cs: 'Černovlásky', en: 'Dark hair', de: 'Schwarzhaarig', uk: 'Темне волосся' },
              { slug: 'prirodni-poprsi', cs: 'Přírodní poprsí', en: 'Natural', de: 'Natürlich', uk: 'Натуральні' },
              { slug: 'fit-holky', cs: 'Fit', en: 'Fit', de: 'Fit', uk: 'Підтягнуті' },
              { slug: 'elegantni-holky', cs: 'Elegantní', en: 'Elegant', de: 'Elegant', uk: 'Елегантні' },
              { slug: 'luxusni-sluzby', cs: 'Luxus', en: 'Luxury', de: 'Luxus', uk: 'Люкс' },
            ];
            const prefix = locale === 'en' ? '' : `/${locale}`;
            return items.map((tag) => (
              <a
                key={tag.slug}
                href={`${prefix}/hashtag/${tag.slug}`}
                className="divky-quick-tag"
              >
                #{tag[locale as 'cs' | 'en' | 'de' | 'uk'] ?? tag.cs}
              </a>
            ));
          })()}
        </nav>
      </div>

      <FiltersBar
        searchParams={sp}
        searchPlaceholder={t('search_placeholder')}
        labelAll={t('filter.all')}
        labelAvailable={t('filter.available')}
        sortNewest={t('sort.newest')}
        sortName={t('sort.name')}
        sortAvailableFirst={t('sort.available_first')}
        labelFilter={locale === 'cs' ? 'Filtrovat' : locale === 'de' ? 'Filtern' : locale === 'uk' ? 'Фільтр' : 'Filter'}
        services={services}
        locale={locale}
      />
      <div className="container">
        <div className="filter-results-bar">
          <span>
            <strong>{girls.length}</strong> {t('results_count', { count: girls.length })}
          </span>
        </div>
        {girls.length === 0 ? (
          <p className="no-results">{t('no_results')}</p>
        ) : (
          <GirlCardGrid girls={girls} />
        )}
        {/* All girls shown on single page */}
      </div>
    </main>
  );
}
