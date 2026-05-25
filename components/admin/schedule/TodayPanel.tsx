import { setTodayOff } from '@/app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions';
import { pragueDateISO, pragueDayOfWeek } from '@/lib/utils';
import { db } from '@/lib/db';

interface Props {
  girlId: number;
  locale: string;
}

const MONTH_NAMES_CS = [
  'ledna','února','března','dubna','května','června',
  'července','srpna','září','října','listopadu','prosince',
];
const DAY_NAMES_CS = ['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'];

async function getTodayResolved(girlId: number) {
  const today = pragueDateISO();
  const dow   = pragueDayOfWeek();

  const [exRes, schedRes] = await Promise.all([
    db.execute({
      sql: `SELECT exception_type, start_time, end_time FROM schedule_exceptions
            WHERE girl_id = ? AND date = ? LIMIT 1`,
      args: [girlId, today],
    }),
    db.execute({
      sql: `SELECT start_time, end_time FROM girl_schedules
            WHERE girl_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1`,
      args: [girlId, dow],
    }),
  ]);

  const ex  = exRes.rows[0]  ?? null;
  const sch = schedRes.rows[0] ?? null;

  return { today, dow, ex, sch };
}

export default async function TodayPanel({ girlId, locale }: Props) {
  const { today, dow, ex, sch } = await getTodayResolved(girlId);

  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const dayLabel = DAY_NAMES_CS[dow];
  const dayNum   = pragueNow.getDate();
  const month    = MONTH_NAMES_CS[pragueNow.getMonth()];
  const year     = pragueNow.getFullYear();

  let statusText = 'Žádný rozvrh';
  let statusClass = 'today-status-off';
  let timeRange: string | null = null;

  if (ex) {
    if (ex.exception_type === 'unavailable') {
      statusText = 'Volno (override)';
      statusClass = 'today-status-off';
    } else if (ex.exception_type === 'custom_hours') {
      statusText = 'Online (override)';
      statusClass = 'today-status-online';
      const f = ex.start_time ? String(ex.start_time).substring(0, 5) : null;
      const t = ex.end_time   ? String(ex.end_time).substring(0, 5) : null;
      if (f && t) timeRange = `${f} — ${t}`;
    }
  } else if (sch) {
    statusText = 'Online';
    statusClass = 'today-status-online';
    const f = sch.start_time ? String(sch.start_time).substring(0, 5) : null;
    const t = sch.end_time   ? String(sch.end_time).substring(0, 5) : null;
    if (f && t) timeRange = `${f} — ${t}`;
  } else {
    statusText = 'Volno (výchozí)';
    statusClass = 'today-status-off';
  }

  return (
    <div className="today-panel">
      <div className="today-panel-header">
        <span className="today-panel-label">DNES</span>
        <span className="today-panel-date">{dayLabel} {dayNum}. {month} {year}</span>
      </div>

      <div className={`today-panel-status ${statusClass}`}>
        <span className="today-status-dot" />
        <span className="today-status-text">{statusText}</span>
        {timeRange && (
          <span className="today-status-time">{timeRange}</span>
        )}
      </div>

      <div className="today-panel-actions">
        <a
          href={`/${locale}/admin/divky/${girlId}/dostupnost/den/${today}`}
          className="today-btn today-btn-primary"
        >
          Změnit dnes →
        </a>

        <form action={setTodayOff}>
          <input type="hidden" name="girl_id" value={girlId} />
          <button type="submit" className="today-btn today-btn-danger">
            Volno do konce dne
          </button>
        </form>
      </div>
    </div>
  );
}
