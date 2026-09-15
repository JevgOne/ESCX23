/**
 * STUDIOFLOW — Locations Management (admin/manager only)
 */

import { requireBookingAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  await requireBookingAdmin();

  const result = await db.execute(
    `SELECT l.id, l.name, l.display_name, l.address, l.district, l.is_primary, l.is_active,
            (SELECT COUNT(DISTINCT gs.girl_id) FROM girl_schedules gs WHERE gs.location_id = l.id AND gs.is_active = 1) AS girl_count
     FROM locations l
     ORDER BY l.is_primary DESC, l.is_active DESC, l.name`
  );

  const locations = result.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.display_name ?? r.name),
    address: r.address ? String(r.address) : null,
    district: r.district ? String(r.district) : null,
    isPrimary: Number(r.is_primary) === 1,
    isActive: Number(r.is_active) === 1,
    girlCount: Number(r.girl_count),
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="lp-topbar">
        <span className="lp-topbar-title">Pobocky</span>
        <span className="lp-topbar-count">{locations.length} celkem</span>
      </div>

      <div className="lp-list">
        {locations.length === 0 && (
          <div className="lp-empty">Zadne pobocky.</div>
        )}
        {locations.map((loc) => (
          <div key={loc.id} className={`lp-row${!loc.isActive ? ' inactive' : ''}`}>
            <div className="lp-icon">{'\u{1F3E0}'}</div>
            <div className="lp-main">
              <div className="lp-name">
                {loc.name}
                {loc.isPrimary && <span className="lp-primary">Hlavni</span>}
                {!loc.isActive && <span className="lp-inactive">Neaktivni</span>}
              </div>
              <div className="lp-address">
                {loc.address ?? '—'}
                {loc.district ? ` · ${loc.district}` : ''}
              </div>
            </div>
            <div className="lp-girls">
              <span className="lp-girls-count">{loc.girlCount}</span>
              <span className="lp-girls-label">{loc.girlCount === 1 ? 'divka' : loc.girlCount < 5 ? 'divky' : 'divek'}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const STYLES = `
.lp-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: -24px -24px 0; padding: 12px 20px;
  background: var(--bg-soft); border-bottom: 1px solid var(--line);
}
.lp-topbar-title { font-size: 18px; font-weight: 700; }
.lp-topbar-count { font-size: 13px; color: var(--muted); }
.lp-list { margin: 0 -24px; }
.lp-empty { padding: 40px 20px; text-align: center; color: var(--dim); font-size: 14px; }
.lp-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-bottom: 1px solid var(--line);
}
.lp-row.inactive { opacity: 0.5; }
.lp-icon { font-size: 20px; flex-shrink: 0; }
.lp-main { flex: 1; min-width: 0; }
.lp-name { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.lp-primary {
  padding: 2px 6px; border-radius: 4px;
  background: rgba(242,125,141,0.15); color: var(--coral);
  font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.lp-inactive {
  padding: 2px 6px; border-radius: 4px;
  background: rgba(239,68,68,0.15); color: var(--red);
  font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.lp-address { font-size: 12px; color: var(--dim); margin-top: 2px; }
.lp-girls { text-align: center; flex-shrink: 0; min-width: 60px; }
.lp-girls-count { display: block; font-size: 18px; font-weight: 700; color: var(--coral); }
.lp-girls-label { font-size: 10px; color: var(--dim); text-transform: uppercase; }
`;
