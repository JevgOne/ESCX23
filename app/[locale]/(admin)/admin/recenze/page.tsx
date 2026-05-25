import { setRequestLocale } from 'next-intl/server';
import { getPendingReviews } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import { relativeTime } from '@/lib/utils';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { approveReview, rejectReview } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Stars({ rating }: { rating: number | null }) {
  const n = rating ?? 0;
  return (
    <span style={{ color: 'var(--color-gold)', letterSpacing: '1px' }}>
      {'★'.repeat(n)}{'☆'.repeat(Math.max(0, 5 - n))}
    </span>
  );
}

export default async function AdminRecenzePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const reviews = await getPendingReviews();

  return (
    <>
      <AdminTopbar title="Recenze ke schválení" />

      <div style={{ marginBottom: '20px', fontSize: '13px', color: 'var(--color-text-dim)' }}>
        {reviews.length} {reviews.length === 1 ? 'recenze čeká' : reviews.length < 5 ? 'recenze čekají' : 'recenzí čeká'} na schválení
      </div>

      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-dim)', fontSize: '14px' }}>
          Žádné recenze nečekají na schválení.
        </div>
      ) : (
        <div className="review-queue">
          {reviews.map((review) => (
            <div key={review.id} className="review-card-admin">
              <div className="review-card-admin-girl">
                <img
                  src={photoUrl(review.girlPhoto)}
                  alt={review.girlName}
                  className="review-card-admin-thumb"
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{review.girlName}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-dim)' }}>
                    /{review.girlSlug}
                  </div>
                </div>
              </div>

              <div className="review-card-admin-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Stars rating={review.rating} />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{review.authorName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                    {relativeTime(review.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {review.content}
                </p>
              </div>

              <div className="review-card-admin-actions">
                <form action={approveReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <button type="submit" className="review-action-btn approve">
                    Schválit
                  </button>
                </form>
                <form action={rejectReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <button type="submit" className="review-action-btn reject">
                    Zamítnout
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
