/**
 * STUDIOFLOW — Booking Calendar
 * Server Component: day/week toggle via ?view=day|week URL param.
 * Date navigation via ?date=YYYY-MM-DD.
 * Booking detail overlay via ?detail=ID.
 */

import {
  getCalendarGirls,
  getCalendarBookings,
  computeDayStats,
} from '@/lib/booking-queries';
import CalendarDayView from '@/components/booking/CalendarDayView';
import CalendarWeekView from '@/components/booking/CalendarWeekView';
import BookingDetailOverlay from '@/components/booking/BookingDetailOverlay';

export const dynamic = 'force-dynamic';

const DAY_NAMES_SHORT = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];
const DAY_NAMES_CS = ['Nedele', 'Pondeli', 'Utery', 'Streda', 'Ctvrtek', 'Patek', 'Sobota'];

function getPragueNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
}

function formatDateCS(d: Date): string {
  const day = DAY_NAMES_CS[d.getDay()];
  return `${day} ${d.getDate()}. ${d.toLocaleString('cs-CZ', { month: 'long' })} ${d.getFullYear()}`;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}

interface Props {
  searchParams: Promise<{ view?: string; date?: string; detail?: string }>;
}

export default async function BookingCalendarPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = params.view === 'day' ? 'day' : 'week';
  const pragueNow = getPragueNow();
  const today = toISODate(pragueNow);

  // Parse date param or default to today
  const dateParam = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? params.date
    : today;
  const selectedDate = new Date(dateParam + 'T12:00:00');

  // Calculate week boundaries
  const weekMonday = getWeekMonday(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekMonday);
    d.setDate(weekMonday.getDate() + i);
    const iso = toISODate(d);
    return {
      date: iso,
      label: DAY_NAMES_SHORT[d.getDay()],
      dayNum: d.getDate(),
      isToday: iso === today,
    };
  });

  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;

  // Navigation dates
  const prevDay = new Date(selectedDate);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const prevWeek = new Date(weekMonday);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekMonday);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Fetch data
  const dateFrom = view === 'day' ? dateParam : weekStart;
  const dateTo = view === 'day' ? dateParam : weekEnd;

  const [girls, bookings] = await Promise.all([
    getCalendarGirls(dateParam),
    getCalendarBookings(dateFrom, dateTo),
  ]);

  // Stats for day view
  const dayBookings = bookings.filter((b) => b.date === dateParam);
  const stats = computeDayStats(dayBookings, girls);

  // Detail overlay
  const detailId = params.detail ? parseInt(params.detail, 10) : null;
  const detailBooking = detailId
    ? bookings.find((b) => !b.isDraft && b.id === detailId) ?? null
    : null;

  // Build back URL (same page without detail param)
  const backUrl = `/booking/calendar?view=${view}&date=${dateParam}`;

  // Date display
  const dateDisplay = view === 'day'
    ? formatDateCS(selectedDate)
    : `Tyden ${weekDays[0].dayNum}. - ${weekDays[6].dayNum}. ${selectedDate.toLocaleString('cs-CZ', { month: 'long' })} ${selectedDate.getFullYear()}`;

  // Nav links
  const prevLink = view === 'day'
    ? `/booking/calendar?view=day&date=${toISODate(prevDay)}`
    : `/booking/calendar?view=week&date=${toISODate(prevWeek)}`;
  const nextLink = view === 'day'
    ? `/booking/calendar?view=day&date=${toISODate(nextDay)}`
    : `/booking/calendar?view=week&date=${toISODate(nextWeek)}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* Top bar */}
      <div className="cal-topbar">
        <div className="cal-topbar-left">
          <span className="cal-topbar-title">Rezervace</span>
          <span className="cal-topbar-date">{dateDisplay}</span>
        </div>
        <div className="cal-topbar-right">
          <div className="cal-toggle">
            <a
              href={`/booking/calendar?view=day&date=${dateParam}`}
              className={`cal-toggle-btn${view === 'day' ? ' active' : ''}`}
            >
              Den
            </a>
            <a
              href={`/booking/calendar?view=week&date=${dateParam}`}
              className={`cal-toggle-btn${view === 'week' ? ' active' : ''}`}
            >
              Tyden
            </a>
          </div>
          <a href={`/booking/calendar/new?date=${dateParam}`} className="cal-btn-new">
            + Nova rezervace
          </a>
        </div>
      </div>

      {/* Date navigation */}
      <div className="cal-date-bar">
        <a href={prevLink} className="cal-date-nav">&lt;</a>
        <div className="cal-date-days">
          {weekDays.map((d) => (
            <a
              key={d.date}
              href={`/booking/calendar?view=${view}&date=${d.date}`}
              className={`cal-date-day${d.date === dateParam && view === 'day' ? ' active' : ''}${d.isToday ? ' today' : ''}`}
            >
              <span>{d.label}</span>
              <div className="cal-date-num">{d.dayNum}</div>
            </a>
          ))}
        </div>
        <a href={nextLink} className="cal-date-nav">&gt;</a>
      </div>

      {/* Stats bar (day view only) */}
      {view === 'day' && (
        <div className="cal-stats-bar">
          <div className="cal-stat">
            <span className="cal-stat-val">{stats.totalBookings}</span> rezervaci dnes
          </div>
          <div className="cal-stat">
            <span className="cal-stat-dot" style={{ background: 'var(--green)' }} />
            <span className="cal-stat-val">{stats.workingGirls}</span> pracuji
          </div>
          <div className="cal-stat">
            <span className="cal-stat-dot" style={{ background: 'var(--yellow)' }} />
            <span className="cal-stat-val">{stats.pending}</span> ceka na potvrzeni
          </div>
          <div className="cal-stat">
            <span className="cal-stat-dot" style={{ background: 'var(--blue)' }} />
            <span className="cal-stat-val">{stats.confirmed}</span> potvrzenych
          </div>
        </div>
      )}

      {/* Calendar view */}
      {view === 'day' ? (
        <CalendarDayView
          girls={girls}
          bookings={dayBookings}
          date={dateParam}
          pragueHour={pragueNow.getHours()}
          pragueMinute={pragueNow.getMinutes()}
        />
      ) : (
        <CalendarWeekView
          girls={girls}
          bookings={bookings}
          weekDays={weekDays}
        />
      )}

      {/* Legend */}
      <div className="cal-legend">
        {view === 'day' ? (
          <>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(96,165,250,0.15)', borderLeftColor: 'var(--blue)' }} />
              Telefon
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(96,165,250,0.15)', borderLeftColor: '#229ED9' }} />
              Telegram
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(74,222,128,0.15)', borderLeftColor: '#25D366' }} />
              WhatsApp
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(167,139,250,0.15)', borderLeftColor: 'var(--purple)' }} />
              Admin
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(251,191,36,0.12)', borderLeftColor: 'var(--yellow)' }} />
              Ceka na potvrzeni
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(74,222,128,0.04)', borderLeftColor: 'rgba(74,222,128,0.3)' }} />
              Smena
            </div>
          </>
        ) : (
          <>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(74,222,128,0.10)', borderLeftColor: 'var(--green)' }} />
              Potvrzena
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(251,146,60,0.12)', borderLeftColor: '#fb923c' }} />
              Ceka na potvrzeni
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(251,191,36,0.10)', borderLeftColor: 'var(--yellow)', borderLeftStyle: 'dashed' } as React.CSSProperties} />
              Draft (TG bot)
            </div>
            <div className="cal-legend-item">
              <div className="cal-legend-sw" style={{ background: 'rgba(106,94,114,0.10)', borderLeftColor: 'var(--dim)' }} />
              Dokoncena
            </div>
          </>
        )}
      </div>

      {/* Booking detail overlay */}
      {detailBooking && (
        <BookingDetailOverlay booking={detailBooking} backUrl={backUrl} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
const PAGE_STYLES = `
/* Calendar page — sits inside .sf-content from layout */
.cal-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 0 16px;
  margin: -24px -24px 0;
  padding: 12px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
}
.cal-topbar-left { display: flex; align-items: center; gap: 16px; }
.cal-topbar-title { font-size: 18px; font-weight: 700; }
.cal-topbar-date { font-size: 14px; color: var(--muted); }
.cal-topbar-right { display: flex; align-items: center; gap: 10px; }

.cal-toggle { display: flex; }
.cal-toggle-btn {
  padding: 8px 16px; border-radius: 0; border: 1px solid var(--line);
  font-size: 13px; font-weight: 600; cursor: pointer;
  background: transparent; color: var(--muted);
  text-decoration: none; display: inline-flex; align-items: center;
}
.cal-toggle-btn:first-child { border-radius: 8px 0 0 8px; }
.cal-toggle-btn:last-child { border-radius: 0 8px 8px 0; }
.cal-toggle-btn.active { color: var(--coral); border-color: var(--coral); }

.cal-btn-new {
  padding: 8px 16px; border-radius: 8px;
  background: var(--coral); color: #fff;
  font-size: 13px; font-weight: 600;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
}
.cal-btn-new:hover { opacity: 0.9; }

/* Date bar */
.cal-date-bar {
  display: flex; align-items: center; gap: 8px;
  margin: 0 -24px;
  padding: 10px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
}
.cal-date-nav {
  font-size: 18px; color: var(--muted); cursor: pointer; padding: 4px 8px;
  text-decoration: none;
}
.cal-date-nav:hover { color: var(--coral); }
.cal-date-days { display: flex; gap: 4px; flex: 1; justify-content: center; }
.cal-date-day {
  width: 48px; text-align: center; padding: 6px 4px;
  border-radius: 10px; cursor: pointer;
  font-size: 11px; color: var(--muted);
  text-decoration: none;
}
.cal-date-num { font-size: 16px; font-weight: 700; color: var(--text); margin-top: 2px; }
.cal-date-day.active { background: var(--coral); color: #fff; }
.cal-date-day.active .cal-date-num { color: #fff; }
.cal-date-day.today { border: 1px solid var(--coral); }

/* Stats bar */
.cal-stats-bar {
  display: flex; gap: 24px;
  margin: 0 -24px;
  padding: 10px 20px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--line);
  font-size: 12px;
}
.cal-stat { display: flex; align-items: center; gap: 6px; }
.cal-stat-dot { width: 8px; height: 8px; border-radius: 50%; }
.cal-stat-val { font-weight: 700; color: var(--text); }

/* Legend */
.cal-legend {
  display: flex; gap: 16px; flex-wrap: wrap;
  margin: 0 -24px;
  padding: 12px 20px;
  border-top: 1px solid var(--line);
  font-size: 11px; color: var(--muted);
}
.cal-legend-item { display: flex; align-items: center; gap: 6px; }
.cal-legend-sw {
  width: 12px; height: 12px; border-radius: 3px;
  border-left: 3px solid;
}
`;
