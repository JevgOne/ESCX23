/**
 * STUDIOFLOW — Create Break/Pause page
 * Server-rendered form with server action.
 * Simplified: select girl, time, duration, optional note.
 */

import { redirect } from 'next/navigation';
import { getCalendarGirls } from '@/lib/booking-queries';
import { createBreak } from '@/lib/booking-actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ date?: string; error?: string }>;
}

export default async function BreakPage({ searchParams }: Props) {
  const params = await searchParams;

  // Default to today (Prague timezone)
  const pragueNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const y = pragueNow.getFullYear();
  const m = String(pragueNow.getMonth() + 1).padStart(2, '0');
  const d = String(pragueNow.getDate()).padStart(2, '0');
  const today = `${y}-${m}-${d}`;

  const dateParam = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? params.date
    : today;

  const error = params.error ?? null;

  // Get girls working on this date
  const allGirls = await getCalendarGirls(dateParam);
  const workingGirls = allGirls.filter(g => g.isWorking);

  // Generate time slots (10:00 - 22:30 by 30 min)
  const timeSlots: string[] = [];
  for (let h = 10; h < 23; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Format date for display
  const dateObj = new Date(dateParam + 'T12:00:00');
  const dateDisplay = dateObj.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function handleCreateBreak(formData: FormData) {
    'use server';

    const girlId = Number(formData.get('girlId'));
    const date = String(formData.get('date'));
    const startTime = String(formData.get('startTime'));
    const durationMinutes = 60; // Pauza je vždy 60 minut
    const notes = String(formData.get('notes') ?? '').trim() || undefined;

    if (!girlId || !date || !startTime) {
      redirect(`/booking/calendar/break?date=${date}&error=Vyplnte+vsechna+pole`);
    }

    const result = await createBreak({ girlId, date, startTime, durationMinutes, notes });

    if ('error' in result) {
      redirect(`/booking/calendar/break?date=${date}&error=${encodeURIComponent(result.error)}`);
    }

    redirect(`/booking/calendar?date=${date}&view=day`);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BREAK_STYLES }} />

      <div className="brk-overlay">
        <div className="brk-card">
          <div className="brk-header">
            <a href={`/booking/calendar?date=${dateParam}&view=day`} className="brk-back">{'\u2190'}</a>
            <h1 className="brk-title">Nova pauza</h1>
            <span className="brk-date">{dateDisplay}</span>
          </div>

          {error && (
            <div className="brk-error">{decodeURIComponent(error)}</div>
          )}

          {workingGirls.length === 0 ? (
            <div className="brk-empty">
              Zadna divka dnes nepracuje.
              <a href={`/booking/calendar?date=${dateParam}&view=day`} className="brk-link">Zpet</a>
            </div>
          ) : (
            <form action={handleCreateBreak} className="brk-form">
              <input type="hidden" name="date" value={dateParam} />

              <label className="brk-label">
                Divka
                <select name="girlId" required className="brk-select">
                  <option value="">Vyber divku...</option>
                  {workingGirls.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.shiftStart} - {g.shiftEnd})
                    </option>
                  ))}
                </select>
              </label>

              <label className="brk-label">
                Cas zacatku
                <select name="startTime" required className="brk-select">
                  {timeSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <div className="brk-info">Délka: 60 minut (fixní)</div>

              <label className="brk-label">
                Poznamka <span className="brk-optional">(nepovinne)</span>
                <input
                  type="text"
                  name="notes"
                  placeholder="Obed, osobni..."
                  className="brk-input"
                  maxLength={200}
                />
              </label>

              <div className="brk-actions">
                <a href={`/booking/calendar?date=${dateParam}&view=day`} className="brk-cancel">Zrusit</a>
                <button type="submit" className="brk-submit">Vytvorit pauzu</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

const BREAK_STYLES = `
.brk-overlay {
  display: flex;
  justify-content: center;
  padding: 20px;
  min-height: 60vh;
}
.brk-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
  height: fit-content;
}
.brk-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.brk-back {
  font-size: 20px;
  color: var(--muted);
  text-decoration: none;
  padding: 4px;
}
.brk-back:hover { color: var(--text); }
.brk-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--teal);
  margin: 0;
}
.brk-date {
  font-size: 13px;
  color: var(--dim);
  margin-left: auto;
}

.brk-error {
  padding: 10px 14px;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 16px;
}

.brk-empty {
  text-align: center;
  color: var(--dim);
  padding: 32px 0;
  font-size: 14px;
}
.brk-link {
  display: block;
  margin-top: 12px;
  color: var(--teal);
  text-decoration: underline;
}

.brk-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.brk-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.brk-optional {
  text-transform: none;
  font-weight: 400;
  color: var(--dim);
  font-size: 11px;
}
.brk-select, .brk-input {
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  width: 100%;
}
.brk-select:focus, .brk-input:focus {
  border-color: var(--teal);
}
.brk-select option {
  background: var(--bg);
  color: var(--text);
}

.brk-info {
  font-size: 13px;
  color: var(--teal);
  font-weight: 600;
  padding: 8px 12px;
  background: rgba(45,212,191,0.08);
  border-radius: 8px;
  border: 1px solid rgba(45,212,191,0.15);
}

.brk-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}
.brk-cancel {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  text-decoration: none;
  border: 1px solid var(--line);
  display: inline-flex;
  align-items: center;
}
.brk-cancel:hover {
  background: rgba(255,255,255,0.04);
  color: var(--text);
}
.brk-submit {
  padding: 10px 24px;
  border-radius: 8px;
  background: var(--teal);
  color: #0c0a0e;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  border: none;
  cursor: pointer;
}
.brk-submit:hover { opacity: 0.9; }

@media (max-width: 768px) {
  .brk-overlay { padding: 12px; }
  .brk-card { padding: 16px; }
  .brk-date { margin-left: 0; width: 100%; }
}
`;
