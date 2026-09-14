import { requireGirl } from '@/lib/auth';
import {
  getGirlWeekSchedule,
  getGirlWeekTotals,
  getGirlName,
} from '@/lib/studio-queries';

export const dynamic = 'force-dynamic';

const CZECH_DAYS_SHORT = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];

function getPragueDate(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }),
  );
}

function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const STYLES = `
  .week-schedule { padding: 16px 20px; }
  .ws-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .ws-nav {
    display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
  }
  .ws-nav-btn {
    padding: 6px 10px; border-radius: 6px;
    background: var(--bg-elev); border: 1px solid var(--line);
    color: var(--muted); font-size: 12px; font-weight: 600;
    text-decoration: none; cursor: pointer;
  }
  .ws-nav-btn:hover { color: var(--text); border-color: var(--dim); }
  .ws-nav-label { font-size: 12px; color: var(--dim); }

  .ws-day {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 0; border-bottom: 1px solid var(--line);
  }
  .ws-day-name { width: 28px; font-size: 12px; font-weight: 700; color: var(--muted); }
  .ws-day-name-today { color: var(--coral); }
  .ws-day-date { width: 24px; font-size: 12px; color: var(--dim); }
  .ws-day-date-today { color: var(--coral); font-weight: 700; }
  .ws-day-shift {
    flex: 1; font-size: 12px; padding: 6px 10px;
    border-radius: 6px;
  }
  .ws-day-shift-on { background: rgba(74,222,128,0.08); color: var(--green); }
  .ws-day-shift-off { background: rgba(0,0,0,0.15); color: var(--dim); }
  .ws-day-shift-today { border: 1px solid rgba(242,125,141,0.3); }
  .ws-day-count { font-size: 11px; font-weight: 700; color: var(--coral); width: 44px; text-align: right; }

  .ws-totals {
    margin-top: 16px; padding: 12px;
    background: var(--bg-elev); border-radius: 10px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .ws-total-label { font-size: 10px; color: var(--dim); text-transform: uppercase; font-weight: 600; }
  .ws-total-value-rez { font-size: 18px; font-weight: 800; color: var(--coral); }
  .ws-total-value-pts { font-size: 18px; font-weight: 800; color: var(--yellow); }
`;

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function StudioSchedulePage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await requireGirl();
  if (!user.girl_id) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: 'var(--red)' }}>Ucet neni propojen s profilem.</p>
      </div>
    );
  }

  const now = getPragueDate();
  const todayStr = toDateStr(now);

  let monday: Date;
  if (sp.week) {
    monday = new Date(sp.week + 'T12:00:00');
  } else {
    monday = getWeekMonday(now);
  }
  const mondayStr = toDateStr(monday);
  const sunday = addDays(monday, 6);
  const sundayStr = toDateStr(sunday);

  const prevMonday = toDateStr(addDays(monday, -7));
  const nextMonday = toDateStr(addDays(monday, 7));

  const [shifts, totals] = await Promise.all([
    getGirlWeekSchedule(user.girl_id, mondayStr),
    getGirlWeekTotals(user.girl_id, mondayStr, sundayStr),
  ]);

  const weekLabel = `${monday.getDate()}.${monday.getMonth() + 1}. - ${sunday.getDate()}.${sunday.getMonth() + 1}.${sunday.getFullYear()}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="week-schedule">
        <div className="ws-title">Rozvrh</div>
        <div className="ws-nav">
          <a href={`/studio/schedule?week=${prevMonday}`} className="ws-nav-btn">&larr;</a>
          <span className="ws-nav-label">{weekLabel}</span>
          <a href={`/studio/schedule?week=${nextMonday}`} className="ws-nav-btn">&rarr;</a>
        </div>

        {shifts.map((s) => {
          const isToday = s.date === todayStr;
          const hasShift = s.startTime !== '';
          const dateNum = new Date(s.date + 'T12:00:00').getDate();

          return (
            <div key={s.date} className="ws-day">
              <div className={`ws-day-name ${isToday ? 'ws-day-name-today' : ''}`}>
                {CZECH_DAYS_SHORT[s.dayOfWeek]}
              </div>
              <div className={`ws-day-date ${isToday ? 'ws-day-date-today' : ''}`}>
                {dateNum}
              </div>
              <div className={`ws-day-shift ${hasShift ? 'ws-day-shift-on' : 'ws-day-shift-off'} ${isToday && hasShift ? 'ws-day-shift-today' : ''}`}>
                {hasShift
                  ? `${s.startTime} - ${s.endTime}${s.locationName ? ` / ${s.locationName}` : ''}`
                  : 'Volno'}
              </div>
              <div className="ws-day-count">
                {s.bookingCount > 0 ? `${s.bookingCount} rez.` : ''}
              </div>
            </div>
          );
        })}

        <div className="ws-totals">
          <div>
            <div className="ws-total-label">Tento tyden</div>
            <div className="ws-total-value-rez">{totals.bookings} rez.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="ws-total-label">Body celkem</div>
            <div className="ws-total-value-pts">{totals.points.toLocaleString('cs-CZ')}</div>
          </div>
        </div>
      </div>
    </>
  );
}
