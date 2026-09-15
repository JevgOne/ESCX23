/**
 * STUDIOFLOW — Girls Management (admin/manager only)
 */

import { requireBookingAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const STATUS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Aktivni', bg: 'rgba(74,222,128,0.15)', color: 'var(--green)' },
  inactive: { label: 'Neaktivni', bg: 'rgba(251,191,36,0.15)', color: 'var(--yellow)' },
  hidden: { label: 'Skryta', bg: 'rgba(106,94,114,0.2)', color: 'var(--dim)' },
};

export default async function GirlsPage() {
  await requireBookingAdmin();

  const result = await db.execute(
    `SELECT g.id, g.name, g.age, g.status, g.rating, g.reviews_count, g.nationality,
            (SELECT COUNT(*) FROM girl_schedules WHERE girl_id = g.id AND is_active = 1) AS schedule_count,
            (SELECT COUNT(*) FROM bookings_v2 WHERE girl_id = g.id AND status = 'confirmed' AND date >= date('now')) AS upcoming_bookings
     FROM girls g
     ORDER BY CASE g.status WHEN 'active' THEN 1 WHEN 'inactive' THEN 2 ELSE 3 END, g.name`
  );

  const girls = result.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    age: Number(r.age),
    status: String(r.status),
    rating: r.rating ? Number(r.rating) : null,
    reviewsCount: Number(r.reviews_count ?? 0),
    nationality: r.nationality ? String(r.nationality) : null,
    scheduleCount: Number(r.schedule_count),
    upcomingBookings: Number(r.upcoming_bookings),
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="gp-topbar">
        <span className="gp-topbar-title">Divky</span>
        <span className="gp-topbar-count">{girls.length} celkem</span>
      </div>

      <div className="gp-list">
        {girls.map((g) => {
          const badge = STATUS_BADGES[g.status] ?? STATUS_BADGES.hidden;
          const initial = g.name.charAt(0).toUpperCase();

          return (
            <div key={g.id} className="gp-row">
              <div className="gp-avatar">{initial}</div>
              <div className="gp-main">
                <div className="gp-name">{g.name}</div>
                <div className="gp-meta">
                  {g.age} let{g.nationality ? ` · ${g.nationality}` : ''}
                </div>
              </div>
              <div className="gp-stats">
                {g.rating && (
                  <span className="gp-stat">{'\u2B50'} {g.rating.toFixed(1)}{g.reviewsCount > 0 ? ` (${g.reviewsCount})` : ''}</span>
                )}
                <span className="gp-stat">{'\u{1F4C5}'} {g.scheduleCount} smen</span>
                <span className="gp-stat">{'\u{1F4CB}'} {g.upcomingBookings} rez.</span>
              </div>
              <span className="gp-badge" style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

const STYLES = `
.gp-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: -24px -24px 0; padding: 12px 20px;
  background: var(--bg-soft); border-bottom: 1px solid var(--line);
}
.gp-topbar-title { font-size: 18px; font-weight: 700; }
.gp-topbar-count { font-size: 13px; color: var(--muted); }
.gp-list { margin: 0 -24px; }
.gp-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; border-bottom: 1px solid var(--line);
}
.gp-row:hover { background: rgba(242,125,141,0.04); }
.gp-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--bg-elev); border: 2px solid var(--coral);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; color: var(--coral); flex-shrink: 0;
}
.gp-main { flex: 1; min-width: 0; }
.gp-name { font-weight: 600; font-size: 14px; }
.gp-meta { font-size: 12px; color: var(--dim); }
.gp-stats { display: flex; gap: 14px; }
.gp-stat { font-size: 12px; color: var(--muted); white-space: nowrap; }
.gp-badge {
  padding: 3px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0;
}
@media (max-width: 768px) {
  .gp-stats { display: none; }
}
`;
