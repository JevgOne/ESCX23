import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { pragueDateISO, pragueDayOfWeek } from '@/lib/utils';
import { db } from '@/lib/db';
import { getSchedulesForGirl } from '@/lib/queries';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_LABELS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const MONTH_NAMES_GEN = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];

export default async function StudioDostupnostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  const today = pragueDateISO();
  const dow = pragueDayOfWeek();

  const [schedules, exRes, todaySchedRes] = await Promise.all([
    getSchedulesForGirl(girlId),
    db.execute({
      sql: `SELECT exception_type, start_time, end_time FROM schedule_exceptions WHERE girl_id = ? AND date = ? LIMIT 1`,
      args: [girlId, today],
    }),
    db.execute({
      sql: `SELECT start_time, end_time FROM girl_schedules WHERE girl_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1`,
      args: [girlId, dow],
    }),
  ]);

  // Today panel data
  const ex = exRes.rows[0] ?? null;
  const sch = todaySchedRes.rows[0] ?? null;

  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const dayLabel = DAY_LABELS[dow];
  const dayNum = pragueNow.getDate();
  const monthLabelGen = MONTH_NAMES_GEN[pragueNow.getMonth()];

  let statusText = 'Volno';
  let statusOnline = false;
  let timeRange: string | null = null;

  if (ex) {
    if (ex.exception_type === 'unavailable') {
      statusText = 'Volno (override)';
    } else if (ex.exception_type === 'custom_hours') {
      statusText = 'Online (override)';
      statusOnline = true;
      const f = ex.start_time ? String(ex.start_time).substring(0, 5) : null;
      const t = ex.end_time ? String(ex.end_time).substring(0, 5) : null;
      if (f && t) timeRange = `${f} — ${t}`;
    }
  } else if (sch) {
    statusText = 'Online';
    statusOnline = true;
    const f = sch.start_time ? String(sch.start_time).substring(0, 5) : null;
    const t = sch.end_time ? String(sch.end_time).substring(0, 5) : null;
    if (f && t) timeRange = `${f} — ${t}`;
  }

  // Weekly schedule map
  const schedMap: Record<number, { from: string; to: string; active: boolean }> = {};
  for (const s of schedules) {
    const d = Number(s.day_of_week);
    schedMap[d] = {
      from: s.start_time ? String(s.start_time).substring(0, 5) : '10:00',
      to:   s.end_time   ? String(s.end_time).substring(0, 5)   : '22:00',
      active: Boolean(s.is_active),
    };
  }

  return (
    <>
      <StudioTopbar title="Dostupnost" />

      <div className="studio-content">
        <div className="studio-readonly-note">
          Rozvrh spravuje agentura. Pokud potřebuješ změnu, kontaktuj management.
        </div>

        {/* Today */}
        <div className="studio-readonly-card" style={{ marginBottom: 24 }}>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Dnes</span>
            <span className="studio-readonly-value">{dayLabel} {dayNum}. {monthLabelGen}</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Status</span>
            <span className="studio-readonly-value">
              <span className={`studio-sched-dot ${statusOnline ? 'dot-on' : 'dot-off'}`} />
              {statusText}
              {timeRange && ` (${timeRange})`}
            </span>
          </div>
        </div>

        {/* Weekly */}
        <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-coral)', marginBottom: 12 }}>
          Týdenní rozvrh
        </h3>
        <div className="studio-readonly-card">
          {DAY_LABELS.map((dayLbl, i) => {
            const s = schedMap[i];
            const isActive = s?.active ?? false;
            return (
              <div key={i} className="studio-readonly-row">
                <span className="studio-readonly-label">{dayLbl}</span>
                <span className="studio-readonly-value">
                  {isActive ? (
                    <>
                      <span className="studio-sched-dot dot-on" />
                      {s.from} — {s.to}
                    </>
                  ) : (
                    <>
                      <span className="studio-sched-dot dot-off" />
                      Volno
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
