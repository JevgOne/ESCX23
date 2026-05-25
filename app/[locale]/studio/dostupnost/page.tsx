import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { pragueDateISO, pragueDayOfWeek } from '@/lib/utils';
import { db } from '@/lib/db';
import { getSchedulesForGirl } from '@/lib/queries';
import StudioTopbar from '@/components/studio/StudioTopbar';
import {
  studioSaveWeeklySchedule,
  studioSetTodayOff,
  studioApplyMonthBulk,
} from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_LABELS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DAY_SHORT  = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const DAY_HEADERS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const MONTH_CS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const MONTH_NAMES_GEN = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];

const PRESETS = [
  { value: 'morning',   label: 'Ranní',     sub: '10:00 – 16:00' },
  { value: 'afternoon', label: 'Odpolední', sub: '16:30 – 22:30' },
  { value: 'fullday',   label: 'Celodenní', sub: '10:00 – 22:00' },
  { value: 'custom',    label: 'Vlastní',   sub: '' },
];

function detectPreset(from: string | null, to: string | null): string {
  if (!from || !to) return 'fullday';
  const f = from.substring(0, 5);
  const t = to.substring(0, 5);
  if (f === '10:00' && t === '16:00') return 'morning';
  if (f === '16:30' && t === '22:30') return 'afternoon';
  if (f === '10:00' && t === '22:00') return 'fullday';
  return 'custom';
}

function prevMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const d = new Date(year, mon - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const d = new Date(year, mon, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildCalendarDays(month: string) {
  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  const lastDay  = new Date(year, mon, 0);
  const jsFirstDow = firstDay.getDay();
  const startOffset = jsFirstDow === 0 ? 6 : jsFirstDow - 1;
  const cells: Array<{ date: string | null; dayNum: number | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null, dayNum: null });
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: dateStr, dayNum: d });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push({ date: null, dayNum: null });
  }
  return cells;
}

export default async function StudioDostupnostPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month: monthParam } = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  const today = pragueDateISO();
  const dow = pragueDayOfWeek();
  const currentMonth = monthParam?.match(/^\d{4}-\d{2}$/) ? monthParam : today.substring(0, 7);

  const [schedules, exRes, todaySchedRes, monthExRes] = await Promise.all([
    getSchedulesForGirl(girlId),
    db.execute({
      sql: `SELECT exception_type, start_time, end_time FROM schedule_exceptions WHERE girl_id = ? AND date = ? LIMIT 1`,
      args: [girlId, today],
    }),
    db.execute({
      sql: `SELECT start_time, end_time FROM girl_schedules WHERE girl_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1`,
      args: [girlId, dow],
    }),
    (async () => {
      const [year, mon] = currentMonth.split('-').map(Number);
      const lastDay = new Date(year, mon, 0).getDate();
      return db.execute({
        sql: `SELECT date, exception_type, start_time, end_time FROM schedule_exceptions WHERE girl_id = ? AND date >= ? AND date <= ?`,
        args: [girlId, `${currentMonth}-01`, `${currentMonth}-${String(lastDay).padStart(2, '0')}`],
      });
    })(),
  ]);

  // Today panel data
  const ex = exRes.rows[0] ?? null;
  const sch = todaySchedRes.rows[0] ?? null;

  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const dayLabel = DAY_LABELS[dow];
  const dayNum = pragueNow.getDate();
  const monthLabelGen = MONTH_NAMES_GEN[pragueNow.getMonth()];
  const year = pragueNow.getFullYear();

  let statusText = 'Žádný rozvrh';
  let statusClass = 'today-status-off';
  let timeRange: string | null = null;

  if (ex) {
    if (ex.exception_type === 'unavailable') {
      statusText = 'Volno (override)';
      statusClass = 'today-status-off';
    } else if (ex.exception_type === 'custom_hours') {
      statusText = 'Online (override)';
      statusClass = 'today-status-online';
      const f = ex.start_time ? String(ex.start_time).substring(0, 5) : null;
      const t = ex.end_time ? String(ex.end_time).substring(0, 5) : null;
      if (f && t) timeRange = `${f} — ${t}`;
    }
  } else if (sch) {
    statusText = 'Online';
    statusClass = 'today-status-online';
    const f = sch.start_time ? String(sch.start_time).substring(0, 5) : null;
    const t = sch.end_time ? String(sch.end_time).substring(0, 5) : null;
    if (f && t) timeRange = `${f} — ${t}`;
  } else {
    statusText = 'Volno (výchozí)';
    statusClass = 'today-status-off';
  }

  // Weekly schedule
  const schedMap: Record<number, { from: string; to: string; active: boolean }> = {};
  for (const s of schedules) {
    const d = Number(s.day_of_week);
    schedMap[d] = {
      from: s.start_time ? String(s.start_time).substring(0, 5) : '10:00',
      to:   s.end_time   ? String(s.end_time).substring(0, 5)   : '22:00',
      active: Boolean(s.is_active),
    };
  }

  // Calendar
  const exceptionMap = new Map<string, { exception_type: string; start_time: string | null; end_time: string | null }>();
  for (const row of monthExRes.rows) {
    exceptionMap.set(String(row.date), {
      exception_type: String(row.exception_type),
      start_time: row.start_time ? String(row.start_time) : null,
      end_time: row.end_time ? String(row.end_time) : null,
    });
  }

  const cells = buildCalendarDays(currentMonth);
  const [yearN, monN] = currentMonth.split('-').map(Number);
  const monthLabel = `${MONTH_CS[monN - 1]} ${yearN}`;
  const prev = prevMonth(currentMonth);
  const next = nextMonth(currentMonth);

  return (
    <>
      <StudioTopbar title="Dostupnost" />

      <div className="schedule-page">
        {/* Today panel */}
        <div className="today-panel">
          <div className="today-panel-header">
            <span className="today-panel-label">DNES</span>
            <span className="today-panel-date">{dayLabel} {dayNum}. {monthLabelGen} {year}</span>
          </div>
          <div className={`today-panel-status ${statusClass}`}>
            <span className="today-status-dot" />
            <span className="today-status-text">{statusText}</span>
            {timeRange && <span className="today-status-time">{timeRange}</span>}
          </div>
          <div className="today-panel-actions">
            <form action={studioSetTodayOff}>
              <button type="submit" className="today-btn today-btn-danger">
                Volno do konce dne
              </button>
            </form>
          </div>
        </div>

        {/* Weekly schedule */}
        <div className="schedule-section">
          <div className="schedule-section-head">
            <h2 className="schedule-section-title">Týdenní rozvrh</h2>
            <p className="schedule-section-sub">Výchozí dostupnost pro každý den v týdnu</p>
          </div>
          <form action={studioSaveWeeklySchedule} className="weekly-form">
            <div className="weekly-schedule">
              {DAY_LABELS.map((dayLbl, i) => {
                const existing = schedMap[i];
                const isActive = existing?.active ?? false;
                const currentPreset = isActive
                  ? detectPreset(existing?.from ?? null, existing?.to ?? null)
                  : 'fullday';
                const currentFrom = existing?.from ?? '10:00';
                const currentTo   = existing?.to   ?? '22:00';

                return (
                  <div key={i} className={`day-row${isActive ? ' active' : ''}`}>
                    <div className="day-row-header">
                      <label className="day-toggle">
                        <input type="checkbox" name={`day_${i}_active`} defaultChecked={isActive} className="day-checkbox" />
                        <span className="day-toggle-track"><span className="day-toggle-thumb" /></span>
                      </label>
                      <span className="day-name-full">{dayLbl}</span>
                      <span className="day-name-short">{DAY_SHORT[i]}</span>
                      {!isActive && <span className="day-off-badge">Volno</span>}
                    </div>
                    <div className="day-row-detail">
                      <div className="presets">
                        {PRESETS.map((p) => (
                          <div key={p.value} className="preset-item">
                            <input type="radio" name={`day_${i}_preset`} value={p.value} id={`d${i}-${p.value}`} defaultChecked={currentPreset === p.value} />
                            <label htmlFor={`d${i}-${p.value}`} className="preset-card">
                              <span className="preset-label">{p.label}</span>
                              {p.sub && <span className="preset-sub">{p.sub}</span>}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="custom-time">
                        <div className="time-input-group">
                          <label className="time-input-label">Od</label>
                          <input type="time" name={`day_${i}_from`} defaultValue={currentFrom} className="time-input" />
                        </div>
                        <span className="time-sep">—</span>
                        <div className="time-input-group">
                          <label className="time-input-label">Do</label>
                          <input type="time" name={`day_${i}_to`} defaultValue={currentTo} className="time-input" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bulk-actions">
              <span className="bulk-label">Hromadně:</span>
              <button type="submit" name="bulk" value="weekdays_same" className="bulk-btn">Po–Pá celodenní</button>
              <button type="submit" name="bulk" value="weekend_off" className="bulk-btn">Víkend volno</button>
              <button type="submit" name="bulk" value="reset" className="bulk-btn bulk-btn-danger">Reset vše</button>
            </div>
            <div className="weekly-form-footer">
              <button type="submit" className="btn-save-week">Uložit týden</button>
            </div>
          </form>
        </div>

        {/* Calendar override */}
        <div className="schedule-section">
          <div className="schedule-section-head">
            <h2 className="schedule-section-title">Kalendář override</h2>
            <p className="schedule-section-sub">Výjimky pro konkrétní dny (přepíše týdenní výchozí)</p>
          </div>
          <div className="calendar-wrap">
            <div className="calendar-nav">
              <a href={`?month=${prev}`} className="calendar-nav-btn">← {MONTH_CS[Number(prev.split('-')[1]) - 1]}</a>
              <span className="calendar-month-label">{monthLabel}</span>
              <a href={`?month=${next}`} className="calendar-nav-btn">{MONTH_CS[Number(next.split('-')[1]) - 1]} →</a>
            </div>
            <div className="calendar-legend">
              <span className="cal-legend-item cal-legend-available">Dostupná</span>
              <span className="cal-legend-item cal-legend-off">Volno</span>
              <span className="cal-legend-item cal-legend-default">Výchozí</span>
            </div>
            <div className="calendar-grid">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
              {cells.map((cell, idx) => {
                if (!cell.date) return <div key={`empty-${idx}`} className="calendar-day calendar-day-empty" />;
                const override = exceptionMap.get(cell.date);
                const isPast = cell.date < today;
                const isToday = cell.date === today;
                let modClass = '';
                if (override) {
                  if (override.exception_type === 'unavailable') modClass = 'has-override-off';
                  else modClass = 'has-override-available';
                }
                if (isPast) modClass += ' is-past';
                if (isToday) modClass += ' is-today';
                return (
                  <div key={cell.date} className={`calendar-day ${modClass}`} aria-label={cell.date}>
                    <span className="calendar-day-num">{cell.dayNum}</span>
                    {override && <span className="calendar-day-dot" />}
                  </div>
                );
              })}
            </div>
            <div className="calendar-bulk">
              <span className="bulk-label">Hromadné akce:</span>
              <form action={studioApplyMonthBulk} style={{ display: 'inline' }}>
                <input type="hidden" name="month" value={currentMonth} />
                <input type="hidden" name="month_action" value="next_week_off" />
                <button type="submit" className="bulk-btn">Příští týden volno</button>
              </form>
              <form action={studioApplyMonthBulk} style={{ display: 'inline' }}>
                <input type="hidden" name="month" value={currentMonth} />
                <input type="hidden" name="month_action" value="clear_month" />
                <button type="submit" className="bulk-btn bulk-btn-danger">Smazat override v {MONTH_CS[monN - 1]}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
