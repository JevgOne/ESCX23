import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getReviewsForStudio } from '@/lib/queries';
import { replyToReview } from '@/lib/studio-actions';
import { relativeTime } from '@/lib/utils';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioRecenzePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ replied?: string; error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;
  const reviews = await getReviewsForStudio(girlId);

  return (
    <>
      <StudioTopbar title={`Recenze (${reviews.length})`} />

      <div className="studio-content">
        {sp.replied === '1' && (
          <div className="studio-alert studio-alert-ok">Odpověď uložena!</div>
        )}
        {sp.error === 'empty' && (
          <div className="studio-alert studio-alert-err">Odpověď nemůže být prázdná.</div>
        )}

        {reviews.length === 0 ? (
          <div className="studio-empty">
            <div className="studio-empty-icon">★</div>
            <p>Zatím nemáš žádné recenze.</p>
          </div>
        ) : (
          <div className="studio-reviews-list">
            {reviews.map((review) => {
              const stars = Math.min(5, Math.max(1, Math.round(review.rating)));
              return (
                <div key={review.id} className="studio-review-card">
                  <div className="studio-review-head">
                    <div className="studio-review-stars">
                      {'★'.repeat(stars)}
                      <span className="studio-review-stars-empty">{'★'.repeat(5 - stars)}</span>
                    </div>
                    <span className="studio-review-author">{review.authorName}</span>
                    <span className="studio-review-date">{relativeTime(review.createdAt)}</span>
                  </div>
                  <p className="studio-review-text">{review.content}</p>

                  {review.reply ? (
                    <div className="studio-review-reply-existing">
                      <div className="studio-review-reply-label">Tvoje odpověď:</div>
                      <p className="studio-review-reply-text">{review.reply}</p>
                      {review.replyAt && (
                        <span className="studio-review-reply-date">{relativeTime(review.replyAt)}</span>
                      )}
                    </div>
                  ) : (
                    <details className="studio-review-reply-form">
                      <summary className="studio-review-reply-btn">Odpovědět</summary>
                      <form action={replyToReview}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <textarea
                          name="reply"
                          placeholder="Napiš odpověď na recenzi..."
                          rows={3}
                          required
                          className="studio-input studio-textarea"
                        />
                        <button type="submit" className="btn btn-pink btn-sm" style={{ marginTop: 8 }}>
                          Odeslat odpověď
                        </button>
                      </form>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
