import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getGirlsForListing, getTopServicesForFilter } from '@/lib/queries';
import GirlCardGrid from '@/components/girl/GirlCardGrid';
import FiltersBar from '@/components/divky/FiltersBar';
import Pagination from '@/components/divky/Pagination';
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
  const { getCustomOgImage } = await import('@/lib/seo/og');
  const _customOg_divky = await getCustomOgImage('divky');

  return {
    title: t('h1'),
    description: t('sub'),
    openGraph: {
      images: _customOg_divky ? [{ url: _customOg_divky, width: 1200, height: 630, alt: '' }] : undefined,
      title: t('h1'),
      description: t('sub'),
      url: canonical,
      locale: ogLocale(locale),
    },
  };
}

export default async function DivkyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'girls' });

  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 12;

  const { girls, total } = await getGirlsForListing({
    status: sp.status,
    q: sp.q,
    sort: sp.sort,
    service: sp.service,
    page,
    pageSize,
  });

  const services = await getTopServicesForFilter(12);

  const hasMore = page * pageSize < total;
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';
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
        <Pagination currentPage={page} hasMore={hasMore} searchParams={sp} locale={locale} />
      </div>
    </main>
  );
}
