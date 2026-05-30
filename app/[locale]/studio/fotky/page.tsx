import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireGirl } from '@/lib/auth';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Photo {
  id: number;
  url: string;
  is_primary: number;
}

async function getPhotos(girlId: number): Promise<Photo[]> {
  const result = await db.execute({
    sql: `SELECT id, url, is_primary FROM girl_photos WHERE girl_id = ? ORDER BY is_primary DESC, display_order ASC, id ASC`,
    args: [girlId],
  });
  return result.rows.map((r) => ({
    id: Number(r.id),
    url: String(r.url),
    is_primary: Number(r.is_primary),
  }));
}

export default async function StudioFotkyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;
  const photos = await getPhotos(girlId);

  return (
    <>
      <StudioTopbar title="Moje fotky" />

      <div className="studio-content">
        <div className="studio-readonly-note">
          Fotky spravuje agentura. Nové fotky posílej managementu ke schválení.
        </div>

        <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
          {photos.length} {photos.length === 1 ? 'fotka' : photos.length < 5 ? 'fotky' : 'fotek'}
        </div>

        <div className="upload-preview-grid">
          {photos.map((photo) => (
            <div key={photo.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4', background: 'var(--color-bg-elev)' }}>
              <img src={photo.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {photo.is_primary === 1 && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--color-coral)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                  Hlavní
                </div>
              )}
            </div>
          ))}
          {photos.length === 0 && (
            <p style={{ color: 'var(--color-text-dim)' }}>Zatím žádné fotky</p>
          )}
        </div>
      </div>
    </>
  );
}
