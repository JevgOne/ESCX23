import { setRequestLocale } from 'next-intl/server';
import { getPendingApartmentReviews } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { approveApartmentReview, rejectApartmentReview, deleteApartmentReview } from '@/lib/apartment-review-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
};

export default async function AdminApartmentReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);

  const reviews = await getPendingApartmentReviews(status);

  const counts = {
    all: (await getPendingApartmentReviews()).length,
    pending: (await getPendingApartmentReviews('pending')).length,
    approved: (await getPendingApartmentReviews('approved')).length,
    rejected: (await getPendingApartmentReviews('rejected')).length,
  };

  return (
    <>
      <AdminTopbar title="Recenze apartmánů" />

      {/* Status filter tabs */}
      <div className="apt-reviews-toolbar">
        <div className="apt-reviews-tabs">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <a
              key={s}
              href={`?status=${s}`}
              className={`apt-reviews-tab${(status === s || (!status && s === 'all')) ? ' active' : ''}`}
            >
              <span
                className="apt-reviews-tab-dot"
                style={{ background: s === 'all' ? 'var(--color-text-dim)' : STATUS_COLORS[s] }}
              />
              {s === 'all' ? 'Vše' : s === 'pending' ? 'Čekající' : s === 'approved' ? 'Schválené' : 'Zamítnuté'}
              <span className="apt-reviews-tab-count">{counts[s]}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="apt-reviews-empty">
          <span className="apt-reviews-empty-icon">⭐</span>
          <p>Žádné recenze{status && status !== 'all' ? ` se stavem "${status}"` : ''}.</p>
        </div>
      ) : (
        <div className="apt-reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="apt-review-card">
              {/* Header: stars + badge + time */}
              <div className="apt-review-header">
                <span className="apt-review-stars">
                  {'★'.repeat(review.rating)}{'☆'.repeat(Math.max(0, 5 - review.rating))}
                </span>
                <span className={`apt-review-badge ${review.status}`}>
                  {review.status === 'pending' ? 'Čeká' : review.status === 'approved' ? 'Schváleno' : 'Zamítnuto'}
                </span>
                <span className="apt-review-time">{relativeTime(review.createdAt)}</span>
              </div>

              {/* Author + location */}
              <div className="apt-review-author">
                <span className="apt-review-author-name">{review.authorName}</span>
                <span className="apt-review-author-location">— {review.locationName}</span>
              </div>

              {/* Review text */}
              <p className="apt-review-content">{review.content}</p>

              {/* Score bars */}
              {(review.cleanliness != null || review.discretion != null || review.comfort != null) && (
                <div className="apt-review-scores">
                  {review.cleanliness != null && (
                    <div className="apt-review-score-item">
                      <span>Čistota {review.cleanliness}/5</span>
                      <div className="apt-review-score-bar">
                        <div className="apt-review-score-fill" style={{ width: `${(review.cleanliness / 5) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {review.discretion != null && (
                    <div className="apt-review-score-item">
                      <span>Diskrétnost {review.discretion}/5</span>
                      <div className="apt-review-score-bar">
                        <div className="apt-review-score-fill" style={{ width: `${(review.discretion / 5) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {review.comfort != null && (
                    <div className="apt-review-score-item">
                      <span>Komfort {review.comfort}/5</span>
                      <div className="apt-review-score-bar">
                        <div className="apt-review-score-fill" style={{ width: `${(review.comfort / 5) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="apt-review-actions">
                {review.status === 'pending' && (
                  <>
                    <form action={approveApartmentReview} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={review.id} />
                      <button type="submit" className="apt-review-btn approve">Schválit</button>
                    </form>
                    <form action={rejectApartmentReview} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={review.id} />
                      <button type="submit" className="apt-review-btn reject">Zamítnout</button>
                    </form>
                  </>
                )}
                <form action={deleteApartmentReview} style={{ display: 'inline' }}>
                  <input type="hidden" name="id" value={review.id} />
                  <button type="submit" className="apt-review-btn delete">Smazat</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
