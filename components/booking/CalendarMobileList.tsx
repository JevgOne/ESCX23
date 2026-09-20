/**
 * STUDIOFLOW — Mobile Day List View
 * Simple vertical list of bookings grouped by girl.
 * Shows on mobile instead of the time grid.
 */

import type { CalendarGirl, CalendarBooking } from '@/lib/booking-queries';

interface Props {
  girls: CalendarGirl[];
  bookings: CalendarBooking[];
  date: string;
}

export default function CalendarMobileList({ girls, bookings, date }: Props) {
  // Group bookings by girl
  const bookingsByGirl = new Map<number, CalendarBooking[]>();
  for (const b of bookings) {
    if (b.date !== date) continue;
    const arr = bookingsByGirl.get(b.girlId) ?? [];
    arr.push(b);
    bookingsByGirl.set(b.girlId, arr);
  }

  // Sort: girls with bookings first, then alphabetically
  const sortedGirls = [...girls].sort((a, b) => {
    const aCount = bookingsByGirl.get(a.id)?.length ?? 0;
    const bCount = bookingsByGirl.get(b.id)?.length ?? 0;
    if (aCount > 0 && bCount === 0) return -1;
    if (aCount === 0 && bCount > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  // Girls without bookings but working
  const freeGirls = sortedGirls.filter(g => !bookingsByGirl.has(g.id) && g.isWorking);

  // Girls not working today (without bookings)
  const offGirls = sortedGirls.filter(g => !g.isWorking && !bookingsByGirl.has(g.id));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MOBILE_LIST_STYLES }} />
      <div className="cal-mobile-list">
        {sortedGirls.map((girl) => {
          const girlBookings = bookingsByGirl.get(girl.id);
          if (!girlBookings || girlBookings.length === 0) return null;

          return (
            <div key={girl.id} className="cal-ml-girl">
              <div className="cal-ml-header">
                <div className="cal-ml-avatar">
                  {girl.photoUrl
                    ? <img src={girl.photoUrl} alt={girl.name} width={32} height={32} />
                    : girl.name.charAt(0)
                  }
                </div>
                <div className="cal-ml-info">
                  <span className="cal-ml-name">{girl.name}</span>
                  <span className="cal-ml-shift">
                    {girl.isWorking
                      ? `${girl.shiftStart} – ${girl.shiftEnd}`
                      : 'Nepracuje'
                    }
                    {girl.locationName && (
                      <span className="cal-ml-loc">{girl.locationName}</span>
                    )}
                  </span>
                </div>
                <span className="cal-ml-count">{girlBookings.length} rez.</span>
              </div>
              <div className="cal-ml-bookings">
                {girlBookings.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((b) => {
                  const isBreak = b.bookingType === 'break';
                  const statusCls = isBreak ? 'break'
                    : b.status === 'pending' ? 'pending'
                    : b.status === 'confirmed' || b.status === 'in_progress' ? 'confirmed'
                    : b.status === 'completed' ? 'completed'
                    : b.isDraft ? 'draft'
                    : 'confirmed';
                  // Calculate end time from start + duration
                  const [sh, sm] = b.startTime.split(':').map(Number);
                  const endTotal = sh * 60 + sm + b.durationMinutes;
                  const endTime = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;

                  return (
                    <a
                      key={`${b.isDraft ? 'd' : 'b'}-${b.id}`}
                      href={b.isDraft ? '#' : `/booking/calendar?date=${date}&view=day&detail=${b.id}`}
                      className={`cal-ml-booking cal-ml-${statusCls}`}
                    >
                      <span className="cal-ml-time">{b.startTime}–{endTime}</span>
                      <span className="cal-ml-client">{isBreak ? 'Pauza' : (b.clientNickname || 'Klient')}</span>
                      {b.locationName && !isBreak && <span className="cal-ml-bk-loc">{b.locationName}</span>}
                      {b.status === 'pending' && !isBreak && <span className="cal-ml-badge">Čeká</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Free girls */}
        {freeGirls.length > 0 && (
          <div className="cal-ml-free">
            <div className="cal-ml-free-label">Volné dívky</div>
            <div className="cal-ml-free-list">
              {freeGirls.map(g => (
                <span key={g.id} className="cal-ml-free-name">
                  {g.name}
                  {g.shiftStart && <span className="cal-ml-free-shift"> {g.shiftStart}–{g.shiftEnd}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Off girls (collapsible) */}
        {offGirls.length > 0 && (
          <details className="cal-ml-off">
            <summary className="cal-ml-off-label">
              Nepracující ({offGirls.length})
            </summary>
            <div className="cal-ml-free-list">
              {offGirls.map(g => (
                <span key={g.id} className="cal-ml-free-name cal-ml-off-name">
                  {g.name}
                </span>
              ))}
            </div>
          </details>
        )}
      </div>
    </>
  );
}

const MOBILE_LIST_STYLES = `
.cal-mobile-list { display: none; }

@media (max-width: 768px) {
  .cal-mobile-list { display: block; }
  .cal-day-wrapper { display: none !important; }

  .cal-ml-girl {
    margin-bottom: 2px;
    background: var(--bg-soft);
    border-radius: 10px;
    overflow: hidden;
  }
  .cal-ml-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--line);
  }
  .cal-ml-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--bg-elev);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: var(--coral);
    overflow: hidden; flex-shrink: 0;
  }
  .cal-ml-avatar img {
    width: 32px; height: 32px; border-radius: 50%;
    object-fit: cover; display: block;
  }
  .cal-ml-info { flex: 1; min-width: 0; }
  .cal-ml-name { font-size: 14px; font-weight: 600; display: block; }
  .cal-ml-shift { font-size: 11px; color: var(--green); }
  .cal-ml-count {
    font-size: 11px; color: var(--dim);
    background: var(--bg-elev);
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }

  .cal-ml-bookings { padding: 4px 8px; }
  .cal-ml-booking {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    border-left: 3px solid var(--green);
    margin-bottom: 3px;
    text-decoration: none;
    color: inherit;
    background: rgba(74,222,128,0.05);
  }
  .cal-ml-booking:active { opacity: 0.7; }
  .cal-ml-pending {
    border-left-color: var(--yellow);
    background: rgba(251,191,36,0.08);
  }
  .cal-ml-draft {
    border-left-color: var(--yellow);
    border-left-style: dashed;
    background: rgba(251,191,36,0.05);
    opacity: 0.7;
  }
  .cal-ml-completed {
    border-left-color: var(--dim);
    background: rgba(106,94,114,0.05);
    opacity: 0.6;
  }
  .cal-ml-time {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    min-width: 90px;
    white-space: nowrap;
  }
  .cal-ml-client {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cal-ml-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(251,191,36,0.2);
    color: var(--yellow);
    white-space: nowrap;
  }

  .cal-ml-free {
    margin-top: 12px;
    padding: 12px 14px;
    background: var(--bg-soft);
    border-radius: 10px;
  }
  .cal-ml-free-label {
    font-size: 11px;
    color: var(--dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .cal-ml-free-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cal-ml-free-name {
    font-size: 12px;
    color: var(--muted);
    background: var(--bg-elev);
    padding: 4px 10px;
    border-radius: 6px;
  }
  .cal-ml-free-shift { color: var(--dim); font-size: 10px; }
  .cal-ml-loc {
    font-size: 11px; font-weight: 600;
    padding: 1px 6px; border-radius: 4px;
    background: rgba(96,165,250,0.12); color: var(--blue);
    margin-left: 6px;
  }
  .cal-ml-bk-loc {
    font-size: 11px; font-weight: 600;
    padding: 1px 6px; border-radius: 4px;
    background: rgba(96,165,250,0.12); color: var(--blue);
    margin-left: auto; flex-shrink: 0;
  }

  /* Break/pause booking */
  .cal-ml-break {
    border-left-color: var(--teal);
    border-left-style: dotted;
    background: rgba(45,212,191,0.08);
  }
  .cal-ml-break .cal-ml-client { color: var(--teal); }

  /* Off girls collapsible */
  .cal-ml-off {
    margin-top: 8px;
    padding: 12px 14px;
    background: var(--bg-soft);
    border-radius: 10px;
  }
  .cal-ml-off-label {
    font-size: 11px;
    color: var(--dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }
  .cal-ml-off-label::-webkit-details-marker { display: none; }
  .cal-ml-off-label::before {
    content: '\u25B6';
    display: inline-block;
    margin-right: 6px;
    font-size: 8px;
    transition: transform 0.2s;
  }
  .cal-ml-off[open] .cal-ml-off-label::before {
    transform: rotate(90deg);
  }
  .cal-ml-off .cal-ml-free-list { margin-top: 8px; }
  .cal-ml-off-name { opacity: 0.5; }
}
`;
