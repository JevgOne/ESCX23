import { relativeTime } from '@/lib/utils';

interface Review {
  id: unknown;
  rating: unknown;
  content: unknown;
  author_name: unknown;
  created_at: unknown;
  reply?: unknown;
  reply_at?: unknown;
}

interface ProfilReviewsProps {
  reviews: Review[];
  totalCount: number;
  girlSlug: string;
  heading: string;
  showAllLabel: string;
  locale?: string;
  avgRating?: number;
  girlName?: string;
  girlPhoto?: string | null;
}

function avatarLetter(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function avatarHue(name: string): number {
  // Stable hue per name
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export default function ProfilReviews({
  reviews,
  totalCount,
  girlSlug,
  heading,
  showAllLabel,
  locale = 'cs',
  avgRating = 0,
  girlName = '',
  girlPhoto = null,
}: ProfilReviewsProps) {
  const L =
    locale === 'cs'
      ? {
          empty: 'Tato dívka zatím nemá žádné recenze.',
          beFirst: 'Buďte první kdo ji ohodnotí!',
          write: 'Napsat recenzi',
          basedOn: 'na základě',
          reviews: 'recenzí',
          recommend: 'doporučují',
          verified: 'Ověřená',
        }
      : locale === 'de'
      ? {
          empty: 'Diese Begleiterin hat noch keine Bewertungen.',
          beFirst: 'Seien Sie die Erste!',
          write: 'Bewertung schreiben',
          basedOn: 'basierend auf',
          reviews: 'Bewertungen',
          recommend: 'empfehlen',
          verified: 'Verifiziert',
        }
      : locale === 'uk'
      ? {
          empty: 'Ця супутниця ще не має відгуків.',
          beFirst: 'Будьте першим!',
          write: 'Написати відгук',
          basedOn: 'на основі',
          reviews: 'відгуків',
          recommend: 'рекомендують',
          verified: 'Перевірена',
        }
      : {
          empty: 'This companion has no reviews yet.',
          beFirst: 'Be the first to leave one!',
          write: 'Write review',
          basedOn: 'based on',
          reviews: 'reviews',
          recommend: 'recommend',
          verified: 'Verified',
        };

  const hasReviews = reviews.length > 0;

  // Distribution
  const buckets = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const n = Math.min(5, Math.max(1, Math.round(Number(r.rating ?? 0))));
    buckets[n - 1]++;
  });
  const recommendPct =
    hasReviews
      ? Math.round(((buckets[3] + buckets[4]) / reviews.length) * 100)
      : 0;
  const maxBucket = Math.max(1, ...buckets);

  const writeHref = `/${locale}/recenze/nova/${girlSlug}`;
  const showAllHref = `/${locale}/recenze?girl=${girlSlug}`;

  return (
    <section id="recenze" className="profile-section reviews-premium">
      <div className="reviews-premium-head">
        <h2 className="reviews-premium-h2">{heading}</h2>
        {hasReviews && (
          <a href={writeHref} className="btn btn-pink btn-sm reviews-premium-write">
            ✎ {L.write}
          </a>
        )}
      </div>

      {hasReviews && (
        <div className="reviews-summary">
          <div className="reviews-summary-rating">
            {girlPhoto && (
              <div className="reviews-summary-avatar">
                <img src={girlPhoto} alt={girlName} />
              </div>
            )}
            <div className="reviews-summary-num">{(avgRating || 0).toFixed(1)}</div>
            <div className="reviews-summary-stars">
              {'★'.repeat(Math.round(avgRating))}
              {'☆'.repeat(Math.max(0, 5 - Math.round(avgRating)))}
            </div>
            <div className="reviews-summary-meta">
              {L.basedOn} {totalCount} {L.reviews}
            </div>
            {recommendPct > 0 && (
              <div className="reviews-summary-recommend">
                <strong>{recommendPct}%</strong> {L.recommend}
              </div>
            )}
            <a href={writeHref} className="reviews-summary-write-btn">
              ✎ {L.write}
            </a>
          </div>
          <div className="reviews-summary-distribution">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = buckets[n - 1];
              const pct = Math.round((count / maxBucket) * 100);
              return (
                <div key={n} className="rev-bar-row">
                  <span className="rev-bar-label">
                    {n} <span className="rev-bar-star">★</span>
                  </span>
                  <div className="rev-bar-track">
                    <div className="rev-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="rev-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasReviews ? (
        <div className="review-empty">
          <div className="review-empty-icon">★</div>
          <p className="review-empty-text">{L.empty}<br />{L.beFirst}</p>
          <a href={writeHref} className="btn btn-pink">✎ {L.write}</a>
        </div>
      ) : (
        <>
          <div className="reviews-premium-list">
            {reviews.slice(0, 4).map((review) => {
              const fallbackClient = locale === 'cs' ? 'Klient' : locale === 'de' ? 'Gast' : locale === 'uk' ? 'Клієнт' : 'Guest';
              const name = String(review.author_name ?? fallbackClient);
              const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating ?? 5))));
              const hue = avatarHue(name);
              return (
                <article key={String(review.id)} className="review-premium-card">
                  <div className="rev-card-head">
                    <div
                      className="rev-card-avatar"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue}, 50%, 35%), hsl(${(hue + 30) % 360}, 60%, 25%))`,
                      }}
                    >
                      {avatarLetter(name)}
                    </div>
                    <div className="rev-card-author">
                      <div className="rev-card-author-name">
                        {name}
                        <span className="rev-card-verified" title={L.verified}>✓</span>
                      </div>
                      <div className="rev-card-meta">
                        {review.created_at ? relativeTime(String(review.created_at)) : ''}
                      </div>
                    </div>
                    <div className="rev-card-stars">
                      {'★'.repeat(rating)}
                      <span className="rev-card-stars-empty">{'★'.repeat(5 - rating)}</span>
                    </div>
                  </div>
                  <p className="rev-card-text">{String(review.content ?? '')}</p>
                  {String(review.reply ?? '') !== '' && (
                    <div className="rev-reply">
                      <div className="rev-reply-head">
                        {girlPhoto && (
                          <img src={girlPhoto} alt={girlName} className="rev-reply-avatar" />
                        )}
                        <span className="rev-reply-name">{girlName}</span>
                        {String(review.reply_at ?? '') !== '' && (
                          <span className="rev-reply-date">{relativeTime(String(review.reply_at))}</span>
                        )}
                      </div>
                      <p className="rev-reply-text">{String(review.reply)}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {totalCount > 4 && (
            <div className="reviews-premium-foot">
              <a href={showAllHref} className="reviews-show-all">
                {showAllLabel.replace('{count}', String(totalCount))}
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
