import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminGirlDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  const name = String(girl.name);
  const slug = String(girl.slug);
  const age = Number(girl.age);
  const status = String(girl.status);
  const primaryPhoto = girl.og_image ? String(girl.og_image) : null;
  const location = girl.location ? String(girl.location) : null;
  const height = girl.height ? Number(girl.height) : null;
  const weight = girl.weight ? Number(girl.weight) : null;
  const bust = girl.bust ? Number(girl.bust) : null;
  const rating = girl.rating ? Number(girl.rating) : null;
  const reviewsCount = Number(girl.reviews_count ?? 0);
  const bookingsCount = Number(girl.bookings_count ?? 0);
  const createdAt = girl.created_at ? String(girl.created_at) : null;
  const updatedAt = girl.updated_at ? String(girl.updated_at) : null;
  const isNew = Boolean(girl.is_new);
  const isTop = Boolean(girl.is_top);
  const isFeatured = Boolean(girl.is_featured);
  const verified = Boolean(girl.verified);

  const fields = [
    { label: 'ID', value: String(girl.id) },
    { label: 'Slug', value: slug },
    { label: 'Status', value: status },
    { label: 'Věk', value: `${age} let` },
    { label: 'Lokalita', value: location ?? '—' },
    { label: 'Výška', value: height ? `${height} cm` : '—' },
    { label: 'Váha', value: weight ? `${weight} kg` : '—' },
    { label: 'Postava', value: bust ? `${bust}` : '—' },
    { label: 'Hodnocení', value: rating ? rating.toFixed(1) : '—' },
    { label: 'Počet recenzí', value: String(reviewsCount) },
    { label: 'Počet rezervací', value: String(bookingsCount) },
    { label: 'Nová', value: isNew ? 'Ano' : 'Ne' },
    { label: 'Top', value: isTop ? 'Ano' : 'Ne' },
    { label: 'Featured', value: isFeatured ? 'Ano' : 'Ne' },
    { label: 'Verified', value: verified ? 'Ano' : 'Ne' },
    { label: 'Vytvořeno', value: createdAt ? new Date(createdAt).toLocaleString('cs-CZ') : '—' },
    { label: 'Upraveno', value: updatedAt ? new Date(updatedAt).toLocaleString('cs-CZ') : '—' },
  ];

  return (
    <>
      <AdminTopbar title={name} />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/divky" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam dívek
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px', alignItems: 'start' }}>
        <div>
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={name}
              style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', aspectRatio: '3/4' }}
            />
          ) : (
            <div style={{
              width: '100%',
              aspectRatio: '3/4',
              background: 'var(--color-bg-elev)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-dim)',
              fontSize: '13px',
            }}>
              Bez fotky
            </div>
          )}
        </div>

        <div>
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-coral)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Data profilu (read-only · edit v Phase 2)
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px' }}>
              {fields.map(({ label, value }) => (
                <>
                  <dt key={`dt-${label}`} style={{ fontSize: '12px', color: 'var(--color-text-dim)', fontWeight: 500 }}>{label}</dt>
                  <dd key={`dd-${label}`} style={{ fontSize: '13px', color: 'var(--color-text)' }}>{value}</dd>
                </>
              ))}
            </dl>
          </div>

          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-coral)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Akce
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href={`/cs/admin/divky/${String(girl.id)}/edit`} className="admin-btn-primary">Editovat profil</a>
              <a href={`/cs/admin/divky/${String(girl.id)}/dostupnost`} className="admin-btn-primary">Rozvrh dostupnosti</a>
              <a href={`/cs/admin/divky/${String(girl.id)}/fotky`} className="admin-btn-primary">Fotky</a>
              <a href={`/cs/profil/${slug}`} target="_blank" className="admin-btn-secondary">
                Zobrazit profil ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
