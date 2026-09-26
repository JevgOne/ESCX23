import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { pragueDateISO } from '@/lib/utils';
import { db } from '@/lib/db';
import { getSchedulesForGirl, getActiveLocations } from '@/lib/queries';
import StudioTopbar from '@/components/studio/StudioTopbar';
import { submitShiftRequest, cancelShiftRequest } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_LABELS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const SHIFT_PRESETS = [
  { type: 'morning', label: 'Ranní', time: '10:00 – 16:00' },
  { type: 'afternoon', label: 'Odpolední', time: '16:30 – 22:30' },
  { type: 'fullday', label: 'Celý den', time: '10:00 – 22:00' },
] as const;

/** Monday of the week containing the given date. */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

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
  const nowPrague = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));

  const thisMonday = getMonday(nowPrague);
  const nextMonday = addDays(thisMonday, 7);

  const [schedules, locations, shiftRes] = await Promise.all([
    getSchedulesForGirl(girlId),
    getActiveLocations(),
    db.execute({
      sql: `SELECT * FROM shift_requests WHERE girl_id = ? AND week_start IN (?, ?) ORDER BY week_start, day_of_week`,
      args: [girlId, thisMonday, nextMonday],
    }),
  ]);

  // Map existing shifts by week_start + day_of_week
  type ShiftRow = { id: number; weekStart: string; dayOfWeek: number; shiftType: string; status: string; startTime: string; endTime: string; locationId: number | null; rejectReason: string | null };
  const shiftMap = new Map<string, ShiftRow>();
  for (const r of shiftRes.rows) {
    const key = `${r.week_start}_${r.day_of_week}`;
    shiftMap.set(key, {
      id: Number(r.id),
      weekStart: String(r.week_start),
      dayOfWeek: Number(r.day_of_week),
      shiftType: String(r.shift_type),
      status: String(r.status),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      locationId: r.location_id ? Number(r.location_id) : null,
      rejectReason: r.reject_reason ? String(r.reject_reason) : null,
    });
  }

  // Count shifts per week
  const weeks = [
    { label: 'Tento týden', monday: thisMonday },
    { label: 'Příští týden', monday: nextMonday },
  ];

  function countActiveShifts(monday: string): number {
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const shift = shiftMap.get(`${monday}_${d}`);
      if (shift && (shift.status === 'pending' || shift.status === 'approved')) count++;
    }
    return count;
  }

  // Default location: most recent or primary
  const defaultLocationId = locations.find(l => l.isPrimary)?.id ?? locations[0]?.id ?? null;

  // Weekly schedule map (current active schedule for reference)
  const schedMap: Record<number, { from: string; to: string }> = {};
  for (const s of schedules) {
    const d = Number(s.day_of_week);
    if (s.is_active) {
      schedMap[d] = {
        from: s.start_time ? String(s.start_time).substring(0, 5) : '10:00',
        to: s.end_time ? String(s.end_time).substring(0, 5) : '22:00',
      };
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .shift-status-banner {
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .shift-status-banner.ok {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          color: #86efac;
        }
        .shift-status-banner.warn {
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.3);
          color: #fde68a;
        }

        .shift-week-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-coral);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .shift-week-count {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 999px;
          background: var(--color-bg-elev);
          color: var(--color-text-dim);
        }

        .shift-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }

        .shift-day {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 12px;
          padding: 10px 6px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }
        .shift-day.past {
          opacity: 0.3;
          pointer-events: none;
        }
        .shift-day-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-dim);
        }
        .shift-day-date {
          font-size: 11px;
          color: var(--color-text-muted);
          font-family: ui-monospace, monospace;
        }

        .shift-btn {
          display: block;
          width: 100%;
          padding: 6px 2px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          text-align: center;
          border: 1px solid var(--color-line);
          background: var(--color-bg-elev);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .shift-btn:hover {
          border-color: var(--color-coral);
          color: var(--color-text);
        }

        .shift-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .shift-badge.pending {
          background: rgba(251,191,36,0.15);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.3);
        }
        .shift-badge.approved {
          background: rgba(34,197,94,0.15);
          color: #22c55e;
          border: 1px solid rgba(34,197,94,0.3);
        }
        .shift-badge.rejected {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.3);
        }

        .shift-type-label {
          font-size: 10px;
          color: var(--color-text-dim);
          margin-top: 2px;
        }

        .shift-cancel-btn {
          background: none;
          border: 1px solid rgba(239,68,68,0.3);
          color: rgba(239,68,68,0.8);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 4px;
        }
        .shift-cancel-btn:hover {
          background: rgba(239,68,68,0.1);
        }

        .shift-loc-select {
          margin-bottom: 20px;
        }
        .shift-loc-select label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-dim);
          display: block;
          margin-bottom: 6px;
        }
        .shift-loc-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .shift-loc-pill {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--color-line);
          background: var(--color-bg-elev);
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .shift-loc-pill:hover {
          border-color: var(--color-coral);
          color: var(--color-text);
        }
        .shift-loc-pill.active {
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          border-color: transparent;
          color: #fff;
        }

        .shift-current-schedule {
          margin-top: 8px;
        }
        .shift-current-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-dim);
          margin-bottom: 8px;
        }

        /* Shift selection modal (form-based, no JS) */
        .shift-select-form {
          display: flex;
          gap: 4px;
          flex-direction: column;
          align-items: center;
        }

        @media (max-width: 640px) {
          .shift-grid {
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
          }
          .shift-day {
            padding: 8px 3px;
            border-radius: 8px;
          }
          .shift-day-label { font-size: 9px; }
          .shift-day-date { font-size: 9px; }
          .shift-btn { font-size: 9px; padding: 5px 1px; }
          .shift-badge { font-size: 8px; padding: 3px 5px; }
          .shift-type-label { font-size: 8px; }
          .shift-cancel-btn { font-size: 8px; padding: 2px 6px; }
        }
      `}} />

      <StudioTopbar title="Směny" />

      <div className="studio-content">
        {/* Location selector — form-based, uses hidden input */}
        {locations.length > 1 && (
          <div className="shift-loc-select">
            <label>Pobočka</label>
            <div className="shift-loc-pills">
              {locations.map(loc => (
                <a
                  key={loc.id}
                  href={`/${locale}/studio/dostupnost?loc=${loc.id}`}
                  className={`shift-loc-pill${loc.id === defaultLocationId ? ' active' : ''}`}
                >
                  {loc.displayName}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Two weeks */}
        {weeks.map(week => {
          const activeCount = countActiveShifts(week.monday);
          const isMinMet = activeCount >= 2;

          return (
            <div key={week.monday}>
              {/* Status banner */}
              <div className={`shift-status-banner ${isMinMet ? 'ok' : 'warn'}`}>
                {isMinMet
                  ? `Minimum splněno (${activeCount} směn)`
                  : `Zbývá vybrat ${2 - activeCount} ${2 - activeCount === 1 ? 'směnu' : 'směny'} tento týden`
                }
              </div>

              <div className="shift-week-title">
                {week.label}
                <span className="shift-week-count">{activeCount}/7</span>
              </div>

              <div className="shift-grid">
                {DAY_LABELS.map((dayLabel, i) => {
                  const dateStr = addDays(week.monday, i);
                  const isPast = dateStr <= today;
                  const key = `${week.monday}_${i}`;
                  const existing = shiftMap.get(key);

                  return (
                    <div key={i} className={`shift-day${isPast ? ' past' : ''}`}>
                      <span className="shift-day-label">{DAY_SHORT[i]}</span>
                      <span className="shift-day-date">{formatDateShort(dateStr)}</span>

                      {existing ? (
                        <>
                          <span className={`shift-badge ${existing.status}`}>
                            {existing.status === 'pending' && 'Čeká'}
                            {existing.status === 'approved' && 'OK'}
                            {existing.status === 'rejected' && 'Zamítnuto'}
                          </span>
                          <span className="shift-type-label">
                            {existing.shiftType === 'morning' && 'Ranní'}
                            {existing.shiftType === 'afternoon' && 'Odpolední'}
                            {existing.shiftType === 'fullday' && 'Celý den'}
                          </span>
                          {existing.status === 'pending' && (
                            <form action={cancelShiftRequest}>
                              <input type="hidden" name="request_id" value={existing.id} />
                              <button type="submit" className="shift-cancel-btn">Zrušit</button>
                            </form>
                          )}
                          {existing.status === 'rejected' && existing.rejectReason && (
                            <span className="shift-type-label" style={{ color: '#ef4444' }}>
                              {existing.rejectReason}
                            </span>
                          )}
                        </>
                      ) : !isPast ? (
                        <div className="shift-select-form">
                          {SHIFT_PRESETS.map(preset => (
                            <form key={preset.type} action={submitShiftRequest}>
                              <input type="hidden" name="shift_type" value={preset.type} />
                              <input type="hidden" name="day_of_week" value={i} />
                              <input type="hidden" name="week_start" value={week.monday} />
                              <input type="hidden" name="location_id" value={defaultLocationId ?? ''} />
                              <button type="submit" className="shift-btn">
                                {preset.label}
                              </button>
                            </form>
                          ))}
                        </div>
                      ) : (
                        <span className="shift-type-label">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Current active schedule (reference) */}
        <div className="shift-current-schedule">
          <div className="shift-current-title">Aktuální schválený rozvrh</div>
          <div className="studio-readonly-card">
            {DAY_LABELS.map((dayLbl, i) => {
              const s = schedMap[i];
              return (
                <div key={i} className="studio-readonly-row">
                  <span className="studio-readonly-label">{dayLbl}</span>
                  <span className="studio-readonly-value">
                    {s ? (
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
      </div>
    </>
  );
}
