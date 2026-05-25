import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { uploadPhotoForm, setPhotoAsPrimary, deletePhoto } from '@/lib/photo-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Photo {
  id: number;
  url: string;
  is_primary: number;
  display_order: number;
}

async function getPhotos(girlId: number): Promise<Photo[]> {
  const result = await db.execute({
    sql: `SELECT id, url, is_primary, display_order FROM girl_photos WHERE girl_id = ? ORDER BY is_primary DESC, display_order ASC, id ASC`,
    args: [girlId],
  });
  return result.rows.map((r) => ({
    id: Number(r.id),
    url: String(r.url),
    is_primary: Number(r.is_primary),
    display_order: Number(r.display_order),
  }));
}

export default async function AdminGirlFotkyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  const photos = await getPhotos(Number(id));

  async function handleUpload(formData: FormData) {
    'use server';
    formData.set('girl_id', id);
    formData.set('source', 'admin');
    await uploadPhotoForm(formData);
  }

  async function handleSetPrimary(formData: FormData) {
    'use server';
    const photoId = Number(formData.get('photo_id'));
    await setPhotoAsPrimary(photoId, Number(id));
  }

  async function handleDelete(formData: FormData) {
    'use server';
    const photoId = Number(formData.get('photo_id'));
    await deletePhoto(photoId, Number(id));
  }

  return (
    <>
      <AdminTopbar title={`Fotky — ${String(girl.name)}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/cs/admin/divky/${id}`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na detail dívky
        </a>
      </div>

      <div className="upload-form" style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-coral)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Nahrát fotku
        </div>
        <form action={handleUpload} className="upload-dropzone">
          <input type="file" name="photo" accept=".jpg,.jpeg,.png,.webp,.avif" required />
          <button type="submit" className="admin-btn-primary" style={{ marginTop: '12px' }}>
            Nahrát
          </button>
        </form>
        <p style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '8px' }}>
          Max 10 MB · JPG, PNG, WebP, AVIF
        </p>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
        {photos.length} {photos.length === 1 ? 'fotka' : photos.length < 5 ? 'fotky' : 'fotek'}
      </div>

      <div className="photo-grid-admin">
        {photos.map((photo) => (
          <div key={photo.id} className={`photo-card-admin${photo.is_primary ? ' is-primary' : ''}`}>
            <img src={photo.url} alt="" loading="lazy" />
            {photo.is_primary === 1 && (
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--color-coral)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                PRIMARY
              </div>
            )}
            <div className="photo-card-actions">
              {photo.is_primary !== 1 && (
                <form action={handleSetPrimary}>
                  <input type="hidden" name="photo_id" value={photo.id} />
                  <button type="submit" className="admin-btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    Nastavit jako hlavní
                  </button>
                </form>
              )}
              <form action={handleDelete}>
                <input type="hidden" name="photo_id" value={photo.id} />
                <button type="submit" className="admin-btn-danger" style={{ fontSize: '11px', padding: '4px 8px' }}>
                  Smazat
                </button>
              </form>
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <p style={{ color: 'var(--color-text-dim)', gridColumn: '1/-1' }}>Žádné fotky</p>
        )}
      </div>
    </>
  );
}
