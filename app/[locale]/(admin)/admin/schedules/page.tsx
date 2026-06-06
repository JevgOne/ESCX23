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

const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

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

  // Only girls who have at least 1 schedule
  const withSchedule = allData.filter((d) => d.schedules.length > 0);
  const filtered = girlFilter
    ? withSchedule.filter((d) => d.girlSlug === girlFilter)
    : withSchedule;

  const totalCount = allData.reduce((s, d) => s + d.schedules.length, 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .sch2-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .sch2-page-title { font-size: 22px; font-weight: 700; margin: 0; color: #fff; }
        .sch2-page-header-actions { display: flex; gap: 8px; }
        .sch2-filter-bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
        .sch2-chip { display: inline-flex; align-items: center; padding: 6px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; color: rgba(255,255,255,0.65); font-size: 12.5px; font-weight: 600; text-decoration: none; transition: all 0.15s; }
        .sch2-chip:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .sch2-chip--active { background: linear-gradient(135deg, #f27d8d, #c84b8b) !important; color: #fff !important; border-color: transparent !important; }
        .sch2-cards { display: flex; flex-direction: column; gap: 20px; }
        .sch2-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; }
        .sch2-card-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .sch2-card-avatar { width: 40px !important; height: 40px !important; min-width: 40px; min-height: 40px; max-width: 40px; max-height: 40px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .sch2-card-avatar img { width: 100% !important; height: 100% !important; max-width: 40px; max-height: 40px; object-fit: cover; display: block; }
        .sch2-card-name { font-size: 15px; font-weight: 700; color: #fff; }
        .sch2-card-count { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 1px; }
        .sch2-add-btn { font-size: 12px; font-weight: 600; color: #f27d8d; text-decoration: none; padding: 5px 10px; border: 1px solid rgba(242,125,141,0.3); border-radius: 6px; }
        .sch2-add-btn:hover { background: rgba(242,125,141,0.08); }
        .sch2-filter-box { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px 18px; margin-bottom: 24px; }
        .sch2-filter-label { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.45); font-weight: 700; margin-bottom: 12px; }
        .sch2-filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
        .sch2-fchip { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.78); font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.15s; }
        .sch2-fchip:hover { background: rgba(255,255,255,0.06); color: #fff; border-color: rgba(255,255,255,0.18); }
        .sch2-fchip--all { background: linear-gradient(135deg, #f27d8d, #c84b8b) !important; color: #fff !important; border-color: transparent !important; }
        .sch2-fchip--active { background: linear-gradient(135deg, rgba(242,125,141,0.18), rgba(200,75,139,0.1)) !important; border-color: rgba(242,125,141,0.55) !important; color: #fff !important; }
        .sch2-fchip-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .sch2-rows { padding: 4px 0; }
        .sch2-row { display: grid; grid-template-columns: 140px 1fr 1fr auto; align-items: center; gap: 16px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .sch2-row:last-child { border-bottom: none; }
        .sch2-row-day { font-size: 14px; font-weight: 700; color: #fff; }
        .sch2-row-time { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 14px; color: rgba(255,255,255,0.85); }
        .sch2-row-loc { font-size: 12.5px; color: rgba(255,255,255,0.5); }
        .sch2-row-action { display: flex; justify-content: flex-end; }
        .sch2-del-btn-new { padding: 7px 16px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.35); border-radius: 8px; color: #fca5a5; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .sch2-del-btn-new:hover { background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.5); }
        .sch2-table { width: 100%; border-collapse: collapse; }
        .sch2-table th { text-align: left; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.45); font-weight: 700; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15); }
        .sch2-table td { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.78); font-size: 13px; }
        .sch2-table tr:last-child td { border-bottom: none; }
        .sch2-del-btn { padding: 4px 10px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 5px; color: #fca5a5; font-size: 11.5px; font-weight: 600; cursor: pointer; }
        .sch2-empty-row { padding: 16px; color: rgba(255,255,255,0.4); font-size: 13px; text-align: center; font-style: italic; }
        .sch2-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 60px 20px; overflow-y: auto; }
        .sch2-modal { background: #1a0e15; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; max-width: 540px; width: 100%; box-shadow: 0 30px 70px -20px rgba(0,0,0,0.7); }
        .sch2-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .sch2-modal-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0; }
        .sch2-modal-close { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 18px; padding: 4px 8px; }
        .sch2-modal-close:hover { color: #fff; }
        .sch2-chip-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .sch2-empty { text-align: center; padding: 48px 20px; color: rgba(255,255,255,0.4); font-size: 14px; }
        /* Modal form chips & rows */
        .sch2-radio-chip { display: inline-block; cursor: pointer; }
        .sch2-radio-chip input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sch2-radio-chip span { display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 600; transition: all 0.15s; }
        .sch2-radio-chip:hover span { background: rgba(255,255,255,0.08); color: #fff; }
        .sch2-radio-chip input:checked + span { background: linear-gradient(135deg, #f27d8d, #c84b8b); color: #fff; border-color: transparent; box-shadow: 0 4px 12px -4px rgba(242,125,141,0.5); }
        .sch2-day-row { display: grid; grid-template-columns: 60px 1fr; align-items: center; gap: 12px; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; }
        .sch2-day-check { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .sch2-day-check input { width: 16px; height: 16px; accent-color: #f27d8d; }
        .sch2-day-label { font-weight: 700; color: #fff; font-size: 13px; }
        .sch2-presets { display: flex; flex-wrap: wrap; gap: 4px; }
        .sch2-preset-radio { display: inline-block; cursor: pointer; }
        .sch2-preset-radio input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sch2-preset-radio span { display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 600; transition: all 0.15s; white-space: nowrap; }
        .sch2-preset-radio:hover span { background: rgba(255,255,255,0.08); color: #fff; }
        .sch2-preset-radio input:checked + span { background: rgba(242,125,141,0.18); color: #fbbf24; border-color: rgba(242,125,141,0.45); }
        .sch2-custom-times { display: none; align-items: center; gap: 6px; margin-top: 6px; }
        .sch2-day-row:has(input[value="custom"]:checked) .sch2-custom-times { display: flex; }
        .sch2-custom-times input[type="time"] { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 5px 8px; color: #fff; font-family: monospace; font-size: 12px; }
        .sch2-day-row:not(:has(input[type="checkbox"]:checked)) .sch2-presets,
        .sch2-day-row:not(:has(input[type="checkbox"]:checked)) .sch2-custom-times { opacity: 0.35; pointer-events: none; }
        /* New compact modal layout */
        .sch2-form { display: flex; flex-direction: column; gap: 18px; }
        .sch2-section { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 16px; }
        .sch2-section-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.55); font-weight: 700; margin-bottom: 12px; }
        .sch2-pill-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .sch2-pill { display: inline-block; cursor: pointer; }
        .sch2-pill input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sch2-pill-inner { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 999px; color: rgba(255,255,255,0.78); font-size: 13px; font-weight: 600; transition: all 0.15s; }
        .sch2-pill-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sch2-pill:hover .sch2-pill-inner { background: rgba(255,255,255,0.08); color: #fff; }
        .sch2-pill input:checked + .sch2-pill-inner { background: linear-gradient(135deg, rgba(242,125,141,0.2), rgba(200,75,139,0.12)); border-color: #f27d8d; color: #fff; box-shadow: 0 0 0 1px rgba(242,125,141,0.25); }
        .sch2-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .sch2-day-pill { display: block; cursor: pointer; position: relative; }
        .sch2-day-pill input { position: absolute; opacity: 0; pointer-events: none; }
        .sch2-day-pill span { display: block; padding: 10px 0; text-align: center; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 700; transition: all 0.15s; }
        .sch2-day-pill:hover span { background: rgba(255,255,255,0.08); color: #fff; }
        .sch2-day-pill input:checked + span { background: linear-gradient(135deg, #f27d8d, #c84b8b); color: #fff; border-color: transparent; box-shadow: 0 4px 12px -4px rgba(242,125,141,0.45); }
        .sch2-time-block { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; margin-bottom: 10px; }
        .sch2-time-block:last-child { margin-bottom: 0; }
        .sch2-time-block-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 10px; letter-spacing: 0.04em; }
        .sch2-preset-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
        .sch2-preset { display: block; cursor: pointer; position: relative; }
        .sch2-preset input { position: absolute; opacity: 0; pointer-events: none; }
        .sch2-preset span { display: block; padding: 8px 6px; text-align: center; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.65); font-size: 10.5px; line-height: 1.4; transition: all 0.15s; }
        .sch2-preset span strong { color: rgba(255,255,255,0.9); font-size: 11.5px; }
        .sch2-preset:hover span { background: rgba(255,255,255,0.08); }
        .sch2-preset input:checked + span { background: rgba(242,125,141,0.18); border-color: #f27d8d; color: #fff; }
        .sch2-preset input:checked + span strong { color: #fbbf24; }
        .sch2-custom-times-v2 { display: none; gap: 10px; align-items: end; padding-top: 8px; }
        .sch2-time-block:has(input[value="custom"]:checked) .sch2-custom-times-v2 { display: flex; }
        .sch2-time-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .sch2-time-field label { font-size: 10.5px; color: rgba(255,255,255,0.5); font-weight: 600; }
        .sch2-time-field input[type="time"] { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 7px 10px; color: #fff; font-family: monospace; font-size: 13px; }
        .sch2-modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 4px; padding-top: 16px; }
        .sch2-btn-cancel { padding: 9px 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 600; text-decoration: none; }
        .sch2-btn-save { padding: 9px 20px; background: linear-gradient(135deg, #f27d8d, #c84b8b); border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px -4px rgba(242,125,141,0.5); }
        /* ============= sch3 modal — progressive disclosure ============= */
        .sch3-form { display: flex; flex-direction: column; gap: 14px; }
        .sch3-step { display: grid; grid-template-columns: 36px 1fr; gap: 14px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px 18px; transition: opacity 0.2s; }
        .sch3-step-num { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #f27d8d, #c84b8b); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 800; flex-shrink: 0; }
        .sch3-step-body { min-width: 0; }
        .sch3-step-label { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.6); font-weight: 700; margin-bottom: 12px; }
        .sch3-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .sch3-pill { display: inline-block; cursor: pointer; }
        .sch3-pill input { position: absolute; opacity: 0; pointer-events: none; }
        .sch3-pill span { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 999px; color: rgba(255,255,255,0.78); font-size: 13px; font-weight: 600; transition: all 0.15s; }
        .sch3-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .sch3-pill:hover span { background: rgba(255,255,255,0.08); color: #fff; }
        .sch3-pill input:checked + span { background: linear-gradient(135deg, rgba(242,125,141,0.22), rgba(200,75,139,0.14)); border-color: #f27d8d; color: #fff; box-shadow: 0 0 0 1px rgba(242,125,141,0.25); }
        .sch3-day-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .sch3-day { display: block; cursor: pointer; }
        .sch3-day input { position: absolute; opacity: 0; pointer-events: none; }
        .sch3-day span { display: block; padding: 12px 0; text-align: center; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.72); font-size: 13px; font-weight: 700; transition: all 0.15s; }
        .sch3-day:hover span { background: rgba(255,255,255,0.08); color: #fff; }
        .sch3-day input:checked + span { background: linear-gradient(135deg, #f27d8d, #c84b8b); color: #fff; border-color: transparent; box-shadow: 0 4px 12px -4px rgba(242,125,141,0.5); }
        .sch3-presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .sch3-preset { display: block; cursor: pointer; }
        .sch3-preset input { position: absolute; opacity: 0; pointer-events: none; }
        .sch3-preset span { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.65); transition: all 0.15s; }
        .sch3-preset strong { color: #fff; font-size: 13px; font-weight: 700; }
        .sch3-preset em { font-style: normal; font-size: 11px; color: rgba(255,255,255,0.5); font-family: monospace; }
        .sch3-preset:hover span { background: rgba(255,255,255,0.08); }
        .sch3-preset input:checked + span { background: rgba(242,125,141,0.18); border-color: #f27d8d; }
        .sch3-preset input:checked + span strong { color: #fff; }
        .sch3-preset input:checked + span em { color: #fbbf24; }
        .sch3-custom { display: flex; align-items: end; gap: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
        .sch3-tf { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .sch3-tf label { font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 700; }
        .sch3-tf input[type="time"] { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 9px 12px; color: #fff; font-family: monospace; font-size: 14px; }
        .sch3-tf-sep { color: rgba(255,255,255,0.4); padding-bottom: 9px; }
        /* progressive disclosure: hide step until previous is filled */
        .sch3-step-loc:not(:has(~ * input[name="location_id"]:checked):not(.sch3-form:has(input[name="girl_id"]:checked))) { }
        /* Always show all steps but fade ones missing prereqs */
        .sch3-form:not(:has(input[name="girl_id"]:checked)) .sch3-step-loc,
        .sch3-form:not(:has(input[name="girl_id"]:checked)) .sch3-step-days,
        .sch3-form:not(:has(input[name="girl_id"]:checked)) .sch3-step-time { opacity: 0.4; pointer-events: none; }
        .sch3-form:not(:has(input[name="location_id"]:checked)) .sch3-step-days,
        .sch3-form:not(:has(input[name="location_id"]:checked)) .sch3-step-time { opacity: 0.4; pointer-events: none; }
        .sch3-form:not(:has(input[name^="day_"]:checked)) .sch3-step-time { opacity: 0.4; pointer-events: none; }
        /* per-day time blocks */
        .sch3-day-time { display: none; padding: 14px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-top: 10px; }
        .sch3-day-time:first-of-type { margin-top: 0; }
        .sch3-day-time-head { font-size: 13px; font-weight: 800; color: #fbbf24; letter-spacing: 0.04em; margin-bottom: 12px; padding-left: 4px; }
        .sch3-form:has(input[name="day_0"]:checked) .sch3-day-time-0,
        .sch3-form:has(input[name="day_1"]:checked) .sch3-day-time-1,
        .sch3-form:has(input[name="day_2"]:checked) .sch3-day-time-2,
        .sch3-form:has(input[name="day_3"]:checked) .sch3-day-time-3,
        .sch3-form:has(input[name="day_4"]:checked) .sch3-day-time-4,
        .sch3-form:has(input[name="day_5"]:checked) .sch3-day-time-5,
        .sch3-form:has(input[name="day_6"]:checked) .sch3-day-time-6 { display: block; }
        .sch3-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }
        .sch3-btn-cancel { padding: 11px 22px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: rgba(255,255,255,0.8); font-size: 13.5px; font-weight: 600; text-decoration: none; }
        .sch3-btn-cancel:hover { background: rgba(255,255,255,0.1); }
        .sch3-btn-save { padding: 11px 24px; background: linear-gradient(135deg, #f27d8d, #c84b8b); border: none; border-radius: 10px; color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 18px -6px rgba(242,125,141,0.55); }
        .sch3-btn-save:hover { transform: translateY(-1px); }
        /* ============= Secretstory clone (ss-*) ============= */
        .ss-form { display: flex; flex-direction: column; gap: 18px; }
        .ss-section { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; }
        .ss-label { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #f27d8d; font-weight: 700; margin-bottom: 14px; }
        .ss-girls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .ss-girl { display: block; cursor: pointer; position: relative; }
        .ss-girl input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
        .ss-girl span { display: inline-flex; align-items: center; gap: 7px; padding: 9px 12px; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 999px; color: rgba(255,255,255,0.78); font-size: 12.5px; font-weight: 600; transition: all 0.15s; width: 100%; justify-content: center; }
        .ss-girl span i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ss-girl:hover span { background: rgba(255,255,255,0.06); color: #fff; }
        .ss-girl input:checked + span { background: linear-gradient(135deg, #f27d8d, #c84b8b) !important; border-color: transparent !important; color: #fff !important; box-shadow: 0 4px 14px -4px rgba(242,125,141,0.5); }
        .ss-locs { display: flex; flex-direction: column; gap: 6px; }
        .ss-loc { display: block; cursor: pointer; position: relative; }
        .ss-loc input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
        .ss-loc span { display: block; padding: 13px 16px; text-align: center; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: rgba(255,255,255,0.82); font-size: 13.5px; font-weight: 600; transition: all 0.15s; }
        .ss-loc:hover span { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-loc input:checked + span { background: linear-gradient(135deg, #f27d8d, #c84b8b); color: #fff; border-color: transparent; box-shadow: 0 4px 14px -4px rgba(242,125,141,0.5); }
        .ss-days { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .ss-day { display: block; cursor: pointer; position: relative; }
        .ss-day input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
        .ss-day span { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 13px 0; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: rgba(255,255,255,0.78); font-size: 13.5px; font-weight: 700; transition: all 0.15s; }
        .ss-day-check { opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
        .ss-day:hover span { background: rgba(255,255,255,0.08); color: #fff; }
        .ss-day input:checked + span { background: linear-gradient(135deg, #f27d8d, #c84b8b); color: #fff; border-color: transparent; box-shadow: 0 4px 14px -4px rgba(242,125,141,0.5); }
        .ss-day input:checked + span .ss-day-check { opacity: 1; }
        .ss-presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
        .ss-preset { display: block; cursor: pointer; position: relative; }
        .ss-preset input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
        .ss-preset span { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 13px 8px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; transition: all 0.15s; }
        .ss-preset strong { color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 700; }
        .ss-preset em { font-style: normal; font-size: 11px; color: rgba(255,255,255,0.55); font-family: monospace; }
        .ss-preset:hover span { background: rgba(255,255,255,0.08); }
        .ss-preset input:checked + span { background: linear-gradient(135deg, #f27d8d, #c84b8b); border-color: transparent; box-shadow: 0 4px 14px -4px rgba(242,125,141,0.5); }
        .ss-preset input:checked + span strong { color: #fff; }
        .ss-preset input:checked + span em { color: rgba(255,255,255,0.85); }
        .ss-custom { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ss-tf { display: flex; flex-direction: column; gap: 5px; }
        .ss-tf label { font-size: 11px; color: rgba(255,255,255,0.55); font-weight: 600; }
        .ss-tf input[type="time"] { background: rgba(0,0,0,0.4); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 11px 14px; color: #fff; font-family: monospace; font-size: 14px; }
        .ss-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }
        .ss-btn-cancel { padding: 11px 22px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: rgba(255,255,255,0.8); font-size: 13.5px; font-weight: 600; text-decoration: none; }
        .ss-btn-cancel:hover { background: rgba(255,255,255,0.1); }
        .ss-btn-save { padding: 11px 28px; background: linear-gradient(135deg, #f27d8d, #c84b8b); border: none; border-radius: 10px; color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 18px -6px rgba(242,125,141,0.55); }
        .ss-btn-save:hover { transform: translateY(-1px); }
        /* Per-day timeline visual */
        .ss-day-time { display: none; padding: 14px 14px 12px; background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; margin-bottom: 10px; }
        .ss-day-time:last-child { margin-bottom: 0; }
        .ss-form:has(input[name="day_0"]:checked) .ss-day-time-0,
        .ss-form:has(input[name="day_1"]:checked) .ss-day-time-1,
        .ss-form:has(input[name="day_2"]:checked) .ss-day-time-2,
        .ss-form:has(input[name="day_3"]:checked) .ss-day-time-3,
        .ss-form:has(input[name="day_4"]:checked) .ss-day-time-4,
        .ss-form:has(input[name="day_5"]:checked) .ss-day-time-5,
        .ss-form:has(input[name="day_6"]:checked) .ss-day-time-6 { display: block; }
        .ss-day-time-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 800; color: #fff; letter-spacing: 0.06em; margin-bottom: 12px; text-transform: uppercase; }
        .ss-day-time-head em { font-style: normal; font-size: 11px; color: #f27d8d; font-family: monospace; letter-spacing: 0.02em; text-transform: none; font-weight: 700; }
        .ss-timeline { position: relative; height: 30px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; overflow: hidden; }
        .ss-timeline::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(to right, transparent 0, transparent calc(16.6667% - 1px), rgba(255,255,255,0.08) calc(16.6667% - 1px), rgba(255,255,255,0.08) 16.6667%); pointer-events: none; z-index: 1; }
        .ss-fill { display: none; position: absolute; top: 2px; bottom: 2px; background: linear-gradient(135deg, #f27d8d, #c84b8b); border-radius: 4px; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; font-family: monospace; letter-spacing: 0.04em; box-shadow: 0 2px 12px -3px rgba(242,125,141,0.65); pointer-events: none; z-index: 2; white-space: nowrap; overflow: hidden; }
        .ss-day-time:has(input[value="ranni"]:checked) .ss-fill-ranni { display: flex; left: 41.667%; width: 25%; }
        .ss-day-time:has(input[value="odpoledni"]:checked) .ss-fill-odpoledni { display: flex; left: 68.75%; width: 25%; }
        .ss-day-time:has(input[value="celodenni"]:checked) .ss-fill-celodenni { display: flex; left: 41.667%; width: 50%; }
        .ss-day-time:has(input[value="custom"]:checked) .ss-fill-custom { display: flex; left: 4%; width: 92%; opacity: 0.35; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); box-shadow: none; }
        .ss-timeline-labels { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.4); font-family: monospace; padding: 4px 1px 0; margin-bottom: 10px; }
        .ss-presets-4 { display: grid; grid-template-columns: repeat(4, 1fr) !important; gap: 6px; margin-bottom: 0; }
        .ss-presets-4 .ss-preset span { padding: 9px 4px; }
        .ss-presets-4 .ss-preset strong { font-size: 12px; }
        .ss-presets-4 .ss-preset em { font-size: 10px; }
        .ss-custom-fields { display: none; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 10px; margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.07); }
        .ss-day-time:has(input[value="custom"]:checked) .ss-custom-fields { display: grid; }
        .ss-empty-times { color: rgba(255,255,255,0.45); font-size: 12.5px; font-style: italic; padding: 14px; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 10px; }
        .ss-form:has(input[name^="day_"]:checked) .ss-empty-times { display: none; }
        /* sch4 accordion day rows */
        .sch4-days { display: flex; flex-direction: column; gap: 8px; }
        .sch4-day { display: block; cursor: pointer; position: relative; }
        .sch4-day-check { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .sch4-day-card { background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; transition: all 0.2s; }
        .sch4-day:hover .sch4-day-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.14); }
        .sch4-day-check:checked + .sch4-day-card { background: rgba(242,125,141,0.08); border-color: rgba(242,125,141,0.55); }
        .sch4-day-head { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
        .sch4-day-checkbox { width: 22px; height: 22px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; color: transparent; flex-shrink: 0; transition: all 0.15s; }
        .sch4-day-check:checked + .sch4-day-card .sch4-day-checkbox { background: linear-gradient(135deg, #f27d8d, #c84b8b); border-color: transparent; color: #fff; }
        .sch4-day-name { font-size: 14px; font-weight: 700; color: #fff; flex: 1; }
        .sch4-day-time-preview { font-size: 11.5px; color: rgba(255,255,255,0.4); font-family: monospace; }
        .sch4-day-check:checked + .sch4-day-card .sch4-day-time-preview { color: #fbbf24; }
        .sch4-day-body { display: none; padding: 0 14px 14px; }
        .sch4-day-check:checked + .sch4-day-card .sch4-day-body { display: block; }
        .sch4-presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
        .sch4-preset { display: block; cursor: pointer; position: relative; }
        .sch4-preset input { position: absolute; opacity: 0; pointer-events: none; }
        .sch4-preset span { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 4px; background: rgba(0,0,0,0.3); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 7px; transition: all 0.15s; }
        .sch4-preset strong { color: rgba(255,255,255,0.85); font-size: 11.5px; font-weight: 700; }
        .sch4-preset em { font-style: normal; font-size: 10px; color: rgba(255,255,255,0.5); font-family: monospace; }
        .sch4-preset:hover span { background: rgba(0,0,0,0.4); }
        .sch4-preset input:checked + span { background: linear-gradient(135deg, rgba(242,125,141,0.25), rgba(200,75,139,0.15)); border-color: #f27d8d; }
        .sch4-preset input:checked + span strong { color: #fff; }
        .sch4-preset input:checked + span em { color: #fbbf24; }
        .sch4-custom { display: none; align-items: center; gap: 6px; }
        .sch4-day-body:has(input[value="custom"]:checked) .sch4-custom { display: flex; }
        .sch4-custom input[type="time"] { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 6px 9px; color: #fff; font-family: monospace; font-size: 12.5px; }
        .sch4-custom > span { color: rgba(255,255,255,0.4); }
      `}} />
      <AdminTopbar title="Správa rozvrhů" />

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

      <div className="sch2-page-header">
        <h1 className="sch2-page-title">Pracovní doba dívek</h1>
        <div className="sch2-page-header-actions">
          <form action={fixScheduleColors} style={{ display: 'inline' }}>
            <button type="submit" className="admin-btn-secondary">Opravit barvy</button>
          </form>
          <form action={deleteAllSchedules} style={{ display: 'inline' }}>
            <input type="hidden" name="girl_id" value="" />
            <button
              type="submit"
              className="admin-btn-danger"
             
            >
              Smazat vše
            </button>
          </form>
          <a href="?modal=add" className="admin-btn-submit">+ Přidat rozvrh</a>
        </div>
      </div>

      {/* Girl filter chips */}
      <div className="sch2-filter-box">
        <div className="sch2-filter-label">FILTR PODLE DÍVKY</div>
        <div className="sch2-filter-grid">
          <a
            href={`/${locale}/admin/schedules`}
            className={`sch2-fchip${!girlFilter ? ' sch2-fchip--all' : ''}`}
          >
            Všechny ({withSchedule.length})
          </a>
          {withSchedule.map((d) => (
            <a
              key={d.girlId}
              href={`/${locale}/admin/schedules?girl=${d.girlSlug}`}
              className={`sch2-fchip${girlFilter === d.girlSlug ? ' sch2-fchip--active' : ''}`}
            >
              <span className="sch2-fchip-dot" style={{ background: d.girlColor || '#d94570' }} />
              {d.girlName}
            </a>
          ))}
        </div>
      </div>

      {/* Schedule cards */}
      <div className="sch2-cards">
        {filtered.length === 0 && (
          <div className="sch2-empty">Žádné rozvrhy nenalezeny.</div>
        )}
        {filtered.map((girl) => (
          <div key={girl.girlId} className="sch2-card">
            <div className="sch2-card-head">
              <div className="sch2-card-avatar" style={{ background: girl.girlColor || '#d94570' }}>
                {girl.girlPhoto ? (
                  <img src={girl.girlPhoto} alt={girl.girlName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span>{girl.girlName.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="sch2-card-name">{girl.girlName}</div>
                <div className="sch2-card-count">{girl.schedules.length} rozvrhů</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <a href={`/${locale}/admin/schedules?modal=add&prefill_girl=${girl.girlId}`} className="sch2-add-btn">+ Přidat</a>
              </div>
            </div>

            {girl.schedules.length === 0 ? (
              <div className="sch2-empty-row">Žádné záznamy</div>
            ) : (
              <div className="sch2-rows">
                {girl.schedules.map((s) => (
                  <div key={s.id} className="sch2-row">
                    <div className="sch2-row-day">{DAY_NAMES[s.day_of_week] ?? `Den ${s.day_of_week}`}</div>
                    <div className="sch2-row-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.55 }}>
                        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                      </svg>
                      {s.start_time?.substring(0, 5)} — {s.end_time?.substring(0, 5)}
                    </div>
                    <div className="sch2-row-loc">{s.location_name ?? ''}</div>
                    <form action={deleteGirlSchedule} className="sch2-row-action">
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="sch2-del-btn">Smazat</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Secretstory-style modal — exact 1:1 clone */}
      {modal === 'add' && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            .sx-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto; }
            .sx-modal { background: #231a1e; border-radius: 16px; max-width: 560px; width: 100%; box-shadow: 0 30px 80px -20px rgba(0,0,0,0.8); overflow: hidden; }
            .sx-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .sx-title { font-size: 1.1rem; font-weight: 600; color: #fff; }
            .sx-close { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); color: #9a8a8e; text-decoration: none; display: flex; align-items: center; justify-content: center; font-size: 20px; line-height: 1; }
            .sx-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
            .sx-body { padding: 22px; display: flex; flex-direction: column; gap: 20px; }
            .sx-fg { display: block; }
            .sx-flabel { display: block; font-size: 0.85rem; font-weight: 600; color: #cdb5bb; margin-bottom: 8px; }
            .sx-flabel .sx-count { margin-left: 8px; color: #22c55e; font-size: 0.85rem; }
            .sx-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
            .sx-girl { display: block; cursor: pointer; position: relative; }
            .sx-girl input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
            .sx-girl-card { display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: #1a1418; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; transition: all 0.2s; font-size: 0.8rem; font-weight: 500; color: #ccc; }
            .sx-girl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
            .sx-girl input:checked + .sx-girl-card { background: linear-gradient(135deg, #8b2942 0%, #5c1c2e 100%); border: 2px solid #8b2942; color: #fff; font-weight: 600; padding: 7px 9px; }
            .sx-loc-row { display: flex; gap: 8px; }
            .sx-loc { flex: 1; cursor: pointer; position: relative; display: block; }
            .sx-loc input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
            .sx-loc-btn { display: block; padding: 10px; text-align: center; background: #1a1418; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; color: #9a8a8e; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
            .sx-loc input:checked + .sx-loc-btn { background: linear-gradient(135deg, #8b2942 0%, #5c1c2e 100%); border: 2px solid #8b2942; color: #fff; font-weight: 600; padding: 9px; }
            .sx-day-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
            .sx-day { display: block; cursor: pointer; position: relative; }
            .sx-day input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
            .sx-day-card { display: block; position: relative; padding: 10px 8px; text-align: center; background: #1a1418; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; color: #9a8a8e; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; }
            .sx-day input:checked + .sx-day-card { background: linear-gradient(135deg, #8b2942 0%, #5c1c2e 100%); border: 2px solid #8b2942; color: #fff; font-weight: 600; transform: scale(1.05); padding: 9px 7px; }
            .sx-day-check { display: none; position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: #22c55e; border: 2px solid #231a1e; border-radius: 50%; align-items: center; justify-content: center; font-size: 9px; color: #fff; font-weight: 700; line-height: 1; }
            .sx-day input:checked + .sx-day-card .sx-day-check { display: flex; }
            .sx-times-stack { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
            .sx-day-time { display: none; background: #1a1418; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; }
            .sx-form:has(input[name="day_0"]:checked) .sx-day-time-0,
            .sx-form:has(input[name="day_1"]:checked) .sx-day-time-1,
            .sx-form:has(input[name="day_2"]:checked) .sx-day-time-2,
            .sx-form:has(input[name="day_3"]:checked) .sx-day-time-3,
            .sx-form:has(input[name="day_4"]:checked) .sx-day-time-4,
            .sx-form:has(input[name="day_5"]:checked) .sx-day-time-5,
            .sx-form:has(input[name="day_6"]:checked) .sx-day-time-6 { display: block; }
            .sx-day-time-head { font-size: 0.95rem; font-weight: 600; color: #fff; margin-bottom: 12px; }
            .sx-presets { display: flex; gap: 6px; margin-bottom: 12px; }
            .sx-preset { flex: 1; cursor: pointer; position: relative; display: block; }
            .sx-preset input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
            .sx-preset-card { display: block; padding: 8px 6px; background: #231a1e; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; color: #fff; text-align: center; transition: all 0.2s; }
            .sx-preset-card-title { display: block; font-size: 0.75rem; font-weight: 600; color: #fff; line-height: 1.2; }
            .sx-preset-card-sub { display: block; font-size: 0.7rem; color: #9a8a8e; margin-top: 3px; font-weight: 500; line-height: 1.2; }
            .sx-preset input:checked + .sx-preset-card { background: linear-gradient(135deg, #8b2942 0%, #5c1c2e 100%); border: 2px solid #8b2942; padding: 7px 5px; }
            .sx-preset input:checked + .sx-preset-card .sx-preset-card-sub { color: rgba(255,255,255,0.85); }
            .sx-time-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .sx-time-field label { display: block; font-size: 0.7rem; color: #9a8a8e; margin-bottom: 4px; }
            .sx-time-field input[type="time"] { width: 100%; padding: 8px; background: #231a1e; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; color: #fff; font-size: 0.85rem; font-weight: 600; font-family: ui-monospace, monospace; }
            .sx-time-field input[type="time"]:focus { outline: none; border-color: #8b2942; }
            .sx-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 1px solid rgba(255,255,255,0.05); background: #1a1418; }
            .sx-btn { padding: 10px 22px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
            .sx-btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cdb5bb; text-decoration: none; }
            .sx-btn-secondary:hover { background: rgba(255,255,255,0.08); }
            .sx-btn-primary { background: linear-gradient(135deg, #8b2942 0%, #5c1c2e 100%); border: none; color: #fff; box-shadow: 0 4px 14px -4px rgba(139,41,66,0.5); }
            .sx-btn-primary:hover { transform: translateY(-1px); }
          `}} />
          <div className="sx-overlay">
            <form action={addGirlSchedule} className="sx-form" style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column' }}>
              <div className="sx-modal">
                <div className="sx-header">
                  <span className="sx-title">Přidat rozvrh</span>
                  <a href={`/${locale}/admin/schedules`} className="sx-close">×</a>
                </div>

                <div className="sx-body">
                  {/* Vyberte dívku */}
                  <div className="sx-fg">
                    <label className="sx-flabel">Vyberte dívku</label>
                    <div className="sx-grid-4">
                      {allData.map((d) => (
                        <label key={d.girlId} className="sx-girl">
                          <input type="radio" name="girl_id" value={d.girlId} required />
                          <span className="sx-girl-card">
                            <span className="sx-girl-dot" style={{ background: d.girlColor || '#8b2942' }} />
                            {d.girlName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pobočka */}
                  <div className="sx-fg">
                    <label className="sx-flabel">Pobočka</label>
                    <div className="sx-loc-row">
                      {locations.map((loc) => (
                        <label key={loc.id} className="sx-loc">
                          <input type="radio" name="location_id" value={loc.id} />
                          <span className="sx-loc-btn">{loc.displayName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dny */}
                  <div className="sx-fg">
                    <label className="sx-flabel">Vyberte dny (můžete vybrat více)</label>
                    <div className="sx-day-grid">
                      {DAY_NAMES.map((dayName, i) => (
                        <label key={i} className="sx-day">
                          <input type="checkbox" name={`day_${i}`} value="1" />
                          <span className="sx-day-card">
                            <span className="sx-day-check">✓</span>
                            {dayName.substring(0, 3)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Per-day time blocks */}
                  <div className="sx-times-stack">
                    {DAY_NAMES.map((dayName, i) => (
                      <div key={i} className={`sx-day-time sx-day-time-${i}`}>
                        <div className="sx-day-time-head">{dayName}</div>
                        <div className="sx-presets">
                          <label className="sx-preset">
                            <input type="radio" name={`preset_${i}`} value="ranni" />
                            <span className="sx-preset-card">
                              <span className="sx-preset-card-title">Ranní</span>
                              <span className="sx-preset-card-sub">10:00-16:00</span>
                            </span>
                          </label>
                          <label className="sx-preset">
                            <input type="radio" name={`preset_${i}`} value="odpoledni" />
                            <span className="sx-preset-card">
                              <span className="sx-preset-card-title">Odpolední</span>
                              <span className="sx-preset-card-sub">16:30-22:30</span>
                            </span>
                          </label>
                          <label className="sx-preset">
                            <input type="radio" name={`preset_${i}`} value="celodenni" defaultChecked />
                            <span className="sx-preset-card">
                              <span className="sx-preset-card-title">Celodenní</span>
                              <span className="sx-preset-card-sub">10:00-22:00</span>
                            </span>
                          </label>
                        </div>
                        <div className="sx-time-inputs">
                          <div className="sx-time-field">
                            <label>Od (vlastní)</label>
                            <input type="time" name={`start_${i}`} />
                          </div>
                          <div className="sx-time-field">
                            <label>Do (vlastní)</label>
                            <input type="time" name={`end_${i}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sx-footer">
                  <a href={`/${locale}/admin/schedules`} className="sx-btn sx-btn-secondary">Zrušit</a>
                  <button type="submit" className="sx-btn sx-btn-primary">Přidat</button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
