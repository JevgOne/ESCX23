import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getRecentApprovedReviews } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import { getCanonicalUrl, ogLocale } from '@/lib/seo/meta';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

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
  writeReview: string;
  noReviews: string;
  breadcrumb: string;
  stars: string;
  viewProfile: string;
}> = {
  cs: {
    h1: 'Recenze',
    sub: 'Anonymní hodnocení od skutečných klientů',
    writeReview: '+ Napsat recenzi',
    noReviews: 'Zatím žádné recenze.',
    breadcrumb: 'Recenze',
    stars: 'hvězd',
    viewProfile: 'Profil',
  },
  en: {
    h1: 'Reviews',
    sub: 'Anonymous ratings from real clients',
    writeReview: '+ Write a review',
    noReviews: 'No reviews yet.',
    breadcrumb: 'Reviews',
    stars: 'stars',
    viewProfile: 'Profile',
  },
  de: {
    h1: 'Bewertungen',
    sub: 'Anonyme Bewertungen von echten Kunden',
    writeReview: '+ Bewertung schreiben',
    noReviews: 'Noch keine Bewertungen.',
    breadcrumb: 'Bewertungen',
    stars: 'Sterne',
    viewProfile: 'Profil',
  },
  uk: {
    h1: 'Відгуки',
    sub: 'Анонімні оцінки від справжніх клієнтів',
    writeReview: '+ Написати відгук',
    noReviews: 'Відгуків поки що немає.',
    breadcrumb: 'Відгуки',
    stars: 'зірок',
    viewProfile: 'Профіль',
  },
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

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  return (
    <span className="review-stars" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? 'review-star filled' : 'review-star'}>★</span>
      ))}
    </span>
  );
}

export default async function RecenzePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = T[locale] ?? T.cs;
  const reviews = await getRecentApprovedReviews(50);

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
          {reviews.length === 0 ? (
            <div className="empty-state">
              <p>{t.noReviews}</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="review-card-head">
                    {review.girlPhoto && (
                      <Link href={`/${locale}/profil/${review.girlSlug}`} className="review-card-avatar">
                        <img
                          src={photoUrl(review.girlPhoto)}
                          alt={review.girlName}
                          width={48}
                          height={48}
                          loading="lazy"
                        />
                      </Link>
                    )}
                    <div className="review-card-meta">
                      <Link href={`/${locale}/profil/${review.girlSlug}`} className="review-card-name">
                        {review.girlName}
                      </Link>
                      <StarRating rating={review.rating} />
                    </div>
                    <Link
                      href={`/${locale}/recenze/nova/${review.girlSlug}`}
                      className="review-card-write"
                    >
                      {t.writeReview}
                    </Link>
                  </div>
                  <p className="review-card-text">{review.text}</p>
                  {review.clientNickname && (
                    <div className="review-card-author">— {review.clientNickname}</div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
