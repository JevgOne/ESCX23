import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getRecentApprovedReviews } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import { photoUrl } from '@/lib/photoUrl';

interface ReviewsStripProps {
  locale: string;
}

function avatarLetter(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function avatarHue(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export default async function ReviewsStrip({ locale }: ReviewsStripProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.reviews' });
  const reviews = await getRecentApprovedReviews(4);

  if (reviews.length === 0) return null;

  const fallbackClient =
    locale === 'cs' ? 'Klient'
    : locale === 'de' ? 'Gast'
    : locale === 'uk' ? 'Клієнт'
    : 'Guest';

  const reviewByLabel =
    locale === 'cs' ? 'recenze od'
    : locale === 'de' ? 'Rezension von'
    : locale === 'uk' ? 'відгук від'
    : 'review by';

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">— {t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>

        <div className="reviews-premium-list">
          {reviews.map((review) => {
            const reviewerName = review.clientNickname ?? fallbackClient;
            const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating ?? 5))));
            const hue = avatarHue(review.girlName);
            return (
              <article key={review.id} className="review-premium-card">
                <div className="rev-card-head">
                  <Link
                    href={{ pathname: '/profil/[slug]', params: { slug: review.girlSlug } }}
                    className="rev-card-avatar"
                    style={
                      review.girlPhoto
                        ? undefined
                        : { background: `linear-gradient(135deg, hsl(${hue}, 50%, 35%), hsl(${(hue + 30) % 360}, 60%, 25%))` }
                    }
                    aria-label={review.girlName}
                  >
                    {review.girlPhoto ? (
                      <img src={photoUrl(review.girlPhoto)} alt={review.girlName} />
                    ) : (
                      avatarLetter(review.girlName)
                    )}
                  </Link>
                  <div className="rev-card-author">
                    <Link
                      href={{ pathname: '/profil/[slug]', params: { slug: review.girlSlug } }}
                      className="rev-card-author-name rev-card-girl-link"
                    >
                      {review.girlName}
                    </Link>
                    <div className="rev-card-meta">
                      <span className="rev-card-reviewer">{reviewByLabel} <strong>{reviewerName}</strong></span>
                      <span> · {relativeTime(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="rev-card-stars">
                    {'★'.repeat(rating)}
                    <span className="rev-card-stars-empty">{'★'.repeat(5 - rating)}</span>
                  </div>
                </div>
                <p className="rev-card-text">
                  {review.text.length > 220 ? review.text.slice(0, 220) + '…' : review.text}
                </p>
              </article>
            );
          })}
        </div>

        <div className="reviews-premium-foot">
          <Link href="/divky" className="reviews-show-all">
            {t('show_all')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
