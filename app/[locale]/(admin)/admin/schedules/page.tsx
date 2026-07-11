import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { getAllSchedulesGrouped } from '@/lib/queries';
import { getActiveLocations } from '@/lib/queries';
import {
  addGirlSchedule,
  deleteGirlSchedule,
  deleteAllSchedules,
} from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

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
        .sched-title { font-size: 20px; font-weight: 700; color: var(--color-text); margin: 0; display: flex; align-items: baseline; gap: 10px; }
        .sched-title-count { font-size: 12px; color: var(--color-text-dim); font-weight: 500; padding: 3px 10px; background: var(--color-bg-elev); border-radius: 999px; }
        .sched-actions { display: flex; gap: 8px; }

        .sched-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }

        .sched-cards { display: flex; flex-direction: column; gap: 16px; }

        .sched-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: var(--card-radius);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .sched-card:hover { border-color: var(--color-line-mid); }
        .sched-card-head {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-line);
          background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
        }
        .sched-avatar {
          width: 38px; height: 38px; border-radius: 50%; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0;
          box-shadow: 0 2px 8px -2px rgba(0,0,0,0.4);
        }
        .sched-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sched-card-info { flex: 1; min-width: 0; }
        .sched-card-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
        .sched-card-meta { font-size: 11px; color: var(--color-text-dim); margin-top: 2px; letter-spacing: 0.02em; }

        .sched-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0;
        }
        .sched-grid-day {
          padding: 14px 8px;
          text-align: center;
          border-right: 1px solid var(--color-line);
          min-height: 80px;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          transition: background 0.15s;
        }
        .sched-grid-day:last-child { border-right: none; }
        .sched-grid-day--off { opacity: 0.3; }
        .sched-grid-day--on { background: rgba(242,125,141,0.04); }
        .sched-day-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--color-text-dim);
          padding-bottom: 4px;
        }
        .sched-grid-day--on .sched-day-label { color: var(--color-coral); }
        .sched-day-time {
          font-size: 12px; font-family: ui-monospace, monospace;
          color: var(--color-text-muted); line-height: 1.6;
          background: rgba(255,255,255,0.03);
          padding: 3px 8px; border-radius: 6px;
        }
        .sched-day-loc {
          font-size: 9px; color: var(--color-text-dim); margin-top: 1px;
          text-transform: uppercase; letter-spacing: 0.06em;
        }

        .sched-row-actions {
          display: flex; gap: 4px; padding: 8px 18px;
          border-top: 1px solid var(--color-line);
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .sched-empty {
          text-align: center; padding: 60px 20px;
          color: var(--color-text-dim); font-size: 14px;
          border: 1px dashed var(--color-line); border-radius: var(--card-radius);
          background: var(--color-bg-card);
        }

        /* ── Add modal ── */
        .sched-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 48px 16px; overflow-y: auto;
        }
        .sched-modal {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line-mid);
          border-radius: 20px;
          max-width: 600px; width: 100%;
          box-shadow: 0 32px 80px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
        }
        .sched-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1px solid var(--color-line);
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
          border-radius: 20px 20px 0 0;
        }
        .sched-modal-title {
          font-size: 18px; font-weight: 700; color: var(--color-text);
          display: flex; align-items: center; gap: 10px;
        }
        .sched-modal-title::before {
          content: ''; display: block; width: 4px; height: 18px;
          background: linear-gradient(180deg, var(--color-coral), var(--color-magenta));
          border-radius: 2px;
        }
        .sched-modal-close {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--color-bg-elev); color: var(--color-text-dim);
          text-decoration: none; display: flex; align-items: center; justify-content: center;
          font-size: 18px; line-height: 1; transition: all 0.15s;
          border: 1px solid var(--color-line);
        }
        .sched-modal-close:hover { color: var(--color-text); background: rgba(255,255,255,0.08); }

        .sched-modal-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

        .sched-section { display: flex; flex-direction: column; gap: 12px; }
        .sched-section-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--color-coral);
          display: flex; align-items: center; gap: 8px;
        }
        .sched-section-label::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, var(--color-line-mid), transparent);
        }

        /* Girl selector */
        .sched-girl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .sched-girl-opt { display: block; cursor: pointer; position: relative; }
        .sched-girl-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-girl-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: var(--color-bg-elev);
          border: 1.5px solid var(--color-line);
          border-radius: 10px;
          color: var(--color-text-muted);
          font-size: 13px; font-weight: 500;
          transition: all 0.15s;
        }
        .sched-girl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }
        .sched-girl-opt:hover .sched-girl-chip { border-color: rgba(255,255,255,0.2); color: var(--color-text); background: rgba(255,255,255,0.04); }
        .sched-girl-opt input:checked + .sched-girl-chip {
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          border-color: transparent; color: #fff; font-weight: 600;
          box-shadow: 0 4px 16px -4px rgba(242,125,141,0.5);
        }
        .sched-girl-opt input:checked + .sched-girl-chip .sched-girl-dot { box-shadow: 0 0 8px rgba(255,255,255,0.5); }

        /* Location selector */
        .sched-loc-row { display: flex; gap: 8px; }
        .sched-loc-opt { flex: 1; display: block; cursor: pointer; position: relative; }
        .sched-loc-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-loc-chip {
          display: block; padding: 14px 12px; text-align: center;
          background: var(--color-bg-elev);
          border: 1.5px solid var(--color-line);
          border-radius: 12px;
          color: var(--color-text-muted);
          font-size: 13px; font-weight: 600;
          transition: all 0.15s;
        }
        .sched-loc-opt:hover .sched-loc-chip { border-color: rgba(255,255,255,0.2); color: var(--color-text); }
        .sched-loc-opt input:checked + .sched-loc-chip {
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 16px -4px rgba(242,125,141,0.5);
        }

        /* Day selector */
        .sched-day-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .sched-day-opt { display: block; cursor: pointer; position: relative; }
        .sched-day-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-day-btn {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 14px 4px;
          background: var(--color-bg-elev);
          border: 1.5px solid var(--color-line);
          border-radius: 12px;
          color: var(--color-text-muted);
          font-size: 13px; font-weight: 700;
          transition: all 0.15s;
          position: relative;
        }
        .sched-day-check {
          display: none; position: absolute; top: -5px; right: -5px;
          width: 18px; height: 18px;
          background: var(--color-green); border: 2px solid var(--color-bg-card);
          border-radius: 50%;
          font-size: 9px; color: #fff; font-weight: 700;
          align-items: center; justify-content: center;
        }
        .sched-day-opt:hover .sched-day-btn { border-color: rgba(255,255,255,0.2); color: var(--color-text); transform: translateY(-1px); }
        .sched-day-opt input:checked + .sched-day-btn {
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 16px -4px rgba(242,125,141,0.5);
          transform: scale(1.04);
        }
        .sched-day-opt input:checked + .sched-day-btn .sched-day-check { display: flex; }

        /* Time blocks per selected day */
        .sched-times-stack { display: flex; flex-direction: column; gap: 12px; }
        .sched-time-block {
          display: none;
          background: var(--color-bg-elev);
          border: 1px solid var(--color-line);
          border-radius: 14px; padding: 18px;
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
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .sched-time-head-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          box-shadow: 0 0 8px rgba(242,125,141,0.4);
        }

        .sched-presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
        .sched-preset-opt { display: block; cursor: pointer; position: relative; }
        .sched-preset-opt input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sched-preset-chip {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 12px 8px;
          background: rgba(0,0,0,0.25);
          border: 1.5px solid var(--color-line);
          border-radius: 12px;
          transition: all 0.15s;
        }
        .sched-preset-name { font-size: 12px; font-weight: 700; color: var(--color-text-muted); }
        .sched-preset-time { font-size: 11px; font-family: ui-monospace, monospace; color: var(--color-text-dim); }
        .sched-preset-opt:hover .sched-preset-chip { border-color: rgba(255,255,255,0.15); background: rgba(0,0,0,0.3); }
        .sched-preset-opt input:checked + .sched-preset-chip {
          background: rgba(242,125,141,0.12);
          border-color: var(--color-coral);
          box-shadow: 0 0 0 1px rgba(242,125,141,0.15);
        }
        .sched-preset-opt input:checked + .sched-preset-chip .sched-preset-name { color: var(--color-text); }
        .sched-preset-opt input:checked + .sched-preset-chip .sched-preset-time { color: var(--color-gold); }

        .sched-custom-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          padding-top: 12px; border-top: 1px solid var(--color-line);
        }
        .sched-time-field { display: flex; flex-direction: column; gap: 5px; }
        .sched-time-field label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--color-text-dim);
        }
        .sched-time-field input[type="time"] {
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--color-line-mid);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--color-text);
          font-family: ui-monospace, monospace; font-size: 14px;
        }
        .sched-time-field input[type="time"]:focus {
          border-color: var(--color-coral); outline: none;
          box-shadow: 0 0 0 3px rgba(242,125,141,0.15);
        }

        .sched-empty-times {
          color: var(--color-text-dim); font-size: 12px; font-style: italic;
          padding: 18px; text-align: center;
          background: var(--color-bg-elev);
          border: 1px dashed var(--color-line);
          border-radius: 12px;
        }
        .sched-form:has(input[name^="day_"]:checked) .sched-empty-times { display: none; }

        .sched-modal-foot {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 18px 28px;
          border-top: 1px solid var(--color-line);
          background: linear-gradient(0deg, rgba(255,255,255,0.02) 0%, transparent 100%);
          border-radius: 0 0 20px 20px;
        }

        /* Mobile list — hidden on desktop */
        .sched-mobile-list { display: none; }

        /* ── Responsive <=900px ── */
        @media (max-width: 900px) {
          .sched-header { flex-direction: column; align-items: stretch; gap: 10px; }
          .sched-title { font-size: 17px; }
          .sched-actions { display: flex; gap: 6px; }
          .sched-actions .admin-btn-submit { flex: 1; text-align: center; font-size: 12px; padding: 8px 12px; }
          .sched-actions .admin-btn-danger,
          .sched-actions .admin-btn-secondary { font-size: 11px; padding: 6px 10px; }

          /* Filters — scrollable row */
          .sched-filters { flex-wrap: nowrap; overflow-x: auto; gap: 5px; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }

          /* Hide 7-col grid, show mobile list */
          .sched-grid { display: none !important; }
          .sched-row-actions { display: none !important; }
          .sched-mobile-list { display: flex !important; flex-direction: column; gap: 0; padding: 4px 0; }

          .sched-mob-item {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px;
            border-bottom: 1px solid var(--color-line);
          }
          .sched-mob-item:last-child { border-bottom: none; }

          .sched-mob-badge {
            display: flex; align-items: center; justify-content: center;
            min-width: 38px; height: 28px;
            border-radius: 8px;
            font-size: 11px; font-weight: 800;
            color: #fff; text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .sched-mob-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
          .sched-mob-time {
            font-size: 14px; font-family: ui-monospace, monospace;
            font-weight: 600; color: var(--color-text);
          }
          .sched-mob-loc {
            font-size: 10px; color: var(--color-text-dim);
            letter-spacing: 0.02em;
          }
          .sched-mob-del {
            width: 28px; height: 28px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(239,68,68,0.06);
            border: 1px solid rgba(239,68,68,0.2); border-radius: 8px;
            color: rgba(239,68,68,0.7); font-size: 14px; cursor: pointer;
            flex-shrink: 0;
          }

          /* Card compact */
          .sched-card { border-radius: 12px; }
          .sched-card-head { padding: 10px 14px; }
          .sched-avatar { width: 34px; height: 34px; }
          .sched-card-name { font-size: 14px; }
          .sched-card-meta { font-size: 11px; }

          /* Modal — full screen */
          .sched-overlay { padding: 0; align-items: stretch; }
          .sched-modal { border-radius: 0; max-width: 100%; min-height: 100dvh; display: flex; flex-direction: column; }
          .sched-modal-head { border-radius: 0; padding: 14px 18px; }
          .sched-modal-body { padding: 16px 18px; gap: 16px; flex: 1; overflow-y: auto; }
          .sched-modal-foot { border-radius: 0; padding: 14px 18px; position: sticky; bottom: 0; background: var(--color-bg-card); border-top: 1px solid var(--color-line); }

          .sched-girl-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
          .sched-girl-chip { padding: 8px 10px; font-size: 12px; }
          .sched-loc-row { flex-direction: column; gap: 6px; }
          .sched-loc-chip { padding: 11px 10px; font-size: 12px; }
          .sched-day-grid { grid-template-columns: repeat(7, 1fr); gap: 4px; }
          .sched-day-btn { padding: 10px 2px; font-size: 11px; border-radius: 8px; }
          .sched-day-check { width: 14px; height: 14px; font-size: 7px; top: -4px; right: -4px; }
          .sched-section-label { font-size: 10px; }
          .sched-time-block { padding: 14px; border-radius: 10px; }
          .sched-presets { grid-template-columns: 1fr; gap: 6px; }
          .sched-preset-chip { flex-direction: row; justify-content: space-between; padding: 10px 14px; }
          .sched-custom-row { gap: 8px; }
          .sched-time-field input[type="time"] { padding: 8px 10px; font-size: 13px; }
        }
      `}} />
      <AdminTopbar title="Rozvrhy" />

      {error === 'missing_girl' && (
        <div style={{ padding: '10px 16px', marginBottom: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          Vyberte dívku před přidáním rozvrhu.
        </div>
      )}
      {error === 'no_days' && (
        <div style={{ padding: '10px 16px', marginBottom: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          Vyberte alespoň jeden den.
        </div>
      )}

      <div className="sched-header">
        <h2 className="sched-title">
          Pracovní doba dívek
          <span className="sched-title-count">{totalCount} záznamů</span>
        </h2>
        <div className="sched-actions">
          <form action={deleteAllSchedules} style={{ display: 'inline' }}>
            <input type="hidden" name="girl_id" value="" />
            <button type="submit" className="admin-btn-danger">Smazat vše</button>
          </form>
          <a href="?modal=add" className="admin-btn-submit">+ Přidat rozvrh</a>
        </div>
      </div>

      {/* Girl filter */}
      <div className="sched-filters">
        <a
          href={`/${locale}/admin/schedules`}
          className={`admin-filter-pill${!girlFilter ? ' active' : ''}`}
        >
          Všechny ({withSchedule.length})
        </a>
        {withSchedule.map((d) => (
          <a
            key={d.girlId}
            href={`/${locale}/admin/schedules?girl=${d.girlSlug}`}
            className={`admin-filter-pill${girlFilter === d.girlSlug ? ' active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.girlColor || 'var(--color-pink)', flexShrink: 0 }} />
            {d.girlName}
          </a>
        ))}
      </div>

      {/* Schedule cards */}
      <div className="sched-cards">
        {filtered.length === 0 && (
          <div className="sched-empty">
            Žádné rozvrhy nenalezeny.
          </div>
        )}
        {filtered.map((girl) => {
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
                  <div className="sched-card-meta">{girl.schedules.length} směn</div>
                </div>
                <a href={`/${locale}/admin/schedules?modal=add&prefill_girl=${girl.girlId}`} className="admin-action-btn edit" style={{ textDecoration: 'none' }}>
                  + Přidat
                </a>
              </div>

              <div className="sched-grid">
                {DAY_NAMES.map((dayName, i) => {
                  const daySchedules = byDay.get(i);
                  const isOff = !daySchedules || daySchedules.length === 0;
                  const girlCol = girl.girlColor || 'var(--color-pink)';
                  return (
                    <div
                      key={i}
                      className={`sched-grid-day${isOff ? ' sched-grid-day--off' : ' sched-grid-day--on'}`}
                      style={!isOff ? { background: `${girlCol}0a`, borderTop: `2px solid ${girlCol}` } : undefined}
                    >
                      <span className="sched-day-label" style={!isOff ? { color: girlCol } : undefined}>
                        {dayName.substring(0, 2)}
                      </span>
                      {isOff ? (
                        <span style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>—</span>
                      ) : (
                        daySchedules.map((s) => (
                          <div key={s.id}>
                            <div className="sched-day-time">
                              {s.start_time?.substring(0, 5)}–{s.end_time?.substring(0, 5)}
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

              {/* Mobile: compact list with colored day badges */}
              <div className="sched-mobile-list">
                {girl.schedules.map((s) => (
                  <div key={s.id} className="sched-mob-item">
                    <span className="sched-mob-badge" style={{ background: girl.girlColor || 'var(--color-pink)' }}>
                      {DAY_NAMES[s.day_of_week]?.substring(0, 2)}
                    </span>
                    <div className="sched-mob-info">
                      <span className="sched-mob-time">{s.start_time?.substring(0, 5)} – {s.end_time?.substring(0, 5)}</span>
                      {s.location_name && <span className="sched-mob-loc">{s.location_name}</span>}
                    </div>
                    <form action={deleteGirlSchedule}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="sched-mob-del">×</button>
                    </form>
                  </div>
                ))}
              </div>

              {/* Desktop: delete buttons */}
              <div className="sched-row-actions">
                {girl.schedules.map((s) => (
                  <form key={s.id} action={deleteGirlSchedule} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="admin-action-btn danger" title={`Smazat ${DAY_NAMES[s.day_of_week]} ${s.start_time?.substring(0, 5)}`}>
                      × {DAY_NAMES[s.day_of_week]?.substring(0, 2)}
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
          <form action={addGirlSchedule} className="sched-form" style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column' }}>
            <div className="sched-modal">
              <div className="sched-modal-head">
                <span className="sched-modal-title">Přidat rozvrh</span>
                <a href={`/${locale}/admin/schedules`} className="sched-modal-close">×</a>
              </div>

              <div className="sched-modal-body">
                {/* Step 1: Girl */}
                <div className="sched-section">
                  <div className="sched-section-label">Dívka</div>
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
                </div>

                {/* Step 2: Location */}
                <div className="sched-section">
                  <div className="sched-section-label">Pobočka</div>
                  <div className="sched-loc-row">
                    {locations.map((loc) => (
                      <label key={loc.id} className="sched-loc-opt">
                        <input type="radio" name="location_id" value={loc.id} required />
                        <span className="sched-loc-chip">{loc.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 3: Days */}
                <div className="sched-section">
                  <div className="sched-section-label">Dny</div>
                  <div className="sched-day-grid">
                    {DAY_NAMES.map((dayName, i) => (
                      <label key={i} className="sched-day-opt">
                        <input type="checkbox" name={`day_${i}`} value="1" />
                        <span className="sched-day-btn">
                          <span className="sched-day-check">✓</span>
                          {dayName.substring(0, 3)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 3b: Effective from */}
                <div className="sched-section">
                  <div className="sched-section-label">Platí od (volitelné)</div>
                  <div className="sched-time-field">
                    <label style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Nechat prázdné = platí hned</label>
                    <input type="date" name="effective_from" style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-line-mid)',
                      borderRadius: '10px', padding: '10px 14px', color: 'var(--color-text)',
                      fontSize: '14px', maxWidth: '220px',
                    }} />
                  </div>
                </div>

                {/* Step 4: Time per day */}
                <div className="sched-section">
                  <div className="sched-section-label">Čas</div>

                  <div className="sched-empty-times">
                    Vyberte dny výše a zde se zobrazí nastavení času.
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
                              <span className="sched-preset-name">Ranní</span>
                              <span className="sched-preset-time">10:00 – 16:00</span>
                            </span>
                          </label>
                          <label className="sched-preset-opt">
                            <input type="radio" name={`preset_${i}`} value="odpoledni" />
                            <span className="sched-preset-chip">
                              <span className="sched-preset-name">Odpolední</span>
                              <span className="sched-preset-time">16:30 – 22:30</span>
                            </span>
                          </label>
                          <label className="sched-preset-opt">
                            <input type="radio" name={`preset_${i}`} value="celodenni" defaultChecked />
                            <span className="sched-preset-chip">
                              <span className="sched-preset-name">Celodenní</span>
                              <span className="sched-preset-time">10:00 – 22:00</span>
                            </span>
                          </label>
                          <label className="sched-preset-opt">
                            <input type="radio" name={`preset_${i}`} value="celovecerni" />
                            <span className="sched-preset-chip">
                              <span className="sched-preset-name">Celovečerní</span>
                              <span className="sched-preset-time">16:30 – 07:00</span>
                            </span>
                          </label>
                          <label className="sched-preset-opt">
                            <input type="radio" name={`preset_${i}`} value="nocni" />
                            <span className="sched-preset-chip">
                              <span className="sched-preset-name">Noční</span>
                              <span className="sched-preset-time">23:00 – 07:00</span>
                            </span>
                          </label>
                        </div>

                        <div className="sched-custom-row">
                          <div className="sched-time-field">
                            <label>Od (vlastní)</label>
                            <input type="time" name={`start_${i}`} />
                          </div>
                          <div className="sched-time-field">
                            <label>Do (vlastní)</label>
                            <input type="time" name={`end_${i}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sched-modal-foot">
                <a href={`/${locale}/admin/schedules`} className="admin-btn-secondary" style={{ textDecoration: 'none' }}>Zrušit</a>
                <button type="submit" className="admin-btn-submit">Přidat rozvrh</button>
              </div>
            </div>
            <script dangerouslySetInnerHTML={{ __html: `
              (function(){
                var P={ranni:['10:00','16:00'],odpoledni:['16:30','22:30'],celodenni:['10:00','22:00'],celovecerni:['16:30','07:00'],nocni:['23:00','07:00']};
                document.querySelector('.sched-form').addEventListener('change',function(e){
                  var t=e.target;
                  if(t.type==='radio'&&t.name.startsWith('preset_')){
                    var i=t.name.split('_')[1];
                    var v=P[t.value];
                    if(v){
                      var s=document.querySelector('input[name="start_'+i+'"]');
                      var d=document.querySelector('input[name="end_'+i+'"]');
                      if(s)s.value=v[0];
                      if(d)d.value=v[1];
                    }
                  }
                });
                // Set initial values for defaultChecked presets
                document.querySelectorAll('.sched-form input[type="radio"]:checked').forEach(function(r){
                  if(r.name.startsWith('preset_')){
                    var i=r.name.split('_')[1];
                    var v=P[r.value];
                    if(v){
                      var s=document.querySelector('input[name="start_'+i+'"]');
                      var d=document.querySelector('input[name="end_'+i+'"]');
                      if(s&&!s.value)s.value=v[0];
                      if(d&&!d.value)d.value=v[1];
                    }
                  }
                });
              })();
            `}} />
          </form>
        </div>
      )}
    </>
  );
}
