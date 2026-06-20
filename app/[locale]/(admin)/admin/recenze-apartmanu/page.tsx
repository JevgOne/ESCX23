import { setRequestLocale } from 'next-intl/server';
import { getPendingApartmentReviews } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { approveApartmentReview, rejectApartmentReview, deleteApartmentReview } from '@/lib/apartment-review-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: 'var(--color-gold)', letterSpacing: '1px' }}>
      {'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'rgba(217,165,32,0.15)', text: '#d4a520' },
    approved: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80' },
    rejected: { bg: 'rgba(239,68,68,0.1)', text: '#fca5a5' },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      background: c.bg, color: c.text,
    }}>
      {status}
    </span>
  );
}

export default async function AdminApartmentReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const reviews = await getPendingApartmentReviews();
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  return (
    <>
      <AdminTopbar title="Recenze apartmánů" />

      <div style={{ marginBottom: '20px', fontSize: '13px', color: 'var(--color-text-dim)' }}>
        {pendingCount} {pendingCount === 1 ? 'recenze čeká' : pendingCount < 5 ? 'recenze čekají' : 'recenzí čeká'} na schválení
      </div>

      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-dim)', fontSize: '14px' }}>
          Žádné recenze apartmánů.
        </div>
      ) : (
        <div className="review-queue">
          {reviews.map((review) => (
            <div key={review.id} className="review-card-admin">
              <div className="review-card-admin-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <Stars rating={review.rating} />
                  <StatusBadge status={review.status} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
                    {relativeTime(review.createdAt)}
                  </span>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{review.authorName}</span>
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '12px', marginLeft: '8px' }}>
                    — {review.locationName}
                  </span>
                </div>

                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 8px' }}>
                  {review.content}
                </p>

                {(review.cleanliness != null || review.discretion != null || review.comfort != null) && (
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
                    {review.cleanliness != null && <span>Čistota: {review.cleanliness}/5</span>}
                    {review.discretion != null && <span>Diskrétnost: {review.discretion}/5</span>}
                    {review.comfort != null && <span>Komfort: {review.comfort}/5</span>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {review.status === 'pending' && (
                    <>
                      <form action={approveApartmentReview}>
                        <input type="hidden" name="id" value={review.id} />
                        <button type="submit" className="btn-admin btn-admin-green" style={{ fontSize: '12px', padding: '6px 14px' }}>
                          Schválit
                        </button>
                      </form>
                      <form action={rejectApartmentReview}>
                        <input type="hidden" name="id" value={review.id} />
                        <button type="submit" className="btn-admin btn-admin-red" style={{ fontSize: '12px', padding: '6px 14px' }}>
                          Zamítnout
                        </button>
                      </form>
                    </>
                  )}
                  <form action={deleteApartmentReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <button type="submit" className="btn-admin btn-admin-ghost" style={{ fontSize: '12px', padding: '6px 14px' }}>
                      Smazat
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
