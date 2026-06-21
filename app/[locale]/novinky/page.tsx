import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import { buildOgImages } from '@/lib/seo/og';
import { getRecentActivity } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'novinky' });
  const canonical = getCanonicalUrl(locale, '/novinky');
  const ogImages = await buildOgImages('novinky', locale, '/novinky', t('h1'));

  return applyDBOverride(`/${locale}/novinky`, {
    title: t('h1') + ' | LovelyGirls',
    description: t('lead'),
    alternates: {
      canonical,
      languages: getAlternates('/novinky'),
    },
    openGraph: {
      images: ogImages,
      title: t('h1'),
      description: t('lead'),
      locale: ogLocale(locale),
      type: 'website',
    },
  });
}

const FILTER_KINDS = ['all', 'photo', 'video', 'review', 'apartment_review', 'profile_update'] as const;
type FilterKind = (typeof FILTER_KINDS)[number];

const ICON_MAP: Record<string, string> = {
  photo: '📷',
  video: '🎬',
  review: '⭐',
  apartment_review: '🏠',
  profile_update: '✨',
};

const KIND_CLASS: Record<string, string> = {
  photo: 'news-kind-photo',
  video: 'news-kind-video',
  review: 'news-kind-review',
  apartment_review: 'news-kind-apt',
  profile_update: 'news-kind-profile',
};

function formatDate(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      locale === 'cs' ? 'cs-CZ' : locale === 'de' ? 'de-DE' : locale === 'uk' ? 'uk-UA' : 'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );
  } catch {
    return dateStr;
  }
}

function smartTime(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return locale === 'cs' ? 'teď' : locale === 'de' ? 'jetzt' : locale === 'uk' ? 'зараз' : 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD <= 6) return `${diffD}d`;
  // Older than a week — show full date
  return formatDate(dateStr, locale);
}

export default async function NovinkyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'novinky' });
  const activeFilter: FilterKind = FILTER_KINDS.includes(sp.filter as FilterKind)
    ? (sp.filter as FilterKind)
    : 'all';

  const allItems = await getRecentActivity(50);
  const items = activeFilter === 'all'
    ? allItems
    : allItems.filter((item) => item.kind === activeFilter);

  const basePath = `/${locale}/novinky`;

  return (
    <>
      <Breadcrumbs
        items={[{ label: t('h1') }]}
        locale={locale}
      />
      <section className="section news-page">
        <div className="container">
          <div className="section-head">
            <h1 className="section-h2">{t('h1')}</h1>
            <p className="section-sub">{t('lead')}</p>
          </div>

          {/* Filter tabs — CSS-only, no JS needed */}
          <nav className="news-filters" aria-label="Filter">
            {FILTER_KINDS.map((kind) => (
              <a
                key={kind}
                href={kind === 'all' ? basePath : `${basePath}?filter=${kind}`}
                className={`news-filter-tab${activeFilter === kind ? ' active' : ''}`}
              >
                {kind !== 'all' && <span className="news-filter-icon">{ICON_MAP[kind]}</span>}
                {t(`filter_${kind}`)}
              </a>
            ))}
          </nav>

          {items.length === 0 ? (
            <div className="news-empty">
              <span className="news-empty-icon">🔍</span>
              <p>{t('empty')}</p>
            </div>
          ) : (
            <div className="news-timeline">
              {items.map((item, i) => {
                const isApt = item.kind === 'apartment_review';

                const content = (
                  <div className={`news-card ${KIND_CLASS[item.kind] ?? ''}`}>
                    <div className="news-card-left">
                      {isApt ? (
                        <div className="news-avatar news-avatar-apt">🏠</div>
                      ) : (
                        <img
                          src={photoUrl(item.girlPhoto)}
                          className="news-avatar"
                          alt={item.girlName}
                          loading="lazy"
                        />
                      )}
                      <div className="news-kind-badge">
                        {ICON_MAP[item.kind]}
                      </div>
                    </div>
                    <div className="news-card-body">
                      <div className="news-card-header">
                        <strong className="news-card-name">{isApt ? (item.locationName ?? '') : item.girlName}</strong>
                        <span className="news-card-time" title={formatDate(item.when, locale)}>
                          {smartTime(item.when, locale)}
                        </span>
                      </div>
                      <p className="news-card-text">
                        {item.kind === 'photo'
                          ? t('photo_text', { count: item.photoCount ?? 1 })
                          : item.kind === 'video'
                            ? t('video_text', { count: item.videoCount ?? 1 })
                            : item.kind === 'review'
                              ? t('review_text', { rating: item.rating ?? 5 })
                              : item.kind === 'apartment_review'
                                ? t('apartment_text', { location: item.locationName ?? '' })
                                : t('profile_text')}
                      </p>
                    </div>
                  </div>
                );

                if (isApt) {
                  return (
                    <NextLink key={i} href={`/${locale}/pobocka/${item.locationSlug ?? ''}`} className="news-card-link">
                      {content}
                    </NextLink>
                  );
                }

                return (
                  <Link key={i} href={{ pathname: '/profil/[slug]', params: { slug: item.girlSlug } }} className="news-card-link">
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
