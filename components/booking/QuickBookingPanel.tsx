'use client';

import { useState, useTransition } from 'react';
import type { GirlSummary, DaySchedule, ClientSearchResult } from '@/lib/booking-actions';
import { searchClient, createClient, getAvailableSlots, createBooking } from '@/lib/booking-actions';

interface PricingPlan {
  duration: number;
  price: number;
}

interface Props {
  girls: GirlSummary[];
  weekSchedules: Record<number, DaySchedule[]>;
  pricingPlans: PricingPlan[];
  today: string;
}

const STYLES = `
.qb { max-width: 960px; }
.qb-title {
  font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
  margin-bottom: 20px; display: flex; align-items: center; gap: 12px;
}
.qb-title a {
  font-size: 12px; color: var(--muted); text-decoration: none;
  padding: 4px 10px; border: 1px solid var(--line); border-radius: 6px;
}
.qb-title a:hover { color: var(--text); border-color: var(--muted); }

.qb-section {
  margin-bottom: 20px; padding: 16px;
  background: var(--bg-soft); border: 1px solid var(--line); border-radius: 10px;
}
.qb-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--dim); margin-bottom: 10px;
}

/* Girls grid */
.qb-girls { display: flex; flex-wrap: wrap; gap: 6px; }
.qb-girl {
  padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
  background: var(--bg-elev); border: 1px solid var(--line); color: var(--text);
  cursor: pointer; transition: all 0.1s;
}
.qb-girl:hover { border-color: var(--coral); color: var(--coral); }
.qb-girl.active { background: rgba(242,125,141,0.15); border-color: var(--coral); color: var(--coral); }

/* Schedule grid */
.qb-days { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; }
.qb-day {
  padding: 10px 12px; border-radius: 8px; text-align: center;
  background: var(--bg-elev); border: 1px solid var(--line);
  cursor: pointer; transition: all 0.1s;
}
.qb-day:hover:not(.disabled) { border-color: var(--coral); }
.qb-day.active { background: rgba(242,125,141,0.15); border-color: var(--coral); }
.qb-day.disabled { opacity: 0.35; cursor: default; }
.qb-day-label { font-size: 13px; font-weight: 700; color: var(--text); }
.qb-day-shift { font-size: 11px; color: var(--muted); margin-top: 2px; }
.qb-day.disabled .qb-day-shift { color: var(--dim); }

/* Time slots */
.qb-times { display: flex; flex-wrap: wrap; gap: 6px; }
.qb-time {
  padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--bg-elev); border: 1px solid var(--line); color: var(--text);
  cursor: pointer; transition: all 0.1s;
}
.qb-time:hover:not(.unavail) { border-color: var(--coral); color: var(--coral); }
.qb-time.active { background: rgba(242,125,141,0.15); border-color: var(--coral); color: var(--coral); }
.qb-time.unavail { opacity: 0.25; cursor: default; text-decoration: line-through; }

/* Duration pills */
.qb-durations { display: flex; gap: 6px; flex-wrap: wrap; }
.qb-dur {
  padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
  background: var(--bg-elev); border: 1px solid var(--line); color: var(--text);
  cursor: pointer; transition: all 0.1s;
}
.qb-dur:hover { border-color: var(--blue); color: var(--blue); }
.qb-dur.active { background: rgba(96,165,250,0.15); border-color: var(--blue); color: var(--blue); }
.qb-dur-price { font-size: 11px; color: var(--muted); margin-left: 4px; }

/* Client search */
.qb-client-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.qb-input {
  padding: 8px 12px; border-radius: 8px; font-size: 13px;
  background: var(--bg-elev); border: 1px solid var(--line); color: var(--text);
  font-family: inherit; outline: none; width: 200px;
}
.qb-input:focus { border-color: var(--coral); }
.qb-btn-sm {
  padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
  background: var(--bg-elev); border: 1px solid var(--line); color: var(--text);
  cursor: pointer; font-family: inherit; transition: all 0.1s;
}
.qb-btn-sm:hover { border-color: var(--coral); color: var(--coral); }
.qb-client-info {
  font-size: 12px; color: var(--green); font-weight: 600;
  display: flex; align-items: center; gap: 6px;
}
.qb-client-meta { font-size: 11px; color: var(--muted); font-weight: 400; }
.qb-client-err { font-size: 12px; color: var(--yellow); }

/* Notes */
.qb-notes {
  width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  background: var(--bg-elev); border: 1px solid var(--line); color: var(--text);
  font-family: inherit; outline: none; resize: vertical; min-height: 36px;
}
.qb-notes:focus { border-color: var(--coral); }

/* Summary + Submit */
.qb-summary {
  padding: 16px; background: var(--bg-soft); border: 1px solid var(--line);
  border-radius: 10px; margin-bottom: 12px;
}
.qb-summary-text { font-size: 14px; font-weight: 600; }
.qb-submit {
  width: 100%; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 800;
  background: var(--coral); border: none; color: #fff; cursor: pointer;
  font-family: inherit; text-transform: uppercase; letter-spacing: 0.04em;
  transition: opacity 0.1s;
}
.qb-submit:hover { opacity: 0.9; }
.qb-submit:disabled { opacity: 0.3; cursor: default; }

.qb-success {
  padding: 16px; background: rgba(74,222,128,0.1); border: 1px solid var(--green);
  border-radius: 10px; text-align: center; font-weight: 600; color: var(--green);
}
.qb-error {
  padding: 12px 16px; background: rgba(239,68,68,0.1); border: 1px solid var(--red);
  border-radius: 8px; font-size: 13px; color: var(--red); margin-bottom: 12px;
}

.qb-row { display: flex; gap: 16px; }
.qb-row > * { flex: 1; }
@media (max-width: 640px) { .qb-row { flex-direction: column; } }

.qb-loading { color: var(--muted); font-size: 13px; font-style: italic; }
`;

export default function QuickBookingPanel({ girls, weekSchedules, pricingPlans, today }: Props) {
  const [selectedGirlId, setSelectedGirlId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [clientQuery, setClientQuery] = useState('');
  const [client, setClient] = useState<ClientSearchResult | null>(null);
  const [clientSearched, setClientSearched] = useState(false);
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isLoadingSlots, startSlotTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();

  const selectedGirl = girls.find((g) => g.id === selectedGirlId);
  const girlSchedule = selectedGirlId ? (weekSchedules[selectedGirlId] ?? []) : [];
  const selectedDayInfo = girlSchedule.find((d) => d.date === selectedDate);

  function selectGirl(id: number) {
    setSelectedGirlId(id);
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setError(null);
    setSuccessId(null);
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    setError(null);
    // Load slots
    if (selectedGirlId) {
      startSlotTransition(async () => {
        const s = await getAvailableSlots(selectedGirlId, date, duration);
        setSlots(s);
      });
    }
  }

  function selectDuration(d: number) {
    setDuration(d);
    setSelectedTime(null);
    setError(null);
    // Reload slots for new duration
    if (selectedGirlId && selectedDate) {
      startSlotTransition(async () => {
        const s = await getAvailableSlots(selectedGirlId, selectedDate, d);
        setSlots(s);
      });
    }
  }

  function handleSearchClient() {
    if (!clientQuery.trim()) return;
    startSearchTransition(async () => {
      const result = await searchClient(clientQuery.trim());
      setClient(result);
      setClientSearched(true);
    });
  }

  function handleCreateClient() {
    if (!clientQuery.trim()) return;
    startSearchTransition(async () => {
      const result = await createClient(clientQuery.trim(), 'phone');
      setClient({
        id: result.id,
        clientNumber: result.clientNumber,
        nickname: clientQuery.trim(),
        trustLevel: 'new',
        totalVisits: 0,
        noShowCount: 0,
        telegramId: null,
        lastVisitDate: null,
        lastVisitGirl: null,
      });
      setClientSearched(true);
    });
  }

  function handleSubmit() {
    if (!selectedGirlId || !selectedDate || !selectedTime || !client) return;
    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        clientId: client.id,
        girlId: selectedGirlId,
        date: selectedDate,
        startTime: selectedTime,
        durationMinutes: duration,
        channel: 'phone',
        notes: notes || undefined,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        setSuccessId(result.id);
      }
    });
  }

  function handleReset() {
    setSelectedGirlId(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setDuration(60);
    setClientQuery('');
    setClient(null);
    setClientSearched(false);
    setNotes('');
    setSlots([]);
    setSuccessId(null);
    setError(null);
  }

  // Compute end time for summary
  const endTime = selectedTime ? (() => {
    const [h, m] = selectedTime.split(':').map(Number);
    const total = h * 60 + m + duration;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })() : null;

  const canSubmit = selectedGirlId && selectedDate && selectedTime && client && !isPending;
  const selectedPlan = pricingPlans.find((p) => p.duration === duration);

  if (successId) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className="qb">
          <div className="qb-title">RYCHLA REZERVACE</div>
          <div className="qb-success">
            Rezervace #{successId} vytvorena
            {selectedGirl && selectedDayInfo && selectedTime && (
              <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text)' }}>
                {selectedGirl.name} &middot; {selectedDayInfo.dateLabel} &middot; {selectedTime}&#8211;{endTime} &middot; {duration} min
                {client && <> &middot; {client.nickname}</>}
              </div>
            )}
          </div>
          <button className="qb-submit" style={{ marginTop: 16 }} onClick={handleReset}>
            NOVA REZERVACE
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="qb">
        <div className="qb-title">
          RYCHLA REZERVACE
          <a href="/booking/calendar">Kalendar</a>
        </div>

        {/* GIRLS */}
        <div className="qb-section">
          <div className="qb-label">Divka</div>
          <div className="qb-girls">
            {girls.map((g) => (
              <button
                key={g.id}
                className={`qb-girl${selectedGirlId === g.id ? ' active' : ''}`}
                onClick={() => selectGirl(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* SCHEDULE — show after girl selected */}
        {selectedGirlId && (
          <div className="qb-section">
            <div className="qb-label">Smeny &mdash; {selectedGirl?.name}</div>
            <div className="qb-days">
              {girlSchedule.map((day) => {
                const isWorking = day.shiftStart && day.shiftEnd;
                const isActive = selectedDate === day.date;
                const isToday = day.date === today;
                return (
                  <div
                    key={day.date}
                    className={`qb-day${isActive ? ' active' : ''}${!isWorking ? ' disabled' : ''}`}
                    onClick={() => isWorking && selectDate(day.date)}
                  >
                    <div className="qb-day-label">
                      {isToday ? 'DNES' : ''} {day.dateLabel}
                    </div>
                    <div className="qb-day-shift">
                      {isWorking ? `${day.shiftStart}\u2013${day.shiftEnd}` : '\u2014'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TIME + DURATION — show after date selected */}
        {selectedDate && selectedDayInfo && (
          <div className="qb-section">
            <div className="qb-row">
              <div>
                <div className="qb-label">
                  Cas &mdash; {selectedDayInfo.dateLabel} ({selectedDayInfo.shiftStart}&ndash;{selectedDayInfo.shiftEnd})
                </div>
                {isLoadingSlots ? (
                  <div className="qb-loading">Nacitam...</div>
                ) : (
                  <div className="qb-times">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        className={`qb-time${selectedTime === s.time ? ' active' : ''}${!s.available ? ' unavail' : ''}`}
                        onClick={() => s.available && setSelectedTime(s.time)}
                        disabled={!s.available}
                      >
                        {s.time}
                      </button>
                    ))}
                    {slots.length === 0 && <div className="qb-loading">Zadne volne sloty</div>}
                  </div>
                )}
              </div>
              <div style={{ maxWidth: 200 }}>
                <div className="qb-label">Program</div>
                <div className="qb-durations">
                  {pricingPlans.map((p) => (
                    <button
                      key={p.duration}
                      className={`qb-dur${duration === p.duration ? ' active' : ''}`}
                      onClick={() => selectDuration(p.duration)}
                    >
                      {p.duration} min
                      <span className="qb-dur-price">{p.price} Kc</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLIENT + NOTES */}
        <div className="qb-section">
          <div className="qb-row">
            <div>
              <div className="qb-label">Klient</div>
              <div className="qb-client-row">
                <input
                  className="qb-input"
                  placeholder="Jmeno nebo kod klienta"
                  value={clientQuery}
                  onChange={(e) => { setClientQuery(e.target.value); setClientSearched(false); setClient(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClient()}
                />
                <button className="qb-btn-sm" onClick={handleSearchClient} disabled={isSearching}>
                  {isSearching ? '...' : 'Hledat'}
                </button>
                {clientSearched && !client && (
                  <button className="qb-btn-sm" onClick={handleCreateClient} disabled={isSearching}>
                    + Novy
                  </button>
                )}
              </div>
              {client && (
                <div className="qb-client-info" style={{ marginTop: 8 }}>
                  {client.nickname} ({client.clientNumber})
                  <span className="qb-client-meta">
                    {client.trustLevel} &middot; {client.totalVisits} navstev
                    {client.lastVisitGirl && <> &middot; posl. {client.lastVisitGirl}</>}
                  </span>
                </div>
              )}
              {clientSearched && !client && !isSearching && (
                <div className="qb-client-err" style={{ marginTop: 6 }}>
                  Klient nenalezen &mdash; kliknete &quot;+ Novy&quot; pro vytvoreni
                </div>
              )}
            </div>
            <div style={{ maxWidth: 280 }}>
              <div className="qb-label">Poznamka</div>
              <textarea
                className="qb-notes"
                placeholder="Volitelna poznamka..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && <div className="qb-error">{error}</div>}

        {/* SUMMARY + SUBMIT */}
        {(selectedGirl || selectedTime) && (
          <div className="qb-summary">
            <div className="qb-summary-text">
              {selectedGirl?.name ?? '...'}
              {selectedDayInfo && <> &middot; {selectedDayInfo.dateLabel}</>}
              {selectedTime && endTime && <> &middot; {selectedTime}&#8211;{endTime}</>}
              {selectedPlan && <> &middot; {duration} min ({selectedPlan.price} Kc)</>}
              {client && <> &middot; {client.nickname}</>}
            </div>
          </div>
        )}

        <button
          className="qb-submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isPending ? 'VYTVARIM...' : 'VYTVORIT REZERVACI'}
        </button>
      </div>
    </>
  );
}
