/**
 * STUDIOFLOW — Calendar Day View (Server Component)
 * Renders the multi-staff time grid with booking blocks, shift backgrounds,
 * and the current-time line. Matches mockup 01-calendar-day.html exactly.
 */

import type { CalendarGirl, CalendarBooking } from '@/lib/booking-queries';

// Grid config: 10:00 – 23:00, 30-min rows
const GRID_START_HOUR = 10;
const GRID_END_HOUR = 23;
const SLOT_HEIGHT = 40; // px per 30 min
const TOTAL_SLOTS = (GRID_END_HOUR - GRID_START_HOUR) * 2;
const HEADER_HEIGHT = 44;

function timeToSlotOffset(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return ((h - GRID_START_HOUR) * 2 + m / 30) * SLOT_HEIGHT;
}

function durationToHeight(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return (mins / 30) * SLOT_HEIGHT;
}

function getSourceClass(channel: string): string {
  switch (channel) {
    case 'telegram': return 'cal-bk-telegram';
    case 'whatsapp': return 'cal-bk-whatsapp';
    case 'admin': return 'cal-bk-admin';
    default: return 'cal-bk-phone';
  }
}

function getStatusClass(status: string): string {
  if (status === 'pending') return 'cal-bk-pending';
  if (status === 'no_show') return 'cal-bk-noshow';
  if (status === 'draft') return 'cal-bk-draft';
  return '';
}

function getTrustBadge(level: string): { label: string; cls: string } | null {
  switch (level) {
    case 'vip': return { label: 'VIP', cls: 'cal-badge-vip' };
    case 'new': return { label: 'Novy', cls: 'cal-badge-new' };
    default: return null;
  }
}

const DAILY_POINTS_TARGET = 4500;

interface Props {
  girls: CalendarGirl[];
  bookings: CalendarBooking[];
  date: string; // YYYY-MM-DD
  pragueHour: number;
  pragueMinute: number;
}

export default function CalendarDayView({ girls, bookings, date, pragueHour, pragueMinute }: Props) {
  // Time slots labels
  const timeSlots: string[] = [];
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    timeSlots.push(`${h}:00`);
    timeSlots.push('');
  }

  // Now line position
  const nowOffset = ((pragueHour - GRID_START_HOUR) * 2 + pragueMinute / 30) * SLOT_HEIGHT;
  const showNow = pragueHour >= GRID_START_HOUR && pragueHour < GRID_END_HOUR;

  // Group bookings by girl + compute points per girl
  const bookingsByGirl = new Map<number, CalendarBooking[]>();
  const pointsByGirl = new Map<number, number>();
  for (const b of bookings) {
    if (b.date !== date) continue;
    const arr = bookingsByGirl.get(b.girlId) ?? [];
    arr.push(b);
    bookingsByGirl.set(b.girlId, arr);
    if (!b.isDraft) {
      pointsByGirl.set(b.girlId, (pointsByGirl.get(b.girlId) ?? 0) + b.pointsEarned);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DAY_VIEW_STYLES }} />
      <div className="cal-day-wrapper">
        {/* Time column */}
        <div className="cal-time-col">
          {timeSlots.map((label, i) => (
            <div key={i} className="cal-time-slot">{label}</div>
          ))}
        </div>

        {/* Girl columns */}
        {girls.map((girl) => {
          const girlBookings = bookingsByGirl.get(girl.id) ?? [];

          // Shift background position
          let shiftTop = 0;
          let shiftHeight = 0;
          if (girl.shiftStart && girl.shiftEnd) {
            shiftTop = timeToSlotOffset(girl.shiftStart);
            shiftHeight = durationToHeight(girl.shiftStart, girl.shiftEnd);
          }

          // Points progress for this girl
          const girlPoints = pointsByGirl.get(girl.id) ?? 0;
          const ptsPercent = Math.min(100, Math.round((girlPoints / DAILY_POINTS_TARGET) * 100));
          const ptsUnder = girlPoints < DAILY_POINTS_TARGET;

          return (
            <div key={girl.id} className="cal-girl-col">
              {/* Header */}
              <div className="cal-girl-header">
                <div className="cal-girl-avatar">
                  {girl.photoUrl
                    ? <img src={girl.photoUrl} alt={girl.name} width={28} height={28} />
                    : girl.name.charAt(0)
                  }
                </div>
                <div>
                  <div className="cal-girl-name">{girl.name}</div>
                  <div className={`cal-girl-shift ${girl.isWorking ? 'online' : 'offline'}`}>
                    {girl.isWorking
                      ? `${girl.shiftStart} - ${girl.shiftEnd}`
                      : 'Nepracuje dnes'
                    }
                  </div>
                </div>
              </div>

              {/* Points progress bar */}
              <div className="cal-pts-bar" style={girl.isWorking ? undefined : { opacity: 0.3 }}>
                <div className="cal-pts-label">
                  <span className={`cal-pts-val ${ptsUnder ? 'under' : 'ok'}`}>
                    {girl.isWorking ? girlPoints.toLocaleString('cs-CZ') : '\u2014'}
                  </span>
                  {girl.isWorking && <span> / {DAILY_POINTS_TARGET.toLocaleString('cs-CZ')}</span>}
                </div>
                <div className="cal-pts-track">
                  {girl.isWorking && (
                    <div
                      className={`cal-pts-fill ${ptsUnder ? 'under' : 'over'}`}
                      style={{ width: `${ptsPercent}%` }}
                    />
                  )}
                  <div className="cal-pts-target" />
                </div>
              </div>

              {/* Slots area */}
              <div className="cal-girl-slots">
                {/* Shift background */}
                {girl.isWorking && (
                  <div
                    className="cal-shift-bg"
                    style={{ top: shiftTop, height: shiftHeight }}
                  />
                )}

                {/* No-shift overlay */}
                {!girl.isWorking && <div className="cal-no-shift" />}

                {/* Grid rows */}
                {timeSlots.map((_, i) => (
                  <div key={i} className={`cal-slot-row${i % 2 === 1 ? ' even' : ''}`} />
                ))}

                {/* Booking blocks */}
                {girlBookings.map((b) => {
                  const top = timeToSlotOffset(b.startTime) + 4;
                  const height = durationToHeight(b.startTime, b.endTime) - 4;
                  const srcCls = getSourceClass(b.channel);
                  const statusCls = getStatusClass(b.status);
                  const badge = getTrustBadge(b.clientTrustLevel);

                  return (
                    <a
                      key={`${b.isDraft ? 'd' : 'b'}-${b.id}`}
                      href={b.isDraft ? '#' : `/booking/calendar?date=${date}&detail=${b.id}`}
                      className={`cal-booking ${srcCls} ${statusCls}`}
                      style={{ top, height: Math.max(height, 32) }}
                      data-booking-id={b.isDraft ? undefined : b.id}
                    >
                      <div className="cal-bk-client">
                        {b.clientNickname}
                        {badge && <span className={`cal-bk-badge ${badge.cls}`}>{badge.label}</span>}
                        {b.status === 'pending' && <span className="cal-bk-badge cal-badge-pending">Ceka</span>}
                      </div>
                      <div className="cal-bk-meta">{b.startTime} - {b.endTime} ({b.durationMinutes} min)</div>
                      {b.locationName && <div className="cal-bk-meta">{b.locationName}</div>}
                    </a>
                  );
                })}

                {/* Now line */}
                {showNow && (
                  <div className="cal-now-line" style={{ top: nowOffset }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const DAY_VIEW_STYLES = `
.cal-day-wrapper {
  display: flex;
  overflow-x: auto;
  padding-bottom: 20px;
}

/* Time column */
.cal-time-col {
  width: 60px; min-width: 60px;
  padding-top: ${HEADER_HEIGHT}px;
  flex-shrink: 0;
}
.cal-time-slot {
  height: ${SLOT_HEIGHT}px;
  display: flex; align-items: flex-start; justify-content: flex-end;
  padding-right: 8px;
  font-size: 11px; color: var(--dim);
}

/* Girl column */
.cal-girl-col {
  min-width: 160px;
  flex: 1;
  border-left: 1px solid var(--line);
  position: relative;
}
.cal-girl-header {
  height: ${HEADER_HEIGHT}px;
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-soft);
  position: sticky; top: 82px; z-index: 10;
}
.cal-girl-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--bg-elev);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  color: var(--coral);
  border: 1px solid var(--line);
  overflow: hidden;
  flex-shrink: 0;
}
.cal-girl-avatar img {
  width: 28px; height: 28px; border-radius: 50%;
  object-fit: cover; display: block;
}
.cal-girl-name { font-size: 13px; font-weight: 600; }
.cal-girl-shift { font-size: 10px; }
.cal-girl-shift.online { color: var(--green); }
.cal-girl-shift.offline { color: var(--dim); }

/* Points progress bar */
.cal-pts-bar {
  height: 28px;
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-soft);
  font-size: 10px;
}
.cal-pts-track {
  flex: 1; height: 6px; border-radius: 3px;
  background: rgba(42,34,48,0.6);
  position: relative; overflow: hidden;
}
.cal-pts-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  border-radius: 3px;
  transition: width 0.3s;
}
.cal-pts-fill.under { background: var(--red); }
.cal-pts-fill.over { background: var(--green); }
.cal-pts-label { color: var(--dim); white-space: nowrap; }
.cal-pts-val { font-weight: 700; }
.cal-pts-val.under { color: var(--red); }
.cal-pts-val.ok { color: var(--green); }
.cal-pts-target {
  position: absolute; right: 0; top: -2px; bottom: -2px;
  width: 2px; background: var(--yellow); border-radius: 1px;
}

.cal-girl-slots { position: relative; }
.cal-slot-row {
  height: ${SLOT_HEIGHT}px;
  border-bottom: 1px solid rgba(42, 34, 48, 0.3);
}
.cal-slot-row.even {
  border-bottom: 1px solid var(--line);
}

/* Shift background */
.cal-shift-bg {
  position: absolute;
  left: 0; right: 0;
  background: rgba(74, 222, 128, 0.04);
  border-left: 2px solid rgba(74, 222, 128, 0.3);
}

/* No-shift overlay */
.cal-no-shift {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  background: repeating-linear-gradient(
    135deg,
    transparent,
    transparent 5px,
    rgba(42, 34, 48, 0.2) 5px,
    rgba(42, 34, 48, 0.2) 10px
  );
}

/* Booking block */
.cal-booking {
  position: absolute;
  left: 4px; right: 4px;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
  z-index: 5;
  border-left: 3px solid;
  transition: transform 0.1s, box-shadow 0.1s;
  text-decoration: none;
  color: inherit;
  display: block;
}
.cal-booking:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 20;
}

/* Source colors */
.cal-bk-phone {
  background: rgba(96, 165, 250, 0.15);
  border-left-color: var(--blue);
}
.cal-bk-telegram {
  background: rgba(96, 165, 250, 0.15);
  border-left-color: #229ED9;
}
.cal-bk-whatsapp {
  background: rgba(74, 222, 128, 0.15);
  border-left-color: #25D366;
}
.cal-bk-admin {
  background: rgba(167, 139, 250, 0.15);
  border-left-color: var(--purple);
}

/* Status overrides */
.cal-bk-pending {
  background: rgba(251, 191, 36, 0.12) !important;
  border-left-color: var(--yellow) !important;
}
.cal-bk-noshow {
  background: rgba(239, 68, 68, 0.12) !important;
  border-left-color: var(--red) !important;
  opacity: 0.6;
}
.cal-bk-draft {
  background: rgba(251, 191, 36, 0.08) !important;
  border-left-color: var(--yellow) !important;
  border-style: dashed;
  opacity: 0.7;
}

.cal-bk-client {
  font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cal-bk-meta {
  color: var(--muted); font-size: 10px; margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cal-bk-badge {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  margin-left: 4px;
}
.cal-badge-vip { background: rgba(251, 191, 36, 0.2); color: var(--yellow); }
.cal-badge-new { background: rgba(74, 222, 128, 0.2); color: var(--green); }
.cal-badge-pending { background: rgba(251, 191, 36, 0.2); color: var(--yellow); }

/* Current time line */
.cal-now-line {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: var(--coral);
  z-index: 15;
}
.cal-now-line::before {
  content: '';
  position: absolute;
  left: -4px; top: -3px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--coral);
}
`;
