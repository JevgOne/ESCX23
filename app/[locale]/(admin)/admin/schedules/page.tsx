import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { getAllSchedulesGrouped } from '@/lib/queries';
import { getActiveLocations } from '@/lib/queries';
import {
  addGirlSchedule,
  deleteGirlSchedule,
  deleteAllSchedules,
  fixScheduleColors,
} from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_NAMES = ['Ponděl\u00ed', '\u00dater\u00fd', 'St\u0159eda', '\u010ctvrtek', 'P\u00e1tek', 'Sobota', 'Ned\u011ble'];

export default async function AdminSchedulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ girl?: string; modal?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { girl: girlFilter, modal, error } = await searchParams;
  setRequestLocale(locale);

  const [allData, locations] = await Promise.all([
    getAllSchedulesGrouped(),
    getActiveLocations(),
  ]);

  const withSchedule = allData.filter((d) => d.schedules.length > 0);
  const filtered = girlFilter
    ? withSchedule.filter((d) => d.girlSlug === girlFilter)
    : withSchedule;

  const totalCount = allData.reduce((s, d) => s + d.schedules.length, 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Schedule overview ── */
        .sched-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .sched-title { font-size: 20px; font-weight: 700; color: var(--color-text); margin: 0; }
        .sched-title-count { font-size: 13px; color: var(--color-text-dim); font-weight: 400; margin-left: 8px; }
        .sched-actions { display: flex; gap: 8px; }

        .sched-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }

        .sched-cards { display: flex; flex-direction: column; gap: 16px; }

        .sched-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: var(--card-radius);
          overflow: hidden;
        }
        .sched-card-head {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-line);
        }
        .sched-avatar {
          width: 38px; height: 38px; border-radius: 50%; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .sched-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sched-card-info { flex: 1; min-width: 0; }
        .sched-card-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
        .sched-card-meta { font-size: 12px; color: var(--color-text-dim); margin-top: 1px; }

        .sched-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0;
        }
        .sched-grid-day {
          padding: 12px 10px;
          text-align: center;
          border-right: 1px solid var(--color-line);
          min-height: 72px;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .sched-grid-day:last-child { border-right: none; }
        .sched-grid-day--off { opacity: 0.35; }
        .sched-day-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--color-text-dim);
        }
        .sched-day-time {
          font-size: 12px; font-family: ui-monospace, monospace;
          color: var(--color-text-muted); line-height: 1.5;
        }
        .sched-day-pill {
          display: inline-block; margin-top: 2px;
          padding: 2px 8px; border-radius: 999px;
          font-size: 10px; font-weight: 600;
          background: rgba(242,125,141,0.12); color: var(--color-coral);
        }
        .sched-day-loc {
          font-size: 10px; color: var(--color-text-dim); margin-top: 2px;
        }

        .sched-row-actions {
          display: flex; gap: 4px; padding: 10px 18px;
          border-top: 1px solid var(--color-line);
          justify-content: flex-end;
        }

        .sched-empty {
          text-align: center; padding: 48px 20px;
          color: var(--color-text-dim); font-size: 14px;
          border: 1px dashed var(--color-line); border-radius: var(--card-radius);
        }

        /* ── Add modal ── */
        .sched-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 48px 16px; overflow-y: auto;
        }
        .sched-modal {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line-mid);
          border-radius: 16px;
          max-width: 580px; width: 100%;
          box-shadow: 0 24px 64px -16px rgba(0,0,0,0.7);
        }
        .sched-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--color-line);
        }
        .sched-modal-title { font-size: 18px; font-weight: 700; color: var(--color-text); }
        .sched-modal-close {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--color-bg-elev); color: var(--color-text-dim);
          text-decoration: none; display: flex; align-items: center; justify-content: center;
          font-size: 18px; line-height: 1;
        }
        .sched-modal-close:hover { color: var(--color-text); background: var(--color-bg-card); }

        .sched-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 24px; }

        .sched-fieldset {
          border: 1px solid var(--color-line-mid); border-radius: 12px;
          padding: 16px 20px; background: transparent;
        }
        .sched-legend {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--color-coral); padding: 0 8px;
        }

        /* Girl selector */
        .sched-girl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
        .sched-girl-opt { display: block; cursor: pointer; position: relative; }
        .sched-girl-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-girl-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px;
          background: var(--color-bg-elev);
          border: 1.5px solid var(--color-line-mid);
          border-radius: 10px;
          color: var(--color-text-muted);
          font-size: 13px; font-weight: 500;
          transition: all 0.15s;
        }
        .sched-girl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sched-girl-opt:hover .sched-girl-chip { border-color: rgba(255,255,255,0.2); color: var(--color-text); }
        .sched-girl-opt input:checked + .sched-girl-chip {
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          border-color: transparent; color: #fff; font-weight: 600;
          box-shadow: 0 4px 12px -4px rgba(242,125,141,0.4);
        }

        /* Location selector */
        .sched-loc-row { display: flex; gap: 8px; margin-top: 12px; }
        .sched-loc-opt { flex: 1; display: block; cursor: pointer; position: relative; }
        .sched-loc-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-loc-chip {
          display: block; padding: 12px; text-align: center;
          background: var(--color-bg-elev);
          border: 1.5px solid var(--color-line-mid);
          border-radius: 10px;
          color: var(--color-text-muted);
          font-size: 13px; font-weight: 600;
          transition: all 0.15s;
        }
        .sched-loc-opt:hover .sched-loc-chip { border-color: rgba(255,255,255,0.2); color: var(--color-text); }
        .sched-loc-opt input:checked + .sched-loc-chip {
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 12px -4px rgba(242,125,141,0.4);
        }

        /* Day selector */
        .sched-day-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 12px; }
        .sched-day-opt { display: block; cursor: pointer; position: relative; }
        .sched-day-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-day-btn {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 12px 4px;
          background: var(--color-bg-elev);
          border: 1.5px solid var(--color-line-mid);
          border-radius: 10px;
          color: var(--color-text-muted);
          font-size: 13px; font-weight: 700;
          transition: all 0.15s;
          position: relative;
        }
        .sched-day-check {
          display: none; position: absolute; top: -5px; right: -5px;
          width: 16px; height: 16px;
          background: var(--color-green); border: 2px solid var(--color-bg-card);
          border-radius: 50%;
          font-size: 8px; color: #fff; font-weight: 700;
          align-items: center; justify-content: center;
        }
        .sched-day-opt:hover .sched-day-btn { border-color: rgba(255,255,255,0.2); color: var(--color-text); }
        .sched-day-opt input:checked + .sched-day-btn {
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 12px -4px rgba(242,125,141,0.4);
        }
        .sched-day-opt input:checked + .sched-day-btn .sched-day-check { display: flex; }

        /* Time blocks per selected day */
        .sched-times-stack { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
        .sched-time-block {
          display: none;
          background: var(--color-bg-elev);
          border: 1px solid var(--color-line);
          border-radius: 12px; padding: 16px;
        }
        .sched-form:has(input[name="day_0"]:checked) .sched-time-0,
        .sched-form:has(input[name="day_1"]:checked) .sched-time-1,
        .sched-form:has(input[name="day_2"]:checked) .sched-time-2,
        .sched-form:has(input[name="day_3"]:checked) .sched-time-3,
        .sched-form:has(input[name="day_4"]:checked) .sched-time-4,
        .sched-form:has(input[name="day_5"]:checked) .sched-time-5,
        .sched-form:has(input[name="day_6"]:checked) .sched-time-6 { display: block; }

        .sched-time-head {
          font-size: 13px; font-weight: 700; color: var(--color-text);
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .sched-time-head-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--color-coral);
        }

        .sched-presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
        .sched-preset-opt { display: block; cursor: pointer; position: relative; }
        .sched-preset-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-preset-chip {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 10px 8px;
          background: rgba(0,0,0,0.2);
          border: 1.5px solid var(--color-line);
          border-radius: 10px;
          transition: all 0.15s;
        }
        .sched-preset-name { font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
        .sched-preset-time { font-size: 11px; font-family: ui-monospace, monospace; color: var(--color-text-dim); }
        .sched-preset-opt:hover .sched-preset-chip { border-color: rgba(255,255,255,0.15); }
        .sched-preset-opt input:checked + .sched-preset-chip {
          background: rgba(242,125,141,0.12);
          border-color: var(--color-coral);
        }
        .sched-preset-opt input:checked + .sched-preset-chip .sched-preset-name { color: var(--color-text); }
        .sched-preset-opt input:checked + .sched-preset-chip .sched-preset-time { color: var(--color-gold); }

        .sched-custom-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          padding-top: 10px; border-top: 1px solid var(--color-line);
        }
        .sched-time-field { display: flex; flex-direction: column; gap: 4px; }
        .sched-time-field label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--color-text-dim);
        }
        .sched-time-field input[type="time"] {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line-mid);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--color-text);
          font-family: ui-monospace, monospace; font-size: 13px;
        }
        .sched-time-field input[type="time"]:focus {
          border-color: var(--color-coral); outline: none;
        }

        .sched-empty-times {
          color: var(--color-text-dim); font-size: 12px; font-style: italic;
          padding: 14px; text-align: center;
          background: var(--color-bg-elev);
          border: 1px dashed var(--color-line);
          border-radius: 10px;
        }
        .sched-form:has(input[name^="day_"]:checked) .sched-empty-times { display: none; }

        .sched-modal-foot {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid var(--color-line);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .sched-grid { grid-template-columns: 1fr; }
          .sched-grid-day { border-right: none; border-bottom: 1px solid var(--color-line); flex-direction: row; justify-content: space-between; min-height: auto; }
          .sched-grid-day:last-child { border-bottom: none; }
          .sched-girl-grid { grid-template-columns: repeat(2, 1fr); }
          .sched-day-grid { grid-template-columns: repeat(4, 1fr); }
          .sched-presets { grid-template-columns: 1fr; }
        }
      `}} />
      <AdminTopbar title="Rozvrhy" />

      {error === 'missing_girl' && (
        <div style={{ padding: '10px 16px', marginBottom: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          Vyberte d\u00edvku p\u0159ed p\u0159id\u00e1n\u00edm rozvrhu.
        </div>
      )}
      {error === 'no_days' && (
        <div style={{ padding: '10px 16px', marginBottom: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          Vyberte alespo\u0148 jeden den.
        </div>
      )}

      <div className="sched-header">
        <h2 className="sched-title">
          Pracovn\u00ed doba d\u00edvek
          <span className="sched-title-count">{totalCount} z\u00e1znam\u016f</span>
        </h2>
        <div className="sched-actions">
          <form action={fixScheduleColors} style={{ display: 'inline' }}>
            <button type="submit" className="admin-btn-secondary">Opravit barvy</button>
          </form>
          <form action={deleteAllSchedules} style={{ display: 'inline' }}>
            <input type="hidden" name="girl_id" value="" />
            <button type="submit" className="admin-btn-danger">Smazat v\u0161e</button>
          </form>
          <a href="?modal=add" className="admin-btn-submit">+ P\u0159idat rozvrh</a>
        </div>
      </div>

      {/* Girl filter */}
      <div className="sched-filters">
        <a
          href={`/${locale}/admin/schedules`}
          className={`admin-filter-pill${!girlFilter ? ' active' : ''}`}
        >
          V\u0161echny ({withSchedule.length})
        </a>
        {withSchedule.map((d) => (
          <a
            key={d.girlId}
            href={`/${locale}/admin/schedules?girl=${d.girlSlug}`}
            className={`admin-filter-pill${girlFilter === d.girlSlug ? ' active' : ''}`}
          >
            {d.girlName}
          </a>
        ))}
      </div>

      {/* Schedule cards */}
      <div className="sched-cards">
        {filtered.length === 0 && (
          <div className="sched-empty">
            \u017d\u00e1dn\u00e9 rozvrhy nenalezeny.
          </div>
        )}
        {filtered.map((girl) => {
          // Group schedules by day
          const byDay = new Map<number, typeof girl.schedules>();
          for (const s of girl.schedules) {
            const arr = byDay.get(s.day_of_week) ?? [];
            arr.push(s);
            byDay.set(s.day_of_week, arr);
          }

          return (
            <div key={girl.girlId} className="sched-card">
              <div className="sched-card-head">
                <div className="sched-avatar" style={{ background: girl.girlColor || 'var(--color-pink)' }}>
                  {girl.girlPhoto ? (
                    <img src={girl.girlPhoto} alt={girl.girlName} />
                  ) : (
                    <span>{girl.girlName.charAt(0)}</span>
                  )}
                </div>
                <div className="sched-card-info">
                  <div className="sched-card-name">{girl.girlName}</div>
                  <div className="sched-card-meta">{girl.schedules.length} sm\u011bn</div>
                </div>
                <a href={`/${locale}/admin/schedules?modal=add&prefill_girl=${girl.girlId}`} className="admin-action-btn edit" style={{ textDecoration: 'none' }}>
                  + P\u0159idat
                </a>
              </div>

              <div className="sched-grid">
                {DAY_NAMES.map((dayName, i) => {
                  const daySchedules = byDay.get(i);
                  const isOff = !daySchedules || daySchedules.length === 0;
                  return (
                    <div key={i} className={`sched-grid-day${isOff ? ' sched-grid-day--off' : ''}`}>
                      <span className="sched-day-label">{dayName.substring(0, 2)}</span>
                      {isOff ? (
                        <span style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>Volno</span>
                      ) : (
                        daySchedules.map((s) => (
                          <div key={s.id}>
                            <div className="sched-day-time">
                              {s.start_time?.substring(0, 5)}&ndash;{s.end_time?.substring(0, 5)}
                            </div>
                            {s.location_name && (
                              <div className="sched-day-loc">{s.location_name}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="sched-row-actions">
                {girl.schedules.map((s) => (
                  <form key={s.id} action={deleteGirlSchedule} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="admin-action-btn danger" title={`Smazat ${DAY_NAMES[s.day_of_week]} ${s.start_time?.substring(0, 5)}`}>
                      \u00d7 {DAY_NAMES[s.day_of_week]?.substring(0, 2)}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add schedule modal */}
      {modal === 'add' && (
        <div className="sched-overlay">
          <form action={addGirlSchedule} className="sched-form" style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column' }}>
            <div className="sched-modal">
              <div className="sched-modal-head">
                <span className="sched-modal-title">P\u0159idat rozvrh</span>
                <a href={`/${locale}/admin/schedules`} className="sched-modal-close">\u00d7</a>
              </div>

              <div className="sched-modal-body">
                {/* Step 1: Girl */}
                <fieldset className="sched-fieldset">
                  <legend className="sched-legend">D\u00edvka</legend>
                  <div className="sched-girl-grid">
                    {allData.map((d) => (
                      <label key={d.girlId} className="sched-girl-opt">
                        <input type="radio" name="girl_id" value={d.girlId} required />
                        <span className="sched-girl-chip">
                          <span className="sched-girl-dot" style={{ background: d.girlColor || 'var(--color-pink)' }} />
                          {d.girlName}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Step 2: Location */}
                <fieldset className="sched-fieldset">
                  <legend className="sched-legend">Pobo\u010dka</legend>
                  <div className="sched-loc-row">
                    {locations.map((loc) => (
                      <label key={loc.id} className="sched-loc-opt">
                        <input type="radio" name="location_id" value={loc.id} />
                        <span className="sched-loc-chip">{loc.displayName}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Step 3: Days */}
                <fieldset className="sched-fieldset">
                  <legend className="sched-legend">Dny</legend>
                  <div className="sched-day-grid">
                    {DAY_NAMES.map((dayName, i) => (
                      <label key={i} className="sched-day-opt">
                        <input type="checkbox" name={`day_${i}`} value="1" />
                        <span className="sched-day-btn">
                          <span className="sched-day-check">\u2713</span>
                          {dayName.substring(0, 3)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Step 4: Time per day */}
                <fieldset className="sched-fieldset">
                  <legend className="sched-legend">\u010cas</legend>

                  <div className="sched-empty-times">
                    Vyberte dny v\u00fd\u0161e a zde se zobraz\u00ed nastaven\u00ed \u010dasu.
                  </div>

                  <div className="sched-times-stack">
                    {DAY_NAMES.map((dayName, i) => (
                      <div key={i} className={`sched-time-block sched-time-${i}`}>
                        <div className="sched-time-head">
                          <span className="sched-time-head-dot" />
                          {dayName}
                        </div>

                        <div className="sched-presets">
                          <label className="sched-preset-opt">
                            <input type="radio" name={`preset_${i}`} value="ranni" />
                            <span className="sched-preset-chip">
                              <span className="sched-preset-name">Rann\u00ed</span>
                              <span className="sched-preset-time">10:00 \u2013 16:00</span>
                            </span>
                          </label>
                          <label className="sched-preset-opt">
                            <input type="radio" name={`preset_${i}`} value="odpoledni" />
                            <span className="sched-preset-chip">
                              <span className="sched-preset-name">Odpoledn\u00ed</span>
                              <span className="sched-preset-time">16:30 \u2013 22:30</span>
                            </span>
                          </label>
                          <label className="sched-preset-opt">
                            <input type="radio" name={`preset_${i}`} value="celodenni" defaultChecked />
                            <span className="sched-preset-chip">
                              <span className="sched-preset-name">Celodenn\u00ed</span>
                              <span className="sched-preset-time">10:00 \u2013 22:00</span>
                            </span>
                          </label>
                        </div>

                        <div className="sched-custom-row">
                          <div className="sched-time-field">
                            <label>Od (vlastn\u00ed)</label>
                            <input type="time" name={`start_${i}`} />
                          </div>
                          <div className="sched-time-field">
                            <label>Do (vlastn\u00ed)</label>
                            <input type="time" name={`end_${i}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="sched-modal-foot">
                <a href={`/${locale}/admin/schedules`} className="admin-btn-secondary" style={{ textDecoration: 'none' }}>Zru\u0161it</a>
                <button type="submit" className="admin-btn-submit">P\u0159idat rozvrh</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
