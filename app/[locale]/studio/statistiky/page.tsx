import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioStatistikyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  // Fetch stats in parallel
  const [reviewsRes, bookingsRes, girlRes, photosRes, servicesRes] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(*) as cnt, ROUND(AVG(rating), 1) as avg_rating
            FROM reviews WHERE girl_id = ? AND status = 'approved'`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM bookings WHERE girl_id = ?`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT name, rating, reviews_count, created_at, status FROM girls WHERE id = ?`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT COUNT(*) as cnt FROM girl_photos WHERE girl_id = ?`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT COUNT(*) as cnt FROM girl_services WHERE girl_id = ?`,
      args: [girlId],
    }),
  ]);

  const reviewCount = Number(reviewsRes.rows[0]?.cnt ?? 0);
  const avgRating = Number(reviewsRes.rows[0]?.avg_rating ?? 0);
  const totalBookings = Number(bookingsRes.rows[0]?.total ?? 0);
  const completedBookings = Number(bookingsRes.rows[0]?.completed ?? 0);
  const girl = girlRes.rows[0];
  const photoCount = Number(photosRes.rows[0]?.cnt ?? 0);
  const serviceCount = Number(servicesRes.rows[0]?.cnt ?? 0);

  const memberSince = girl?.created_at
    ? new Date(String(girl.created_at)).toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' })
    : '—';

  const stats = [
    { label: 'Hodnocení', value: avgRating > 0 ? `★ ${avgRating.toFixed(1)}` : '—', accent: true },
    { label: 'Recenzí', value: String(reviewCount), accent: false },
    { label: 'Rezervací celkem', value: String(totalBookings), accent: false },
    { label: 'Dokončených', value: String(completedBookings), accent: false },
    { label: 'Fotek', value: String(photoCount), accent: false },
    { label: 'Služeb', value: String(serviceCount), accent: false },
  ];

  return (
    <>
      <StudioTopbar title="Statistiky" />

      <div className="studio-content">
        <p style={{ color: 'var(--color-text-dim)', fontSize: 13, marginBottom: 24 }}>
          Členka od {memberSince}
        </p>

        <div className="studio-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="studio-stat-card">
              <div className={`studio-stat-value${s.accent ? ' accent' : ''}`}>{s.value}</div>
              <div className="studio-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="studio-stats-tip">
          <strong>Tip:</strong> Více fotek a služeb = vyšší pozice ve vyhledávání.
          Odpovídej na recenze — klienti to ocení!
        </div>
      </div>
    </>
  );
}
