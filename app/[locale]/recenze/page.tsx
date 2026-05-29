import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getRecentApprovedReviews, getReviewPageData } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import { getCanonicalUrl, ogLocale } from '@/lib/seo/meta';
import { relativeTime } from '@/lib/utils';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import TranslateButton from '@/components/ui/TranslateButton';

export const dynamic = 'force-dynamic';

const TITLES: Record<string, string> = {
  cs: 'Recenze',
  en: 'Reviews',
  de: 'Bewertungen',
  uk: 'Відгуки',
};

const DESCRIPTIONS: Record<string, string> = {
  cs: 'Skutečné recenze klientů na společnice LovelyGirls Praha. Anonymní hodnocení, zkušenosti a doporučení.',
  en: 'Real client reviews of LovelyGirls Prague companions. Anonymous ratings, experiences and recommendations.',
  de: 'Echte Kundenbewertungen der LovelyGirls Prag Begleiterinnen. Anonyme Bewertungen, Erfahrungen und Empfehlungen.',
  uk: 'Справжні відгуки клієнтів про супутниць LovelyGirls Прага. Анонімні оцінки, враження та рекомендації.',
};

const T: Record<string, {
  h1: string;
  sub: string;
  noReviews: string;
  breadcrumb: string;
  totalReviews: string;
  avgRating: string;
  filterAll: string;
  writeReview: string;
}> = {
  cs: {
    h1: 'Recenze',
    sub: 'Co o nás říkají klienti',
    noReviews: 'Zatím žádné recenze.',
    breadcrumb: 'Recenze',
    totalReviews: 'recenzí',
    avgRating: 'hodnocení',
    filterAll: 'Všechny',
    writeReview: 'Napsat recenzi',
  },
  en: {
    h1: 'Reviews',
    sub: 'What our clients say',
    noReviews: 'No reviews yet.',
    breadcrumb: 'Reviews',
    totalReviews: 'reviews',
    avgRating: 'rating',
    filterAll: 'All',
    writeReview: 'Write a review',
  },
  de: {
    h1: 'Bewertungen',
    sub: 'Was unsere Kunden sagen',
    noReviews: 'Noch keine Bewertungen.',
    breadcrumb: 'Bewertungen',
    totalReviews: 'Bewertungen',
    avgRating: 'Bewertung',
    filterAll: 'Alle',
    writeReview: 'Bewertung schreiben',
  },
  uk: {
    h1: 'Відгуки',
    sub: 'Що кажуть наші клієнти',
    noReviews: 'Відгуків поки що немає.',
    breadcrumb: 'Відгуки',
    totalReviews: 'відгуків',
    avgRating: 'оцінка',
    filterAll: 'Всі',
    writeReview: 'Написати відгук',
  },
};

const VIBE_EMOJI: Record<string, string> = {
  great: '😊',
  magical: '✨',
  unforgettable: '🔥',
  meh: '😐',
  nice: '💕',
};

const VIBE_LABELS: Record<string, Record<string, string>> = {
  great: { cs: 'Skvělý', en: 'Great', de: 'Großartig', uk: 'Чудовий' },
  magical: { cs: 'Magický', en: 'Magical', de: 'Magisch', uk: 'Магічний' },
  unforgettable: { cs: 'Nezapomenutelný', en: 'Unforgettable', de: 'Unvergesslich', uk: 'Незабутній' },
  meh: { cs: 'Průměrný', en: 'Average', de: 'Durchschnittlich', uk: 'Середній' },
  nice: { cs: 'Příjemný', en: 'Nice', de: 'Nett', uk: 'Приємний' },
};

const TAG_LABELS: Record<string, Record<string, string>> = {
  friendly: { cs: 'Přátelská', en: 'Friendly', de: 'Freundlich', uk: 'Дружня' },
  playful: { cs: 'Hravá', en: 'Playful', de: 'Verspielt', uk: 'Грайлива' },
  passionate: { cs: 'Vášnivá', en: 'Passionate', de: 'Leidenschaftlich', uk: 'Пристрасна' },
  relaxed: { cs: 'Uvolněná', en: 'Relaxed', de: 'Entspannt', uk: 'Розслаблена' },
  communicative: { cs: 'Komunikativní', en: 'Communicative', de: 'Kommunikativ', uk: 'Комунікативна' },
  intimate: { cs: 'Intimní', en: 'Intimate', de: 'Intim', uk: 'Інтимна' },
  gentle: { cs: 'Něžná', en: 'Gentle', de: 'Sanft', uk: 'Ніжна' },
  fun: { cs: 'Zábavná', en: 'Fun', de: 'Lustig', uk: 'Весела' },
  mysterious: { cs: 'Tajemná', en: 'Mysterious', de: 'Geheimnisvoll', uk: 'Загадкова' },
  professional: { cs: 'Profesionální', en: 'Professional', de: 'Professionell', uk: 'Професійна' },
  gfe: { cs: 'GFE', en: 'GFE', de: 'GFE', uk: 'GFE' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = getCanonicalUrl(locale, '/recenze');
  const { buildOgImages } = await import('@/lib/seo/og');
  const ogImages = await buildOgImages('recenze', locale, '/recenze', TITLES[locale] ?? TITLES.cs);

  return {
    title: TITLES[locale] ?? TITLES.cs,
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.cs,
    alternates: {
      canonical,
      languages: {
        cs: getCanonicalUrl('cs', '/recenze'),
        en: getCanonicalUrl('en', '/recenze'),
        de: getCanonicalUrl('de', '/recenze'),
        uk: getCanonicalUrl('uk', '/recenze'),
        'x-default': getCanonicalUrl('cs', '/recenze'),
      },
    },
    openGraph: {
      images: ogImages,
      title: TITLES[locale] ?? TITLES.cs,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.cs,
      url: canonical,
      locale: ogLocale(locale),
    },
  };
}

export default async function RecenzePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ girl?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = T[locale] ?? T.cs;
  const [reviews, pageData] = await Promise.all([
    getRecentApprovedReviews(200),
    getReviewPageData(),
  ]);

  const activeGirl = sp.girl ?? null;
  const filtered = activeGirl
    ? reviews.filter((r) => r.girlSlug === activeGirl)
    : reviews;

  return (
    <main>
      <Breadcrumbs items={[{ label: t.breadcrumb }]} locale={locale} />

      <section className="page-header">
        <div className="container">
          <h1>{t.h1}</h1>
          <p>{t.sub}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Stats bar */}
          <div className="rev-stats">
            <div className="rev-stat">
              <span className="rev-stat-value">{pageData.totalReviews}</span>
              <span className="rev-stat-label">{t.totalReviews}</span>
            </div>
            <div className="rev-stat">
              <span className="rev-stat-value">
                <span className="rev-stat-star">★</span> {pageData.avgRating}
              </span>
              <span className="rev-stat-label">{t.avgRating}</span>
            </div>
            <div className="rev-stat">
              <span className="rev-stat-value">{pageData.girlsWithReviews.length}</span>
              <span className="rev-stat-label">
                {locale === 'cs' ? 'hodnocených' : locale === 'de' ? 'bewertet' : locale === 'uk' ? 'оцінених' : 'rated'}
              </span>
            </div>
          </div>

          {/* Girl filter chips */}
          <div className="rev-filters">
            <Link
              href={`/${locale}/recenze`}
              className={`rev-chip ${!activeGirl ? 'active' : ''}`}
            >
              {t.filterAll}
            </Link>
            {pageData.girlsWithReviews.map((g) => (
              <Link
                key={g.slug}
                href={`/${locale}/recenze?girl=${g.slug}`}
                className={`rev-chip ${activeGirl === g.slug ? 'active' : ''}`}
              >
                {g.photo && (
                  <img src={photoUrl(g.photo)} alt="" className="rev-chip-img" />
                )}
                {g.name}
                <span className="rev-chip-count">{g.reviewCount}</span>
              </Link>
            ))}
          </div>

          {/* Reviews grid */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>{t.noReviews}</p>
            </div>
          ) : (
            <div className="rev-grid">
              {filtered.map((review) => {
                const full = Math.round(Math.max(0, Math.min(5, review.rating)));
                return (
                  <article key={review.id} className="rev-item">
                    <TranslateButton text={review.text} targetLocale={locale} />
                    <div className="rev-item-head">
                      <Link href={`/${locale}/profil/${review.girlSlug}`} className="rev-item-avatar">
                        {review.girlPhoto ? (
                          <img src={photoUrl(review.girlPhoto)} alt={review.girlName} />
                        ) : (
                          <span className="rev-item-avatar-letter">{review.girlName.charAt(0)}</span>
                        )}
                      </Link>
                      <div className="rev-item-info">
                        <Link href={`/${locale}/profil/${review.girlSlug}`} className="rev-item-girl">
                          {review.girlName}
                        </Link>
                        <div className="rev-item-meta">
                          {review.clientNickname && <span className="rev-item-author">{review.clientNickname}</span>}
                          <span className="rev-item-date">{relativeTime(review.createdAt)}</span>
                        </div>
                      </div>
                      <div className="rev-item-rating">
                        <span className="rev-item-stars">
                          {'★'.repeat(full)}
                          <span className="rev-item-stars-empty">{'★'.repeat(5 - full)}</span>
                        </span>
                      </div>
                    </div>
                    {review.vibe && VIBE_EMOJI[review.vibe] && (
                      <div className="rev-item-vibe">
                        <span className="rev-vibe-emoji">{VIBE_EMOJI[review.vibe]}</span>
                        <span className="rev-vibe-label">{VIBE_LABELS[review.vibe]?.[locale] ?? VIBE_LABELS[review.vibe]?.en ?? review.vibe}</span>
                      </div>
                    )}
                    <p className="rev-item-text">{review.text}</p>
                    {review.tags.length > 0 && (
                      <div className="rev-item-tags">
                        {review.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rev-tag">
                            {TAG_LABELS[tag]?.[locale] ?? TAG_LABELS[tag]?.en ?? tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
