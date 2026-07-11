import { saveWeeklySchedule } from '@/app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions';
import { getSchedulesForGirl, getActiveLocations } from '@/lib/queries';
import { displayTime } from '@/lib/utils';

interface Props {
  girlId: number;
}

const DAY_LABELS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DAY_SHORT  = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const PRESETS = [
  { value: 'morning',    label: 'Ranní',       sub: '10:00 – 16:00', from: '10:00', to: '16:00' },
  { value: 'afternoon',  label: 'Odpolední',   sub: '16:30 – 22:30', from: '16:30', to: '22:30' },
  { value: 'fullday',    label: 'Celodenní',   sub: '10:00 – 22:00', from: '10:00', to: '22:00' },
  { value: 'allevening', label: 'Celovečerní', sub: '16:30 – 07:00', from: '16:30', to: '31:00' },
  { value: 'night',      label: 'Noční',       sub: '23:00 – 07:00', from: '23:00', to: '31:00' },
  { value: 'custom',     label: 'Vlastní',     sub: '',               from: '',      to: ''      },
];

function detectPreset(from: string | null, to: string | null): string {
  if (!from || !to) return 'fullday';
  const f = from.substring(0, 5);
  const t = to.substring(0, 5);
  if (f === '10:00' && t === '16:00') return 'morning';
  if (f === '16:30' && t === '22:30') return 'afternoon';
  if (f === '10:00' && t === '22:00') return 'fullday';
  if (f === '16:30' && t === '31:00') return 'allevening';
  if (f === '23:00' && t === '31:00') return 'night';
  return 'custom';
}

export default async function WeeklyScheduleForm({ girlId }: Props) {
  const [schedules, locations] = await Promise.all([
    getSchedulesForGirl(girlId),
    getActiveLocations(),
  ]);

  const schedMap: Record<number, { from: string; to: string; active: boolean; locationId: number | null }> = {};
  for (const s of schedules) {
    const dow = Number(s.day_of_week);
    schedMap[dow] = {
      from: s.start_time ? String(s.start_time).substring(0, 5) : '10:00',
      to:   s.end_time   ? String(s.end_time).substring(0, 5)   : '22:00',
      active: Boolean(s.is_active),
      locationId: s.location_id != null ? Number(s.location_id) : null,
    };
  }

  return (
    <div className="schedule-section">
      <div className="schedule-section-head">
        <h2 className="schedule-section-title">Týdenní rozvrh</h2>
        <p className="schedule-section-sub">Výchozí dostupnost pro každý den v týdnu</p>
      </div>

      <form action={saveWeeklySchedule} className="weekly-form">
        <input type="hidden" name="girl_id" value={girlId} />

        <div className="weekly-schedule">
          {DAY_LABELS.map((dayLabel, i) => {
            const existing = schedMap[i];
            const isActive = existing?.active ?? false;
            const currentPreset = isActive
              ? detectPreset(existing?.from ?? null, existing?.to ?? null)
              : 'fullday';
            const currentFrom = existing?.from ? displayTime(existing.from) : '10:00';
            const currentTo   = existing?.to   ? displayTime(existing.to)   : '22:00';

            return (
              <div key={i} className={`day-row${isActive ? ' active' : ''}`}>
                <div className="day-row-header">
                  <label className="day-toggle">
                    <input
                      type="checkbox"
                      name={`day_${i}_active`}
                      defaultChecked={isActive}
                      className="day-checkbox"
                    />
                    <span className="day-toggle-track">
                      <span className="day-toggle-thumb" />
                    </span>
                  </label>
                  <span className="day-name-full">{dayLabel}</span>
                  <span className="day-name-short">{DAY_SHORT[i]}</span>
                  {!isActive && (
                    <span className="day-off-badge">Volno</span>
                  )}
                </div>

                <div className="day-row-detail">
                  <div className="presets">
                    {PRESETS.map((p) => (
                      <div key={p.value} className="preset-item">
                        <input
                          type="radio"
                          name={`day_${i}_preset`}
                          value={p.value}
                          id={`d${i}-${p.value}`}
                          defaultChecked={currentPreset === p.value}
                        />
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
                      <input
                        type="time"
                        name={`day_${i}_from`}
                        defaultValue={currentFrom}
                        className="time-input"
                      />
                    </div>
                    <span className="time-sep">—</span>
                    <div className="time-input-group">
                      <label className="time-input-label">Do</label>
                      <input
                        type="time"
                        name={`day_${i}_to`}
                        defaultValue={currentTo}
                        className="time-input"
                      />
                    </div>
                  </div>

                  {locations.length > 0 && (
                    <select name={`day_${i}_location`} className="day-location-select" defaultValue={String(existing?.locationId ?? '')}>
                      <option value="">— Pobočka —</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.displayName ?? loc.name}{loc.district ? ` · ${loc.district}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bulk-actions">
          <span className="bulk-label">Hromadně:</span>
          <button type="submit" name="bulk" value="weekdays_same" className="bulk-btn">
            Po–Pá celodenní
          </button>
          <button type="submit" name="bulk" value="weekend_off" className="bulk-btn">
            Víkend volno
          </button>
          <button type="submit" name="bulk" value="reset" className="bulk-btn bulk-btn-danger">
            Reset vše
          </button>
        </div>

        <div className="weekly-form-footer">
          <button type="submit" className="btn-save-week">
            Uložit týden
          </button>
        </div>
      </form>
    </div>
  );
}
