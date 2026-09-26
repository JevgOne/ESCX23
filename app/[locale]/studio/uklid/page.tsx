import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { pragueDateISO, pragueDayOfWeek } from '@/lib/utils';
import { db } from '@/lib/db';
import StudioTopbar from '@/components/studio/StudioTopbar';
import { closeShift, ensureTodayClosure } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHECKLIST_ITEMS = [
  { label: 'Povlečení', desc: 'Sundej použité povlečení, přehoď čisté. Polštáře narovnané.' },
  { label: 'Ručníky', desc: 'Použité ručníky do koše. Čisté ručníky rozložené v koupelně.' },
  { label: 'Koupelna', desc: 'Sprchový kout, umyvadlo a WC vytřené. Žádné vlasy. Zrcadlo čisté.' },
  { label: 'Odpadky', desc: 'Všechny koše vyprázdněné, nový pytel.' },
  { label: 'Povrchy', desc: 'Stůl, noční stolek a komoda utřené, bez skvrn.' },
  { label: 'Podlaha', desc: 'Podlaha zametená/vytřená, žádné nečistoty.' },
  { label: 'Sklenky & nádobí', desc: 'Umyté a uklizené. Žádné použité sklenky v pokoji.' },
  { label: 'Svíčky & deko', desc: 'Svíčky uhašené, dekorace na místě.' },
  { label: 'Klimatizace', desc: 'Vypnutá nebo nastavená na standby (22°C).' },
  { label: 'Okna & žaluzie', desc: 'Místnost vyvětraná, žaluzie v neutrální pozici.' },
  { label: 'Osobní věci', desc: 'Žádné moje osobní věci v pokoji. Vše si beru s sebou.' },
  { label: 'Dveře & zámek', desc: 'Pokoj zamčený, klíč vrácen/na místě.' },
];

const DAY_LABELS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const SHIFT_LABELS: Record<string, string> = {
  morning: 'Ranní směna',
  afternoon: 'Odpolední směna',
  fullday: 'Celodenní směna',
};

function formatDateCz(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export default async function StudioUklidPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  const today = pragueDateISO();
  const dow = pragueDayOfWeek();

  // Check if girl has a schedule today (from girl_schedules or approved shift_requests)
  const todaySchedRes = await db.execute({
    sql: `SELECT start_time, end_time FROM girl_schedules WHERE girl_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1`,
    args: [girlId, dow],
  });

  // Determine shift type from schedule times
  if (todaySchedRes.rows.length > 0) {
    const sched = todaySchedRes.rows[0];
    const startTime = String(sched.start_time).substring(0, 5);
    let shiftType = 'fullday';
    if (startTime === '10:00' && String(sched.end_time).substring(0, 5) === '16:00') shiftType = 'morning';
    else if (startTime === '16:30') shiftType = 'afternoon';
    await ensureTodayClosure(girlId, shiftType);
  }

  // Load all open closures + recent closed ones
  const [openRes, historyRes] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM shift_closures WHERE girl_id = ? AND status = 'open' ORDER BY date DESC`,
      args: [girlId],
    }),
    db.execute({
      sql: `SELECT * FROM shift_closures WHERE girl_id = ? AND status IN ('closed', 'penalty') ORDER BY date DESC LIMIT 14`,
      args: [girlId],
    }),
  ]);

  const openShifts = openRes.rows;
  const history = historyRes.rows;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .uklid-alert {
          padding: 16px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        .uklid-alert.open {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
        }
        .uklid-alert.ok {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          color: #86efac;
        }

        .uklid-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .uklid-card-head {
          padding: 16px 18px;
          border-bottom: 1px solid var(--color-line);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .uklid-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
        }
        .uklid-card-meta {
          font-size: 12px;
          color: var(--color-text-dim);
        }

        .uklid-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-line);
          transition: background 0.15s;
        }
        .uklid-item:last-child { border-bottom: none; }
        .uklid-item:has(input:checked) {
          background: rgba(34,197,94,0.04);
        }

        .uklid-checkbox {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid var(--color-line-mid);
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
          accent-color: var(--color-coral);
        }

        .uklid-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          cursor: pointer;
        }
        .uklid-desc {
          font-size: 12px;
          color: var(--color-text-dim);
          margin-top: 2px;
          line-height: 1.4;
        }

        .uklid-submit {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, var(--color-coral), var(--color-magenta));
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 0 0 14px 14px;
          cursor: pointer;
          transition: opacity 0.15s;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .uklid-submit:hover { opacity: 0.9; }

        .uklid-history-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-dim);
          margin-bottom: 10px;
        }

        .uklid-history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--color-line);
        }
        .uklid-history-item:last-child { border-bottom: none; }
        .uklid-history-date {
          font-size: 13px;
          color: var(--color-text);
          font-weight: 500;
        }
        .uklid-history-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .uklid-history-badge.closed {
          background: rgba(34,197,94,0.15);
          color: #22c55e;
        }
        .uklid-history-badge.penalty {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
        }
      `}} />

      <StudioTopbar title="Úklid" />

      <div className="studio-content">
        {/* Alert banner */}
        {openShifts.length > 0 ? (
          <div className="uklid-alert open">
            Máš {openShifts.length} neuzavřenou {openShifts.length === 1 ? 'směnu' : 'směny'}. Proklikej checklist.
          </div>
        ) : (
          <div className="uklid-alert ok">
            Všechny směny uzavřeny. Dobrá práce!
          </div>
        )}

        {/* Open shift closures */}
        {openShifts.map(shift => {
          const dateStr = String(shift.date);
          const shiftType = String(shift.shift_type);
          const closureId = Number(shift.id);

          return (
            <form key={closureId} action={closeShift}>
              <input type="hidden" name="closure_id" value={closureId} />
              <div className="uklid-card">
                <div className="uklid-card-head">
                  <div>
                    <div className="uklid-card-title">{SHIFT_LABELS[shiftType] ?? shiftType}</div>
                    <div className="uklid-card-meta">{formatDateCz(dateStr)}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'rgba(239,68,68,0.15)',
                    color: '#ef4444',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    Otevřená
                  </span>
                </div>

                {CHECKLIST_ITEMS.map((item, i) => (
                  <label key={i} className="uklid-item">
                    <input
                      type="checkbox"
                      name={`item_${i}`}
                      className="uklid-checkbox"
                    />
                    <input type="hidden" name={`label_${i}`} value={item.label} />
                    <div>
                      <div className="uklid-label">{item.label}</div>
                      <div className="uklid-desc">{item.desc}</div>
                    </div>
                  </label>
                ))}

                <button type="submit" className="uklid-submit">
                  Potvrdit úklid
                </button>
              </div>
            </form>
          );
        })}

        {/* History */}
        {history.length > 0 && (
          <>
            <div className="uklid-history-title">Historie</div>
            <div className="studio-readonly-card">
              {history.map(h => {
                const status = String(h.status);
                const penalty = Number(h.penalty_amount ?? 0);
                return (
                  <div key={Number(h.id)} className="uklid-history-item">
                    <div>
                      <div className="uklid-history-date">
                        {formatDateCz(String(h.date))} — {SHIFT_LABELS[String(h.shift_type)] ?? String(h.shift_type)}
                      </div>
                      {penalty > 0 && (
                        <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                          Pokuta: {penalty} Kč
                        </div>
                      )}
                    </div>
                    <span className={`uklid-history-badge ${status}`}>
                      {status === 'closed' ? 'Uzavřeno' : 'Pokuta'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
