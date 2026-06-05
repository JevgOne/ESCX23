import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import { pragueDateISO } from '@/lib/utils';
import { getValidAccessTokenByGirl, getUpcomingEvents, type GCalEvent } from '@/lib/gcal';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ScheduleSlot {
  dayOfWeek: number;
  from: string;
  to: string;
  isActive: boolean;
  locationName: string | null;
}

interface Exception {
  date: string;
  type: string;
  from: string | null;
  to: string | null;
}

interface Booking {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string | null;
  status: string;
  duration: number | null;
  location: string | null;
}

const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const DAY_NAMES_FULL = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DAY_NAMES_SHORT_CS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

function formatEventDate(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  const pragueStr = d.toLocaleString('en-US', { timeZone: 'Europe/Prague' });
  const prague = new Date(pragueStr);
  return `${DAY_NAMES_SHORT_CS[prague.getDay()]} ${prague.getDate()}.${prague.getMonth() + 1}.`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('cs-CZ', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', hour12: false });
}

function generate14Days(today: string) {
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const jsDay = d.getUTCDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Po, 6=Ne
    days.push({
      iso,
      dayIdx,
      dayName: DAY_NAMES[dayIdx],
      dayNameFull: DAY_NAMES_FULL[dayIdx],
      dayNum: d.getUTCDate(),
      monthNum: d.getUTCMonth() + 1,
      isToday: i === 0,
      isPast: false,
    });
  }
  return days;
}

export default async function StudioKalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;
  const today = pragueDateISO();

  // Fetch schedule, exceptions, bookings, girl info, gcal token in parallel
  const [schedRes, excRes, bookRes, girlRes, gcalTokenRes] = await Promise.all([
    db.execute({
      sql: `SELECT gs.day_of_week, gs.start_time, gs.end_time, gs.is_active,
              l.display_name AS location_name
            FROM girl_schedules gs
            LEFT JOIN locations l ON l.id = gs.location_id
            WHERE gs.girl_id = ?
            ORDER BY gs.day_of_week`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT date, exception_type, start_time, end_time
            FROM schedule_exceptions
            WHERE girl_id = ? AND date >= ?
            ORDER BY date`,
      args: [girlId, today],
    }),
    db.execute({
      sql: `SELECT id, date, start_time, end_time, client_name, status, duration, location
            FROM bookings
            WHERE girl_id = ? AND date >= ? AND status != 'cancelled'
            ORDER BY date, start_time`,
      args: [girlId, today],
    }),
    db.execute({
      sql: `SELECT name FROM girls WHERE id = ?`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT calendar_id FROM google_calendar_tokens WHERE girl_id = ?`,
      args: [girlId],
    }),
  ]);

  const girlName = girlRes.rows[0] ? String(girlRes.rows[0].name) : '';

  // Google Calendar: fetch events server-side (read-only, admin connects)
  const gcalToken = gcalTokenRes.rows[0] ?? null;
  let gcalEvents: GCalEvent[] = [];
  let gcalError = false;

  if (gcalToken) {
    try {
      const token = await getValidAccessTokenByGirl(girlId);
      if (token) {
        gcalEvents = await getUpcomingEvents(token, String(gcalToken.calendar_id));
      } else {
        gcalError = true;
      }
    } catch {
      gcalError = true;
    }
  }

  const schedules: ScheduleSlot[] = schedRes.rows.map((r) => ({
    dayOfWeek: Number(r.day_of_week),
    from: String(r.start_time).slice(0, 5),
    to: String(r.end_time).slice(0, 5),
    isActive: Boolean(r.is_active),
    locationName: r.location_name ? String(r.location_name) : null,
  }));

  const exceptions: Exception[] = excRes.rows.map((r) => ({
    date: String(r.date),
    type: String(r.exception_type),
    from: r.start_time ? String(r.start_time).slice(0, 5) : null,
    to: r.end_time ? String(r.end_time).slice(0, 5) : null,
  }));

  const bookings: Booking[] = bookRes.rows.map((r) => ({
    id: Number(r.id),
    date: String(r.date),
    startTime: String(r.start_time).slice(0, 5),
    endTime: String(r.end_time).slice(0, 5),
    clientName: r.client_name ? String(r.client_name) : null,
    status: String(r.status),
    duration: r.duration ? Number(r.duration) : null,
    location: r.location ? String(r.location) : null,
  }));

  const days = generate14Days(today);

  // Build schedule map: dayOfWeek -> slot
  const schedMap = new Map<number, ScheduleSlot>();
  for (const s of schedules) {
    if (s.isActive) schedMap.set(s.dayOfWeek, s);
  }

  // Exception map: date -> exception
  const excMap = new Map<string, Exception>();
  for (const e of exceptions) excMap.set(e.date, e);

  // Bookings map: date -> bookings[]
  const bookMap = new Map<string, Booking[]>();
  for (const b of bookings) {
    if (!bookMap.has(b.date)) bookMap.set(b.date, []);
    bookMap.get(b.date)!.push(b);
  }

  const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Čeká', cls: 'cal-badge-pending' },
    confirmed: { label: 'Potvrzeno', cls: 'cal-badge-confirmed' },
    completed: { label: 'Hotovo', cls: 'cal-badge-done' },
  };

  return (
    <>
      <StudioTopbar title="Kalendář" />

      <div className="studio-content">
        <div className="cal-header">
          <div className="cal-header-name">{girlName}</div>
          <div className="cal-header-range">
            {days[0].dayNum}.{days[0].monthNum}. — {days[13].dayNum}.{days[13].monthNum}.
          </div>
        </div>

        <div className="cal-legend">
          <span className="cal-legend-item cal-legend-available">Pracuji</span>
          <span className="cal-legend-item cal-legend-off">Volno</span>
          <span className="cal-legend-item cal-legend-today">Dnes</span>
        </div>

        <div className="cal-grid">
          {days.map((day) => {
            const sched = schedMap.get(day.dayIdx);
            const exc = excMap.get(day.iso);
            const dayBooks = bookMap.get(day.iso) ?? [];

            // Determine shift
            let shiftFrom: string | null = sched?.from ?? null;
            let shiftTo: string | null = sched?.to ?? null;
            let isOff = !sched;
            let locationName = sched?.locationName ?? null;

            if (exc) {
              if (exc.type === 'unavailable') {
                isOff = true;
                shiftFrom = null;
                shiftTo = null;
              } else if (exc.type === 'custom_hours' && exc.from && exc.to) {
                shiftFrom = exc.from;
                shiftTo = exc.to;
                isOff = false;
              }
            }

            return (
              <div
                key={day.iso}
                className={`cal-day${day.isToday ? ' cal-day-today' : ''}${isOff ? ' cal-day-off' : ''}`}
              >
                <div className="cal-day-head">
                  <span className="cal-day-name">{day.dayName}</span>
                  <span className="cal-day-num">{day.dayNum}</span>
                </div>

                {isOff ? (
                  <div className="cal-day-off-label">Volno</div>
                ) : (
                  <div className="cal-day-shift">
                    <div className="cal-shift-time">{shiftFrom} — {shiftTo}</div>
                    {locationName && (
                      <div className="cal-shift-loc">{locationName}</div>
                    )}
                  </div>
                )}

                {dayBooks.length > 0 && (
                  <div className="cal-day-bookings">
                    {dayBooks.map((b) => {
                      const st = STATUS_BADGE[b.status] ?? { label: b.status, cls: '' };
                      return (
                        <div key={b.id} className={`cal-booking ${st.cls}`}>
                          <div className="cal-booking-time">{b.startTime} — {b.endTime}</div>
                          {b.duration && <span className="cal-booking-dur">{b.duration} min</span>}
                          <span className={`cal-booking-badge ${st.cls}`}>{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Google Calendar events (read-only, admin connects) */}
        {gcalEvents.length > 0 && (
          <div className="cal-google">
            <div className="cal-google-title">Google Kalendář</div>
            <div className="cal-google-events">
              {gcalEvents.map((ev) => (
                <div key={ev.id} className="cal-gcal-event">
                  <div className="cal-gcal-event-date">
                    {formatEventDate(ev.start)}
                  </div>
                  <div className="cal-gcal-event-time">
                    {ev.allDay ? 'Celý den' : `${formatTime(ev.start)} — ${formatTime(ev.end)}`}
                  </div>
                  <div className="cal-gcal-event-title">{ev.summary}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {gcalError && (
          <div className="cal-google">
            <div className="cal-google-title">Google Kalendář</div>
            <div className="cal-google-error">
              <p>Připojení ke Google Calendar vypršelo. Kontaktujte administrátora.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
