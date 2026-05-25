import { setRequestLocale } from 'next-intl/server';
import { getPendingPhotos } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import { relativeTime } from '@/lib/utils';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { approvePhoto, rejectPhoto } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminVerifikacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const photos = await getPendingPhotos();

  return (
    <>
      <AdminTopbar title="Verifikace fotek" />

      <div style={{ marginBottom: '20px', fontSize: '13px', color: 'var(--color-text-dim)' }}>
        {photos.length} {photos.length === 1 ? 'fotka čeká' : photos.length < 5 ? 'fotky čekají' : 'fotek čeká'} na schválení
      </div>

      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-dim)', fontSize: '14px' }}>
          Žádné fotky nečekají na schválení.
        </div>
      ) : (
        <div className="verify-queue">
          {photos.map((photo) => (
            <div key={photo.id} className="verify-card">
              <a href={`/cs/admin/divky/${photo.girlId}`} style={{ display: 'block' }}>
                <img
                  src={photoUrl(photo.thumbnailUrl ?? photo.url)}
                  alt={`Fotka — ${photo.girlName}`}
                  className="verify-card-img"
                />
              </a>
              <div className="verify-card-body">
                <div className="verify-card-meta">
                  <span style={{ fontWeight: 600 }}>{photo.girlName}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-dim)' }}>
                    /{photo.girlSlug}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
                  {relativeTime(photo.createdAt)}
                </div>
                <div className="verify-card-actions">
                  <form action={approvePhoto}>
                    <input type="hidden" name="id" value={photo.id} />
                    <button type="submit" className="verify-btn approve">
                      Schválit
                    </button>
                  </form>
                  <form action={rejectPhoto}>
                    <input type="hidden" name="id" value={photo.id} />
                    <button type="submit" className="verify-btn reject">
                      Zamítnout
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
