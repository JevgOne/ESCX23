import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminGirlFotkyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  let photos: { id: number; url: string; is_primary: number }[] = [];
  try {
    const result = await db.execute({
      sql: `SELECT id, url, is_primary FROM girl_photos WHERE girl_id = ? ORDER BY is_primary DESC, display_order ASC, id ASC`,
      args: [Number(id)],
    });
    photos = result.rows.map((r) => ({
      id: Number(r.id),
      url: String(r.url),
      is_primary: Number(r.is_primary),
    }));
  } catch (e) {
    console.error('[fotky] DB error:', e);
  }

  return (
    <>
      <AdminTopbar title={`Fotky — ${String(girl.name)}`} />
      <div style={{ marginBottom: '16px' }}>
        <a href={`/${locale}/admin/divky/${id}`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na detail dívky
        </a>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
        {photos.length} {photos.length === 1 ? 'fotka' : photos.length < 5 ? 'fotky' : 'fotek'}
      </div>
      <p style={{ color: '#f87171', marginBottom: '16px' }}>
        Upload se opravuje — tady je debug verze stránky.
      </p>
      <div className="photo-grid-admin">
        {photos.map((photo) => (
          <div key={photo.id} className={`photo-card-admin${photo.is_primary ? ' is-primary' : ''}`}>
            <img src={photo.url} alt="" loading="lazy" />
            {photo.is_primary === 1 && (
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--color-coral)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                HLAVNÍ
              </div>
            )}
          </div>
        ))}
        {photos.length === 0 && (
          <p style={{ color: 'var(--color-text-dim)', gridColumn: '1/-1' }}>Žádné fotky</p>
        )}
      </div>
    </>
  );
}
