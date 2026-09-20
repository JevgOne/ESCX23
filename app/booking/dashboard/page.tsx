/**
 * STUDIOFLOW — Dashboard
 * Real-time statistics: today's bookings, week/month revenue,
 * pending bookings, no-show rate, top girls, who's working today.
 */

import { db } from '@/lib/db';
import { requireBooking } from '@/lib/auth';
import { getCalendarGirls } from '@/lib/booking-queries';

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
  }
`;
