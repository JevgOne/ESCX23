import { applyMonthBulk } from '@/app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions';
import { db } from '@/lib/db';
import { pragueDateISO } from '@/lib/utils';

interface Props {
  girlId: number;
  locale: string;
  month: string;
}

const DAY_HEADERS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const MONTH_NAMES_CS = [
  'Leden','Únor','Březen','Duben','Květen','Červen',
  'Červenec','Srpen','Září','Říjen','Listopad','Prosinec',
];

type ExceptionType = 'unavailable' | 'custom_hours';

interface DayOverride {
  exception_type: ExceptionType;
  start_time: string | null;
  end_time: string | null;
}

async function getMonthExceptions(girlId: number, month: string): Promise<Map<string, DayOverride>> {
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const startDate = `${month}-01`;
  const endDate   = `${month}-${String(lastDay).padStart(2, '0')}`;

  const res = await db.execute({
    sql: `SELECT date, exception_type, start_time, end_time
          FROM schedule_exceptions
          WHERE girl_id = ? AND date >= ? AND date <= ?`,
    args: [girlId, startDate, endDate],
  });

  const map = new Map<string, DayOverride>();
  for (const row of res.rows) {
    map.set(String(row.date), {
      exception_type: row.exception_type as ExceptionType,
      start_time: row.start_time ? String(row.start_time) : null,
      end_time:   row.end_time   ? String(row.end_time)   : null,
    });
  }
  return map;
}

function buildCalendarDays(month: string) {
  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  const lastDay  = new Date(year, mon, 0);

  const jsFirstDow = firstDay.getDay();
  const startOffset = jsFirstDow === 0 ? 6 : jsFirstDow - 1;

  const cells: Array<{ date: string | null; dayNum: number | null }> = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: null, dayNum: null });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: dateStr, dayNum: d });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({ date: null, dayNum: null });
    }
  }

  return cells;
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

export default async function CalendarOverride({ girlId, locale, month }: Props) {
  const today = pragueDateISO();
  const exceptions = await getMonthExceptions(girlId, month);
  const cells = buildCalendarDays(month);

  const [yearN, monN] = month.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES_CS[monN - 1]} ${yearN}`;
  const prev = prevMonth(month);
  const next = nextMonth(month);

  return (
    <div className="schedule-section">
      <div className="schedule-section-head">
        <h2 className="schedule-section-title">Kalendář override</h2>
        <p className="schedule-section-sub">Výjimky pro konkrétní dny (přepíše týdenní výchozí)</p>
      </div>

      <div className="calendar-wrap">
        <div className="calendar-nav">
          <a href={`?month=${prev}`} className="calendar-nav-btn">← {MONTH_NAMES_CS[Number(prev.split('-')[1]) - 1]}</a>
          <span className="calendar-month-label">{monthLabel}</span>
          <a href={`?month=${next}`} className="calendar-nav-btn">{MONTH_NAMES_CS[Number(next.split('-')[1]) - 1]} →</a>
        </div>

        <div className="calendar-legend">
          <span className="cal-legend-item cal-legend-available">Dostupná</span>
          <span className="cal-legend-item cal-legend-byappt">Na domluvě</span>
          <span className="cal-legend-item cal-legend-off">Volno</span>
          <span className="cal-legend-item cal-legend-default">Výchozí</span>
        </div>

        <div className="calendar-grid">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}

          {cells.map((cell, idx) => {
            if (!cell.date) {
              return <div key={`empty-${idx}`} className="calendar-day calendar-day-empty" />;
            }

            const override = exceptions.get(cell.date);
            const isPast   = cell.date < today;
            const isToday  = cell.date === today;

            let modClass = '';
            if (override) {
              if (override.exception_type === 'unavailable') modClass = 'has-override-off';
              else modClass = 'has-override-available';
            }
            if (isPast) modClass += ' is-past';
            if (isToday) modClass += ' is-today';

            const href = `/${locale}/admin/divky/${girlId}/dostupnost/den/${cell.date}`;

            return (
              <a
                key={cell.date}
                href={isPast ? undefined : href}
                className={`calendar-day ${modClass}`}
                aria-label={cell.date}
              >
                <span className="calendar-day-num">{cell.dayNum}</span>
                {override && (
                  <span className="calendar-day-dot" />
                )}
              </a>
            );
          })}
        </div>

        <div className="calendar-bulk">
          <span className="bulk-label">Hromadné akce:</span>

          <form action={applyMonthBulk} style={{ display: 'inline' }}>
            <input type="hidden" name="girl_id" value={girlId} />
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="month_action" value="next_week_off" />
            <button type="submit" className="bulk-btn">Příští týden volno</button>
          </form>

          <form action={applyMonthBulk} style={{ display: 'inline' }}>
            <input type="hidden" name="girl_id" value={girlId} />
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="month_action" value="clear_month" />
            <button type="submit" className="bulk-btn bulk-btn-danger">
              Smazat override v {MONTH_NAMES_CS[monN - 1]}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
