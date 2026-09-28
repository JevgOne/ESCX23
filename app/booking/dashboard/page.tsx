/**
 * STUDIOFLOW — Dashboard
 * Real-time statistics: today's bookings, week/month revenue,
 * pending bookings, no-show rate, top girls, who's working today.
 */

import { db } from '@/lib/db';
import { requireBooking } from '@/lib/auth';
import { getCalendarGirls, getCalendarBookings } from '@/lib/booking-queries';
import type { CalendarGirl, CalendarBooking } from '@/lib/booking-queries';

export const dynamic = 'force-dynamic';

function getPragueNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

function getMonthStart(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatTime(t: string): string {
  return t.substring(0, 5);
}

export default async function BookingDashboardPage() {
  await requireBooking();

  const now = getPragueNow();
  const today = toISODate(now);
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const weekMonday = toISODate(getWeekMonday(now));
  const weekSunday = (() => {
    const sun = new Date(getWeekMonday(now));
    sun.setDate(sun.getDate() + 6);
    return toISODate(sun);
  })();
  const monthStart = getMonthStart(now);

  // Run all queries in parallel
  const [
    todayBookingsResult,
    upcomingResult,
    pendingResult,
    weekStatsResult,
    monthStatsResult,
    noShowResult,
    totalCompletedResult,
    topGirlsResult,
    workingGirls,
    recentBookingsResult,
    todayAllResult,
    timelineBookings,
  ] = await Promise.all([
    // Today's bookings count
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM bookings_v2
            WHERE date = ? AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')`,
      args: [today],
    }),
    // Upcoming today (not yet started)
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM bookings_v2
            WHERE date = ? AND start_time > ? AND status IN ('confirmed', 'pending')`,
      args: [today, currentTime],
    }),
    // Pending bookings (all dates)
    db.execute({
      sql: `SELECT b.id, b.date, b.start_time, b.duration_minutes,
                   g.name AS girl_name,
                   bc.nickname AS client_nickname,
                   l.display_name AS location_name
            FROM bookings_v2 b
            LEFT JOIN girls g ON g.id = b.girl_id
            LEFT JOIN booking_clients bc ON bc.id = b.client_id
            LEFT JOIN locations l ON l.id = b.location_id
            WHERE b.status = 'pending'
            ORDER BY b.date, b.start_time
            LIMIT 10`,
      args: [],
    }),
    // Week stats (revenue + count)
    db.execute({
      sql: `SELECT COUNT(*) AS cnt, COALESCE(SUM(price), 0) AS revenue
            FROM bookings_v2
            WHERE date >= ? AND date <= ?
              AND status IN ('confirmed', 'completed', 'in_progress')`,
      args: [weekMonday, weekSunday],
    }),
    // Month stats (revenue + count)
    db.execute({
      sql: `SELECT COUNT(*) AS cnt, COALESCE(SUM(price), 0) AS revenue
            FROM bookings_v2
            WHERE date >= ? AND date <= ?
              AND status IN ('confirmed', 'completed', 'in_progress')`,
      args: [monthStart, today],
    }),
    // No-show count (last 30 days)
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM bookings_v2
            WHERE status = 'no_show' AND date >= date(?, '-30 days')`,
      args: [today],
    }),
    // Total completed last 30 days (for no-show rate calculation)
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM bookings_v2
            WHERE status IN ('completed', 'no_show', 'confirmed', 'in_progress')
              AND date >= date(?, '-30 days')`,
      args: [today],
    }),
    // Top girls by bookings this month
    db.execute({
      sql: `SELECT g.id, g.name, COUNT(*) AS booking_count,
                   COALESCE(SUM(b.price), 0) AS revenue
            FROM bookings_v2 b
            JOIN girls g ON g.id = b.girl_id
            WHERE b.date >= ? AND b.date <= ?
              AND b.status IN ('confirmed', 'completed', 'in_progress')
            GROUP BY g.id
            ORDER BY booking_count DESC
            LIMIT 5`,
      args: [monthStart, today],
    }),
    // Who's working today
    getCalendarGirls(today),
    // Recent bookings (last 5)
    db.execute({
      sql: `SELECT b.id, b.date, b.start_time, b.end_time, b.status, b.price,
                   b.channel, b.duration_minutes,
                   g.name AS girl_name,
                   bc.nickname AS client_nickname,
                   l.display_name AS location_name
            FROM bookings_v2 b
            LEFT JOIN girls g ON g.id = b.girl_id
            LEFT JOIN booking_clients bc ON bc.id = b.client_id
            LEFT JOIN locations l ON l.id = b.location_id
            WHERE b.date >= ? AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')
            ORDER BY b.created_at DESC
            LIMIT 5`,
      args: [today],
    }),
    // All today's bookings for "Dnešní přehled" section
    db.execute({
      sql: `SELECT b.id, b.date, b.start_time, b.end_time, b.status,
                   b.duration_minutes, b.channel,
                   g.name AS girl_name,
                   bc.nickname AS client_nickname,
                   l.display_name AS location_name
            FROM bookings_v2 b
            LEFT JOIN girls g ON g.id = b.girl_id
            LEFT JOIN booking_clients bc ON bc.id = b.client_id
            LEFT JOIN locations l ON l.id = b.location_id
            WHERE b.date = ?
              AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')
            ORDER BY b.start_time, g.name`,
      args: [today],
    }),
    // Timeline bookings (includes drafts)
    getCalendarBookings(today, today),
  ]);

  const todayCount = Number(todayBookingsResult.rows[0]?.cnt ?? 0);
  const upcomingCount = Number(upcomingResult.rows[0]?.cnt ?? 0);
  const pendingBookings = pendingResult.rows;
  const weekCount = Number(weekStatsResult.rows[0]?.cnt ?? 0);
  const weekRevenue = Number(weekStatsResult.rows[0]?.revenue ?? 0);
  const monthCount = Number(monthStatsResult.rows[0]?.cnt ?? 0);
  const monthRevenue = Number(monthStatsResult.rows[0]?.revenue ?? 0);
  const noShowCount = Number(noShowResult.rows[0]?.cnt ?? 0);
  const totalCompleted = Number(totalCompletedResult.rows[0]?.cnt ?? 0);
  const noShowRate = totalCompleted > 0 ? ((noShowCount / totalCompleted) * 100).toFixed(1) : '0.0';
  const topGirls = topGirlsResult.rows;
  const girlsWorking = workingGirls.filter(g => g.isWorking);
  const recentBookings = recentBookingsResult.rows;
  const todayAllBookings = todayAllResult.rows;

  // --- Timeline grid computation ---
  const TIMELINE_START = 10; // 10:00
  const TIMELINE_END = 23; // 23:00
  const SLOT_MINUTES = 30;
  const TOTAL_SLOTS = ((TIMELINE_END - TIMELINE_START) * 60) / SLOT_MINUTES; // 26 slots

  const timeSlotLabels: string[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const totalMin = TIMELINE_START * 60 + i * SLOT_MINUTES;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    timeSlotLabels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  function timeToSlot(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return ((h * 60 + m) - TIMELINE_START * 60) / SLOT_MINUTES;
  }

  function slotSpan(startTime: string, endTime: string): { start: number; span: number } {
    let s = timeToSlot(startTime);
    let e = timeToSlot(endTime);
    if (s < 0) s = 0;
    if (e > TOTAL_SLOTS) e = TOTAL_SLOTS;
    return { start: s, span: Math.max(1, Math.round(e - s)) };
  }

  // Group bookings by girl
  const bookingsByGirl = new Map<number, CalendarBooking[]>();
  for (const b of timelineBookings) {
    const arr = bookingsByGirl.get(b.girlId) ?? [];
    arr.push(b);
    bookingsByGirl.set(b.girlId, arr);
  }

  // Separate working and not-working girls
  const tlWorkingGirls = workingGirls.filter(g => g.isWorking);
  const tlNotWorkingGirls = workingGirls.filter(g => !g.isWorking);

  const formatCZK = (n: number) => n.toLocaleString('cs-CZ') + ' Kc';

  const DAY_NAMES = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];
  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
  };

  const statusColors: Record<string, string> = {
    confirmed: 'var(--green)',
    completed: 'var(--teal)',
    in_progress: 'var(--blue)',
    pending: 'var(--yellow)',
    no_show: 'var(--red)',
    draft: 'var(--dim)',
  };

  const statusLabels: Record<string, string> = {
    confirmed: 'Potvrzeno',
    completed: 'Dokonceno',
    in_progress: 'Probiha',
    pending: 'Ceka',
    no_show: 'Neprisel',
    draft: 'Draft',
  };

  const channelLabels: Record<string, string> = {
    phone: 'Tel',
    telegram: 'TG',
    whatsapp: 'WA',
    admin: 'Admin',
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_STYLES }} />

      <div className="db-header">
        <h1 className="db-title">Dashboard</h1>
        <span className="db-date">{formatDateShort(today)} {currentTime}</span>
      </div>

      {/* Dnešní přehled — mobile-first overview */}
      <div className="db-today">
        <div className="db-today-header">
          <h2 className="db-today-title">Dnes</h2>
          <span className="db-today-date">{formatDateShort(today)}</span>
          <span className="db-today-count">{todayAllBookings.length} rez.</span>
        </div>
        {todayAllBookings.length === 0 ? (
          <div className="db-empty">Dnes zadne rezervace</div>
        ) : (
          <div className="db-today-list">
            {todayAllBookings.map((b) => {
              const status = String(b.status);
              const startTime = String(b.start_time);
              const startHHMM = formatTime(startTime);
              // Determine if this booking is currently happening
              const endTime = String(b.end_time);
              const isNow = currentTime >= formatTime(startTime) && currentTime < formatTime(endTime) && (status === 'confirmed' || status === 'in_progress');
              const isPast = currentTime >= formatTime(endTime) || status === 'completed';

              return (
                <a
                  key={Number(b.id)}
                  href={`/booking/calendar?date=${today}&detail=${Number(b.id)}`}
                  className={`db-today-row${isNow ? ' db-today-now' : ''}${isPast ? ' db-today-past' : ''}`}
                >
                  <span className="db-today-time">{startHHMM}</span>
                  <span className="db-dot" style={{ background: statusColors[status] ?? 'var(--dim)' }} />
                  <span className="db-today-girl">{String(b.girl_name ?? '?')}</span>
                  <span className="db-today-client">{String(b.client_nickname ?? 'Neznamy')}</span>
                  {b.location_name && (
                    <span className="db-today-loc">{String(b.location_name)}</span>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline Grid */}
      {tlWorkingGirls.length > 0 && (
        <div className="tl-wrap">
          <div className="tl-header">
            <h2 className="tl-title">Timeline</h2>
            <span className="tl-subtitle">{tlWorkingGirls.length} pracuje, {timelineBookings.filter(b => !b.isDraft).length} rez.</span>
          </div>
          <div className="tl-scroll">
            <div className="tl-grid" style={{ gridTemplateColumns: `120px repeat(${TOTAL_SLOTS}, 48px)` }}>
              {/* Header row */}
              <div className="tl-corner" />
              {timeSlotLabels.map((label, i) => (
                <div key={i} className={`tl-time-header${i % 2 === 0 ? ' tl-hour' : ''}`}>
                  {i % 2 === 0 ? label : ''}
                </div>
              ))}

              {/* Girl rows */}
              {tlWorkingGirls.map((girl) => {
                const girlBookings = bookingsByGirl.get(girl.id) ?? [];
                // Build occupied slots set
                const occupiedSlots = new Set<number>();
                for (const b of girlBookings) {
                  const { start, span } = slotSpan(b.startTime, b.endTime);
                  for (let s = start; s < start + span; s++) occupiedSlots.add(s);
                }
                // Girl shift bounds
                const shiftStartSlot = girl.shiftStart ? timeToSlot(girl.shiftStart) : 0;
                const shiftEndSlot = girl.shiftEnd ? timeToSlot(girl.shiftEnd) : TOTAL_SLOTS;

                return (
                  <div key={girl.id} className="tl-row" style={{ display: 'contents' }}>
                    {/* Girl name cell */}
                    <div className="tl-girl">
                      <span className="tl-girl-name">{girl.name}</span>
                      {girl.locationName && <span className="tl-girl-loc">{girl.locationName}</span>}
                    </div>
                    {/* Time cells */}
                    {timeSlotLabels.map((_, slotIdx) => {
                      // Check if a booking starts here
                      const booking = girlBookings.find(b => {
                        const { start } = slotSpan(b.startTime, b.endTime);
                        return Math.round(start) === slotIdx;
                      });

                      if (booking) {
                        const { span } = slotSpan(booking.startTime, booking.endTime);
                        const isBreak = booking.bookingType === 'break';
                        const isDraft = booking.isDraft;
                        const statusClass = isDraft ? 'draft' : isBreak ? 'break' : booking.status;
                        return (
                          <a
                            key={slotIdx}
                            href={isDraft ? undefined : `/booking/calendar?date=${today}&detail=${booking.id}`}
                            className={`tl-booking tl-st-${statusClass}`}
                            style={{ gridColumn: `span ${span}` }}
                            title={`${booking.clientNickname} / ${booking.durationMinutes}min / ${booking.startTime}-${booking.endTime}`}
                          >
                            <span className="tl-bk-client">{isBreak ? 'Prestavka' : booking.clientNickname}</span>
                            <span className="tl-bk-dur">{booking.durationMinutes}m</span>
                          </a>
                        );
                      }

                      // Skip cells covered by a multi-slot booking
                      if (occupiedSlots.has(slotIdx)) return null;

                      // Outside shift = grey
                      if (slotIdx < shiftStartSlot || slotIdx >= shiftEndSlot) {
                        return <div key={slotIdx} className="tl-cell tl-off" />;
                      }

                      // Free slot = clickable [+]
                      const slotTime = timeSlotLabels[slotIdx];
                      return (
                        <a
                          key={slotIdx}
                          href={`/booking/calendar/new?date=${today}&girl=${girl.id}&time=${slotTime}`}
                          className="tl-cell tl-free"
                          title={`Pridat rezervaci: ${girl.name} ${slotTime}`}
                        >
                          +
                        </a>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile vertical list */}
          <div className="tl-mobile">
            {tlWorkingGirls.map((girl) => {
              const girlBookings = (bookingsByGirl.get(girl.id) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <div key={girl.id} className="tl-m-girl">
                  <div className="tl-m-girl-header">
                    <span className="tl-m-girl-name">{girl.name}</span>
                    {girl.locationName && <span className="tl-m-girl-loc">{girl.locationName}</span>}
                    <span className="tl-m-girl-shift">{girl.shiftStart} - {girl.shiftEnd}</span>
                  </div>
                  {girlBookings.length === 0 ? (
                    <a href={`/booking/calendar/new?date=${today}&girl=${girl.id}`} className="tl-m-free">
                      + Pridat rezervaci
                    </a>
                  ) : (
                    <div className="tl-m-bookings">
                      {girlBookings.map(b => (
                        <a
                          key={b.id}
                          href={b.isDraft ? undefined : `/booking/calendar?date=${today}&detail=${b.id}`}
                          className={`tl-m-bk tl-st-${b.isDraft ? 'draft' : b.bookingType === 'break' ? 'break' : b.status}`}
                        >
                          <span className="tl-m-bk-time">{b.startTime}-{b.endTime}</span>
                          <span className="tl-m-bk-client">{b.bookingType === 'break' ? 'Prestavka' : b.clientNickname}</span>
                          <span className="tl-m-bk-dur">{b.durationMinutes}m</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Non-working girls */}
          {tlNotWorkingGirls.length > 0 && (
            <div className="tl-notworking">
              {tlNotWorkingGirls.map(g => (
                <span key={g.id} className="tl-nw-name">{g.name}</span>
              ))}
              <span className="tl-nw-label">— dnes nepracuje</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="db-grid-4">
        <div className="db-card">
          <div className="db-card-label">Dnes rezervace</div>
          <div className="db-card-value">{todayCount}</div>
          <div className="db-card-sub">{upcomingCount} nadchazejicich</div>
        </div>
        <div className="db-card">
          <div className="db-card-label">Tento tyden</div>
          <div className="db-card-value">{weekCount}</div>
          <div className="db-card-sub">{formatCZK(weekRevenue)}</div>
        </div>
        <div className="db-card">
          <div className="db-card-label">Tento mesic</div>
          <div className="db-card-value">{monthCount}</div>
          <div className="db-card-sub">{formatCZK(monthRevenue)}</div>
        </div>
        <div className="db-card">
          <div className="db-card-label">No-show rate (30d)</div>
          <div className="db-card-value" style={{ color: Number(noShowRate) > 10 ? 'var(--red)' : 'var(--green)' }}>
            {noShowRate}%
          </div>
          <div className="db-card-sub">{noShowCount} z {totalCompleted}</div>
        </div>
      </div>

      {/* Two-column layout: Pending + Working today */}
      <div className="db-grid-2">
        {/* Pending bookings */}
        <div className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Cekajici na potvrzeni</h2>
            <span className="db-badge" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--yellow)' }}>
              {pendingBookings.length}
            </span>
          </div>
          {pendingBookings.length === 0 ? (
            <div className="db-empty">Zadne cekajici rezervace</div>
          ) : (
            <div className="db-list">
              {pendingBookings.map((b) => (
                <a key={Number(b.id)} href={`/booking/calendar?date=${String(b.date)}&detail=${Number(b.id)}`} className="db-list-item">
                  <div className="db-list-main">
                    <span className="db-dot" style={{ background: 'var(--yellow)' }} />
                    <span className="db-list-name">{String(b.girl_name ?? '?')}</span>
                    <span className="db-list-client">{String(b.client_nickname ?? 'Neznamy')}</span>
                    {b.location_name && <span className="db-list-loc">{String(b.location_name)}</span>}
                  </div>
                  <div className="db-list-meta">
                    <span>{formatDateShort(String(b.date))}</span>
                    <span>{formatTime(String(b.start_time))}</span>
                    <span>{Number(b.duration_minutes)} min</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Who's working today */}
        <div className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Dnes pracuji</h2>
            <span className="db-badge" style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--green)' }}>
              {girlsWorking.length}
            </span>
          </div>
          {girlsWorking.length === 0 ? (
            <div className="db-empty">Dnes nikdo nepracuje</div>
          ) : (
            <div className="db-list">
              {girlsWorking.map((g) => (
                <div key={g.id} className="db-list-item">
                  <div className="db-list-main">
                    <span className="db-dot" style={{ background: 'var(--green)' }} />
                    <span className="db-list-name">{g.name}</span>
                    {g.locationName && <span className="db-list-loc">{g.locationName}</span>}
                  </div>
                  <div className="db-list-meta">
                    <span>{g.shiftStart} – {g.shiftEnd}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout: Top girls + Recent bookings */}
      <div className="db-grid-2">
        {/* Top girls this month */}
        <div className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Top tento mesic</h2>
          </div>
          {topGirls.length === 0 ? (
            <div className="db-empty">Zatim zadne rezervace</div>
          ) : (
            <div className="db-list">
              {topGirls.map((g, i) => (
                <div key={Number(g.id)} className="db-list-item">
                  <div className="db-list-main">
                    <span className="db-rank">{i + 1}.</span>
                    <span className="db-list-name">{String(g.name)}</span>
                    <span className="db-list-count">{Number(g.booking_count)} rez.</span>
                  </div>
                  <div className="db-list-meta">
                    <span className="db-list-revenue">{formatCZK(Number(g.revenue))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings today */}
        <div className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Posledni rezervace</h2>
          </div>
          {recentBookings.length === 0 ? (
            <div className="db-empty">Dnes zatim zadne</div>
          ) : (
            <div className="db-list">
              {recentBookings.map((b) => {
                const status = String(b.status);
                return (
                  <a key={Number(b.id)} href={`/booking/calendar?date=${String(b.date)}&detail=${Number(b.id)}`} className="db-list-item">
                    <div className="db-list-main">
                      <span className="db-dot" style={{ background: statusColors[status] ?? 'var(--dim)' }} />
                      <span className="db-list-name">{String(b.girl_name ?? '?')}</span>
                      <span className="db-list-client">{String(b.client_nickname ?? 'Neznamy')}</span>
                      {b.location_name && <span className="db-list-loc">{String(b.location_name)}</span>}
                      <span className="db-list-status" style={{ color: statusColors[status] ?? 'var(--dim)' }}>
                        {statusLabels[status] ?? status}
                      </span>
                    </div>
                    <div className="db-list-meta">
                      <span>{formatTime(String(b.start_time))}–{formatTime(String(b.end_time))}</span>
                      <span>{channelLabels[String(b.channel)] ?? String(b.channel)}</span>
                      {b.price != null && <span>{formatCZK(Number(b.price))}</span>}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DASHBOARD_STYLES = `
  .db-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 20px;
  }
  .db-title {
    font-size: 20px;
    font-weight: 700;
  }
  .db-date {
    font-size: 13px;
    color: var(--muted);
  }

  /* KPI Grid */
  .db-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .db-card {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
  }
  .db-card-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .db-card-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 4px;
  }
  .db-card-sub {
    font-size: 12px;
    color: var(--dim);
  }

  /* Two-column grid */
  .db-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  /* Sections */
  .db-section {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
  }
  .db-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .db-section-title {
    font-size: 14px;
    font-weight: 600;
  }
  .db-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
  }

  /* List items */
  .db-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .db-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 6px;
    text-decoration: none;
    color: var(--text);
    transition: background 0.15s;
  }
  a.db-list-item:hover {
    background: rgba(255,255,255,0.04);
  }
  .db-list-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .db-list-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--muted);
    flex-shrink: 0;
  }
  .db-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .db-list-name {
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
  }
  .db-list-client {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  .db-list-loc {
    font-size: 11px;
    font-weight: 600;
    color: var(--blue);
    background: rgba(96,165,250,0.12);
    padding: 1px 6px;
    border-radius: 4px;
  }
  .db-list-status {
    font-size: 11px;
    font-weight: 600;
  }
  .db-list-count {
    font-size: 12px;
    color: var(--muted);
  }
  .db-list-revenue {
    font-weight: 600;
    color: var(--green);
  }
  .db-rank {
    font-size: 12px;
    font-weight: 700;
    color: var(--dim);
    width: 20px;
    text-align: right;
  }
  .db-empty {
    font-size: 13px;
    color: var(--dim);
    padding: 12px 10px;
  }

  /* Today overview */
  .db-today {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .db-today-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }
  .db-today-title {
    font-size: 16px;
    font-weight: 700;
  }
  .db-today-date {
    font-size: 13px;
    color: var(--muted);
  }
  .db-today-count {
    font-size: 12px;
    color: var(--dim);
    margin-left: auto;
  }
  .db-today-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .db-today-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    text-decoration: none;
    color: var(--text);
    transition: background 0.15s;
  }
  .db-today-row:hover {
    background: rgba(255,255,255,0.04);
  }
  .db-today-now {
    background: rgba(96,165,250,0.1);
    border: 1px solid rgba(96,165,250,0.25);
  }
  .db-today-past {
    opacity: 0.5;
  }
  .db-today-time {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    min-width: 44px;
    flex-shrink: 0;
  }
  .db-today-girl {
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
  }
  .db-today-client {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .db-today-loc {
    font-size: 11px;
    font-weight: 600;
    color: var(--blue);
    background: rgba(96,165,250,0.12);
    padding: 1px 6px;
    border-radius: 4px;
    white-space: nowrap;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* Timeline */
  .tl-wrap {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .tl-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }
  .tl-title {
    font-size: 16px;
    font-weight: 700;
  }
  .tl-subtitle {
    font-size: 12px;
    color: var(--dim);
  }
  .tl-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .tl-grid {
    display: grid;
    gap: 0;
    min-width: max-content;
  }
  .tl-corner {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg-elev);
  }
  .tl-time-header {
    font-size: 10px;
    color: var(--dim);
    text-align: center;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums;
  }
  .tl-time-header.tl-hour {
    font-weight: 600;
    color: var(--muted);
  }
  .tl-girl {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg-elev);
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 36px;
  }
  .tl-girl-name {
    font-weight: 600;
    font-size: 12px;
    white-space: nowrap;
  }
  .tl-girl-loc {
    font-size: 10px;
    color: var(--blue);
  }
  .tl-cell {
    border-bottom: 1px solid var(--line);
    border-right: 1px solid rgba(255,255,255,0.03);
    min-height: 36px;
  }
  .tl-off {
    background: rgba(255,255,255,0.02);
  }
  .tl-free {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dim);
    font-size: 14px;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
    border-bottom: 1px solid var(--line);
    border-right: 1px solid rgba(255,255,255,0.03);
    min-height: 36px;
  }
  .tl-free:hover {
    background: rgba(74,222,128,0.1);
    color: var(--green);
  }
  .tl-booking {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    text-decoration: none;
    color: #fff;
    overflow: hidden;
    white-space: nowrap;
    border-bottom: 1px solid var(--line);
    min-height: 36px;
    transition: filter 0.15s;
  }
  a.tl-booking:hover {
    filter: brightness(1.15);
  }
  .tl-st-confirmed { background: rgba(74,222,128,0.25); color: var(--green); }
  .tl-st-in_progress { background: rgba(96,165,250,0.3); color: var(--blue); }
  .tl-st-pending { background: rgba(251,191,36,0.25); color: var(--yellow); }
  .tl-st-completed { background: rgba(255,255,255,0.08); color: var(--muted); }
  .tl-st-draft {
    background: rgba(251,191,36,0.12);
    color: var(--yellow);
    border: 1px dashed rgba(251,191,36,0.4);
  }
  .tl-st-break { background: rgba(255,255,255,0.06); color: var(--dim); }
  .tl-bk-client {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tl-bk-dur {
    font-size: 9px;
    opacity: 0.7;
    flex-shrink: 0;
  }
  .tl-notworking {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .tl-nw-name {
    font-size: 12px;
    color: var(--dim);
  }
  .tl-nw-label {
    font-size: 11px;
    color: var(--dim);
    opacity: 0.6;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .db-grid-4 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .db-grid-4 { grid-template-columns: 1fr; }
    .db-grid-2 { grid-template-columns: 1fr; }
    .db-today-time {
      font-size: 17px;
      min-width: 48px;
    }
    .db-today-girl {
      font-size: 14px;
    }
    .tl-scroll { display: none; }
    .tl-mobile { display: flex !important; }
  }

  /* Mobile timeline list (hidden on desktop) */
  .tl-mobile {
    display: none;
    flex-direction: column;
    gap: 8px;
  }
  .tl-m-girl {
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
  }
  .tl-m-girl-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(255,255,255,0.03);
  }
  .tl-m-girl-name {
    font-weight: 600;
    font-size: 13px;
  }
  .tl-m-girl-loc {
    font-size: 10px;
    color: var(--blue);
    background: rgba(96,165,250,0.12);
    padding: 1px 5px;
    border-radius: 3px;
  }
  .tl-m-girl-shift {
    font-size: 11px;
    color: var(--dim);
    margin-left: auto;
  }
  .tl-m-bookings {
    display: flex;
    flex-direction: column;
  }
  .tl-m-bk {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    text-decoration: none;
    border-top: 1px solid var(--line);
  }
  .tl-m-bk-time {
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 80px;
  }
  .tl-m-bk-client {
    font-size: 12px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tl-m-bk-dur {
    font-size: 10px;
    opacity: 0.6;
  }
  .tl-m-free {
    display: block;
    padding: 8px 10px;
    text-align: center;
    color: var(--dim);
    text-decoration: none;
    font-size: 12px;
    border-top: 1px solid var(--line);
  }
  .tl-m-free:hover {
    color: var(--green);
    background: rgba(74,222,128,0.06);
  }
`;
