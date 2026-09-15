/**
 * STUDIOFLOW -- Weekly Schedule Overview (read-only)
 * Shows all girls' shifts in a 7-column Mon-Sun grid.
 * Week navigation via ?week=YYYY-MM-DD (Monday).
 */

import { getAllSchedulesGrouped } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne'];
const DAY_FULL = ['Pondeli', 'Utery', 'Streda', 'Ctvrtek', 'Patek', 'Sobota', 'Nedele'];

function getMonday(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getTodayDow(): number {
  const d = new Date();
  const day = d.getDay();
  return day === 0 ? 6 : day - 1; // Mon=0..Sun=6
}

interface Props {
  searchParams: Promise<{ week?: string; girl?: string }>;
}

export default async function BookingSchedulePage({ searchParams }: Props) {
  const { week, girl: girlFilter } = await searchParams;

  const monday = getMonday(week);
  const sunday = addDays(monday, 6);
  const prevWeek = toISO(addDays(monday, -7));
  const nextWeek = toISO(addDays(monday, 7));
  const todayISO = toISO(new Date());
  const mondayISO = toISO(monday);

  // Is current week?
  const isCurrentWeek = todayISO >= mondayISO && todayISO <= toISO(sunday);
  const todayDow = isCurrentWeek ? getTodayDow() : -1;

  const allData = await getAllSchedulesGrouped();
  const withSchedule = allData.filter((d) => d.schedules.length > 0);
  const filtered = girlFilter
    ? withSchedule.filter((d) => d.girlSlug === girlFilter)
    : withSchedule;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Header with week nav */}
      <div className="ws-header">
        <h2 className="ws-title">Rozvrh smen</h2>
        <div className="ws-nav">
          <a href={`/booking/schedule?week=${prevWeek}`} className="ws-nav-btn">&lsaquo;</a>
          <span className="ws-nav-range">
            {fmt(monday)} &ndash; {fmt(sunday)}{sunday.getFullYear()}
          </span>
          <a href={`/booking/schedule?week=${nextWeek}`} className="ws-nav-btn">&rsaquo;</a>
          {!isCurrentWeek && (
            <a href="/booking/schedule" className="ws-today-btn">Dnes</a>
          )}
        </div>
      </div>

      {/* Girl filter pills */}
      {withSchedule.length > 1 && (
        <div className="ws-filters">
          <a href={`/booking/schedule?week=${mondayISO}`} className={`ws-pill${!girlFilter ? ' active' : ''}`}>
            Vsechny ({withSchedule.length})
          </a>
          {withSchedule.map((d) => (
            <a
              key={d.girlId}
              href={`/booking/schedule?week=${mondayISO}&girl=${d.girlSlug}`}
              className={`ws-pill${girlFilter === d.girlSlug ? ' active' : ''}`}
            >
              <span className="ws-pill-dot" style={{ background: d.girlColor || 'var(--coral)' }} />
              {d.girlName}
            </a>
          ))}
        </div>
      )}

      {/* Desktop: table grid */}
      {filtered.length === 0 ? (
        <div className="ws-empty">Zadne rozvrhy.</div>
      ) : (
        <div className="ws-table">
          {/* Column headers */}
          <div className="ws-row ws-row-head">
            <div className="ws-cell ws-cell-name">Divka</div>
            {DAY_NAMES.map((dn, i) => (
              <div
                key={i}
                className={`ws-cell ws-cell-day${i === todayDow ? ' ws-today' : ''}`}
              >
                <span className="ws-day-label">{dn}</span>
                <span className="ws-day-date">{fmt(addDays(monday, i))}</span>
              </div>
            ))}
          </div>

          {/* Girl rows */}
          {filtered.map((girl) => {
            const byDay = new Map<number, typeof girl.schedules>();
            for (const s of girl.schedules) {
              const arr = byDay.get(s.day_of_week) ?? [];
              arr.push(s);
              byDay.set(s.day_of_week, arr);
            }
            const col = girl.girlColor || 'var(--coral)';

            return (
              <div key={girl.girlId} className="ws-row">
                <div className="ws-cell ws-cell-name">
                  <div className="ws-avatar" style={{ background: col }}>
                    {girl.girlPhoto ? (
                      <img src={girl.girlPhoto} alt={girl.girlName} />
                    ) : (
                      girl.girlName.charAt(0)
                    )}
                  </div>
                  <span className="ws-girl-name">{girl.girlName}</span>
                </div>
                {Array.from({ length: 7 }, (_, i) => {
                  const shifts = byDay.get(i);
                  const isOff = !shifts || shifts.length === 0;
                  return (
                    <div
                      key={i}
                      className={`ws-cell ws-cell-day${isOff ? ' ws-off' : ' ws-on'}${i === todayDow ? ' ws-today' : ''}`}
                      style={!isOff ? { borderTop: `2px solid ${col}` } : undefined}
                    >
                      {isOff ? (
                        <span className="ws-dash">&mdash;</span>
                      ) : (
                        shifts.map((s, si) => (
                          <div key={si} className="ws-shift">
                            <span className="ws-shift-time">
                              {s.start_time?.substring(0, 5)}&ndash;{s.end_time?.substring(0, 5)}
                            </span>
                            {s.location_name && (
                              <span className="ws-shift-loc">{s.location_name}</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile: cards */}
      <div className="ws-mobile">
        {filtered.map((girl) => {
          const byDay = new Map<number, typeof girl.schedules>();
          for (const s of girl.schedules) {
            const arr = byDay.get(s.day_of_week) ?? [];
            arr.push(s);
            byDay.set(s.day_of_week, arr);
          }
          const col = girl.girlColor || 'var(--coral)';
          const activeDays = Array.from({ length: 7 }, (_, i) => ({ i, shifts: byDay.get(i) }))
            .filter((d) => d.shifts && d.shifts.length > 0);

          if (activeDays.length === 0) return null;

          return (
            <div key={girl.girlId} className="ws-card">
              <div className="ws-card-head">
                <div className="ws-avatar" style={{ background: col }}>
                  {girl.girlPhoto ? (
                    <img src={girl.girlPhoto} alt={girl.girlName} />
                  ) : (
                    girl.girlName.charAt(0)
                  )}
                </div>
                <div>
                  <div className="ws-girl-name">{girl.girlName}</div>
                  <div className="ws-card-meta">{activeDays.length} dnu / tyden</div>
                </div>
              </div>
              <div className="ws-card-shifts">
                {activeDays.map(({ i, shifts }) => (
                  <div key={i} className={`ws-card-row${i === todayDow ? ' ws-card-today' : ''}`}>
                    <span className="ws-card-day" style={{ background: col }}>
                      {DAY_FULL[i]?.substring(0, 2)}
                    </span>
                    <div className="ws-card-times">
                      {shifts!.map((s, si) => (
                        <span key={si} className="ws-card-time">
                          {s.start_time?.substring(0, 5)}&ndash;{s.end_time?.substring(0, 5)}
                          {s.location_name && (
                            <span className="ws-card-loc"> {s.location_name}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const STYLES = `
/* ── Week Schedule ── */
.ws-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
}
.ws-title {
  font-size: 20px; font-weight: 700; color: var(--text); margin: 0;
}
.ws-nav {
  display: flex; align-items: center; gap: 8px;
}
.ws-nav-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); text-decoration: none;
  font-size: 18px; font-weight: 700;
  transition: all 0.15s;
}
.ws-nav-btn:hover { color: var(--coral); border-color: var(--coral); }
.ws-nav-range {
  font-size: 14px; font-weight: 600; color: var(--text);
  min-width: 160px; text-align: center;
}
.ws-today-btn {
  padding: 5px 12px; border-radius: 6px;
  background: rgba(242,125,141,0.12); color: var(--coral);
  font-size: 12px; font-weight: 600; text-decoration: none;
  border: 1px solid rgba(242,125,141,0.25);
  transition: all 0.15s;
}
.ws-today-btn:hover { background: rgba(242,125,141,0.2); }

/* Filters */
.ws-filters {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px;
}
.ws-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 999px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); font-size: 12px; font-weight: 500;
  text-decoration: none; transition: all 0.15s;
}
.ws-pill:hover { border-color: var(--coral); color: var(--text); }
.ws-pill.active {
  background: rgba(242,125,141,0.12); border-color: var(--coral);
  color: var(--coral); font-weight: 600;
}
.ws-pill-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}

/* Table (desktop) */
.ws-table {
  border: 1px solid var(--line); border-radius: 12px;
  overflow: hidden; background: var(--bg-elev);
}
.ws-row {
  display: grid;
  grid-template-columns: 140px repeat(7, 1fr);
  border-bottom: 1px solid var(--line);
}
.ws-row:last-child { border-bottom: none; }
.ws-row-head { background: rgba(0,0,0,0.15); }
.ws-row:not(.ws-row-head):hover { background: rgba(242,125,141,0.02); }

.ws-cell {
  padding: 10px 6px; text-align: center;
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 4px; min-height: 56px;
}
.ws-cell:last-child { border-right: none; }

.ws-cell-name {
  flex-direction: row; justify-content: flex-start; gap: 8px;
  padding-left: 12px; text-align: left;
}
.ws-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
  overflow: hidden;
}
.ws-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ws-girl-name { font-size: 13px; font-weight: 600; color: var(--text); }

.ws-cell-day { min-height: 56px; }
.ws-day-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--dim);
}
.ws-day-date { font-size: 10px; color: var(--dim); }
.ws-today { background: rgba(242,125,141,0.06); }
.ws-today .ws-day-label { color: var(--coral); }
.ws-today .ws-day-date { color: var(--coral); }

.ws-off { opacity: 0.35; }
.ws-on { background: rgba(242,125,141,0.03); }
.ws-dash { font-size: 11px; color: var(--dim); }

.ws-shift { display: flex; flex-direction: column; gap: 1px; }
.ws-shift-time {
  font-size: 12px; font-family: ui-monospace, monospace;
  color: var(--text); font-weight: 500;
}
.ws-shift-loc {
  font-size: 9px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ws-empty {
  padding: 48px 20px; text-align: center;
  color: var(--dim); font-size: 14px;
  border: 1px dashed var(--line); border-radius: 12px;
  background: var(--bg-elev);
}

/* Mobile cards (hidden on desktop) */
.ws-mobile { display: none; }

.ws-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 12px; overflow: hidden; margin-bottom: 12px;
}
.ws-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
}
.ws-card-meta { font-size: 11px; color: var(--dim); }
.ws-card-shifts { padding: 0; }
.ws-card-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(42,34,48,0.3);
}
.ws-card-row:last-child { border-bottom: none; }
.ws-card-today { background: rgba(242,125,141,0.06); }
.ws-card-day {
  display: flex; align-items: center; justify-content: center;
  min-width: 32px; height: 24px; border-radius: 6px;
  font-size: 10px; font-weight: 800; color: #fff;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.ws-card-times {
  display: flex; flex-direction: column; gap: 2px;
}
.ws-card-time {
  font-size: 13px; font-family: ui-monospace, monospace;
  font-weight: 500; color: var(--text);
}
.ws-card-loc { font-size: 10px; color: var(--dim); font-family: inherit; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .ws-table { display: none; }
  .ws-mobile { display: block; }
  .ws-header { flex-direction: column; align-items: stretch; gap: 10px; }
  .ws-nav { justify-content: center; }
  .ws-filters { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
}
`;
