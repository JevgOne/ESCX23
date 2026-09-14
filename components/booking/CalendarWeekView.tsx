/**
 * STUDIOFLOW — Calendar Week View (Server Component)
 * Girl x Day grid with mini booking cells.
 * Status-based color coding: green=CONFIRMED, yellow=DRAFT, orange=PENDING, grey=COMPLETED.
 * Matches mockup 02-calendar-week.html with girl colors per row.
 */

import type { CalendarGirl, CalendarBooking } from '@/lib/booking-queries';

const GIRL_COLORS: Record<string, string> = {
  Aneta: '#4ade80', Caty: '#fbbf24', Eliska: '#c084fc',
  Emily: '#f27d8d', Kim: '#fb923c', Luna: '#60a5fa',
  Natalie: '#2dd4bf', Nika: '#a78bfa', Nina: '#f9a8d4',
};
const DEFAULT_COLOR = '#a89cb0';

function getStatusColorClass(status: string, isDraft: boolean): string {
  if (isDraft) return 'cal-wg-status-draft';
  switch (status) {
    case 'confirmed':
    case 'in_progress':
      return 'cal-wg-status-confirmed';
    case 'pending':
      return 'cal-wg-status-pending';
    case 'completed':
      return 'cal-wg-status-completed';
    case 'no_show':
      return 'cal-wg-status-noshow';
    default:
      return 'cal-wg-status-confirmed';
  }
}

interface Props {
  girls: CalendarGirl[];
  bookings: CalendarBooking[];
  weekDays: { date: string; label: string; dayNum: number; isToday: boolean }[];
}

export default function CalendarWeekView({ girls, bookings, weekDays }: Props) {
  // Group bookings by girlId+date
  const bookingMap = new Map<string, CalendarBooking[]>();
  for (const b of bookings) {
    const key = `${b.girlId}-${b.date}`;
    const arr = bookingMap.get(key) ?? [];
    arr.push(b);
    bookingMap.set(key, arr);
  }

  // Per-girl totals
  const girlTotals = new Map<number, { count: number; points: number }>();
  for (const b of bookings) {
    if (b.isDraft) continue;
    const t = girlTotals.get(b.girlId) ?? { count: 0, points: 0 };
    t.count++;
    t.points += b.pointsEarned;
    girlTotals.set(b.girlId, t);
  }

  // Per-day totals
  const dayTotals = new Map<string, { count: number; points: number }>();
  for (const b of bookings) {
    if (b.isDraft) continue;
    const t = dayTotals.get(b.date) ?? { count: 0, points: 0 };
    t.count++;
    t.points += b.pointsEarned;
    dayTotals.set(b.date, t);
  }

  // Grand total
  let grandCount = 0, grandPoints = 0;
  for (const t of dayTotals.values()) {
    grandCount += t.count;
    grandPoints += t.points;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WEEK_VIEW_STYLES }} />
      <div className="cal-week-grid" style={{ gridTemplateColumns: `100px repeat(${weekDays.length}, 1fr) 70px` }}>
        {/* Header row */}
        <div className="cal-wg-header cal-wg-corner">Divka</div>
        {weekDays.map((d) => (
          <a
            key={d.date}
            href={`/booking/calendar?date=${d.date}&view=day`}
            className={`cal-wg-header${d.isToday ? ' today' : ''}`}
          >
            <span>{d.label}</span>
            <div className="cal-wg-daynum">{d.dayNum}</div>
          </a>
        ))}
        <div className="cal-wg-header cal-wg-corner">Body</div>

        {/* Girl rows */}
        {girls.map((girl) => {
          const girlColor = GIRL_COLORS[girl.name] ?? DEFAULT_COLOR;
          const total = girlTotals.get(girl.id);

          return [
            /* Girl name cell */
            <div key={`g-${girl.id}`} className="cal-wg-girl">
              <div className="cal-wg-girl-av" style={{ background: girlColor }}>
                {girl.photoUrl
                  ? <img src={girl.photoUrl} alt={girl.name} width={24} height={24} />
                  : girl.name.charAt(0)
                }
              </div>
              <span className="cal-wg-girl-nm">{girl.name}</span>
            </div>,

            /* Day cells */
            ...weekDays.map((d) => {
              const key = `${girl.id}-${d.date}`;
              const dayBookings = bookingMap.get(key) ?? [];

              return (
                <div key={`c-${girl.id}-${d.date}`} className="cal-wg-cell">
                  {dayBookings.map((b) => {
                    const statusCls = getStatusColorClass(b.status, b.isDraft);
                    const href = b.isDraft
                      ? undefined
                      : `/booking/calendar?date=${d.date}&view=day&detail=${b.id}`;
                    return href ? (
                      <a
                        key={`${b.isDraft ? 'd' : 'b'}-${b.id}`}
                        href={href}
                        className={`cal-wg-mini ${statusCls}`}
                      >
                        <span className="cal-wg-mini-t">{b.startTime}</span>
                        {' '}
                        <span className="cal-wg-mini-d">{b.durationMinutes}m</span>
                        {' '}
                        <span className="cal-wg-mini-n">{b.clientNickname}</span>
                      </a>
                    ) : (
                      <span
                        key={`d-${b.id}`}
                        className={`cal-wg-mini ${statusCls}`}
                      >
                        <span className="cal-wg-mini-t">{b.startTime}</span>
                        {' '}
                        <span className="cal-wg-mini-d">{b.durationMinutes}m</span>
                        {' '}
                        <span className="cal-wg-mini-n">{b.clientNickname}</span>
                      </span>
                    );
                  })}
                </div>
              );
            }),

            /* Girl total */
            <div key={`t-${girl.id}`} className="cal-wg-total">
              <div className="cal-wg-total-pts">
                {total ? total.points.toLocaleString('cs-CZ') : '0'}
              </div>
              <div className="cal-wg-total-cnt">
                {total ? `${total.count} rez.` : '0 rez.'}
              </div>
            </div>,
          ];
        })}
      </div>

      {/* Summary row */}
      <div className="cal-week-summary" style={{ gridTemplateColumns: `100px repeat(${weekDays.length}, 1fr) 70px` }}>
        <div className="cal-ws-cell cal-ws-corner">Celkem/den</div>
        {weekDays.map((d) => {
          const t = dayTotals.get(d.date);
          return (
            <div key={d.date} className="cal-ws-cell">
              <div className="cal-ws-rez">{t?.count ?? 0}</div>
              <div className="cal-ws-pts">{t ? `${t.points.toLocaleString('cs-CZ')} b` : '0 b'}</div>
            </div>
          );
        })}
        <div className="cal-ws-cell" style={{ background: 'rgba(251,191,36,0.08)' }}>
          <div className="cal-ws-rez" style={{ color: 'var(--yellow)' }}>{grandCount}</div>
          <div className="cal-ws-pts">{grandPoints.toLocaleString('cs-CZ')}</div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const WEEK_VIEW_STYLES = `
.cal-week-grid {
  display: grid;
  border-bottom: 1px solid var(--line);
}
.cal-wg-header {
  background: var(--bg-soft); padding: 10px 8px; text-align: center;
  border-bottom: 1px solid var(--line); border-right: 1px solid var(--line);
  font-size: 12px; color: var(--muted);
  text-decoration: none; display: block;
}
.cal-wg-header:hover { background: var(--bg-elev); }
.cal-wg-daynum { font-size: 18px; font-weight: 700; color: var(--text); margin-top: 2px; }
.cal-wg-header.today { background: var(--bg-elev); }
.cal-wg-header.today .cal-wg-daynum { color: var(--coral); }
.cal-wg-corner {
  font-size: 11px; display: flex; align-items: center; justify-content: center;
  color: var(--dim); cursor: default;
}
.cal-wg-corner:hover { background: var(--bg-soft); }

.cal-wg-girl {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--line); border-right: 1px solid var(--line);
  background: var(--bg-soft);
}
.cal-wg-girl-av {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0;
  overflow: hidden;
}
.cal-wg-girl-av img {
  width: 24px; height: 24px; border-radius: 50%;
  object-fit: cover; display: block;
}
.cal-wg-girl-nm { font-size: 12px; font-weight: 600; }

.cal-wg-cell {
  border-bottom: 1px solid var(--line); border-right: 1px solid var(--line);
  padding: 2px 3px; min-height: 36px;
}

.cal-wg-mini {
  border-radius: 3px; padding: 1px 4px;
  font-size: 10px; line-height: 16px; margin-bottom: 1px;
  border-left: 2px solid; cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-decoration: none; color: inherit; display: block;
}
.cal-wg-mini:hover { opacity: 0.85; }

/* Status-based color coding */
.cal-wg-status-confirmed {
  background: rgba(74, 222, 128, 0.10);
  border-left-color: var(--green);
}
.cal-wg-status-draft {
  background: rgba(251, 191, 36, 0.10);
  border-left-color: var(--yellow);
  border-left-style: dashed;
  opacity: 0.7;
}
.cal-wg-status-pending {
  background: rgba(251, 146, 60, 0.12);
  border-left-color: var(--orange, #fb923c);
}
.cal-wg-status-completed {
  background: rgba(106, 94, 114, 0.10);
  border-left-color: var(--dim);
}
.cal-wg-status-noshow {
  background: rgba(239, 68, 68, 0.10);
  border-left-color: var(--red);
  opacity: 0.5;
}

.cal-wg-mini-t { color: var(--muted); }
.cal-wg-mini-d { color: var(--dim); }
.cal-wg-mini-n { font-weight: 600; color: var(--text); }

.cal-wg-total {
  border-bottom: 1px solid var(--line); border-right: 1px solid var(--line);
  background: var(--bg-elev); display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 4px;
}
.cal-wg-total-pts { font-size: 14px; font-weight: 700; color: var(--yellow); font-family: Georgia, serif; }
.cal-wg-total-cnt { font-size: 10px; color: var(--dim); }

/* Summary row */
.cal-week-summary {
  display: grid;
  background: var(--bg-elev); border-top: 2px solid var(--line);
}
.cal-ws-cell {
  padding: 6px 8px; text-align: center;
  border-right: 1px solid var(--line);
}
.cal-ws-rez { font-size: 14px; font-weight: 700; color: var(--coral); }
.cal-ws-pts { font-size: 11px; color: var(--yellow); font-weight: 600; }
.cal-ws-corner {
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: var(--dim); font-weight: 600;
}
`;
