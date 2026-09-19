'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  searchClient,
  searchClients,
  getAvailableGirls,
  getAvailableSlots,
  createBooking,
  createClient,
  type ClientSearchResult,
  type AvailableGirl,
} from '@/lib/booking-actions';

type Step = 1 | 2 | 3 | 4;
type Channel = 'phone' | 'sms' | 'whatsapp' | 'telegram';

const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'phone', label: 'Telefon' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
];

const DURATIONS = [30, 45, 60, 90, 120];

interface Props {
  initialDate: string;
  initialGirlId: number | null;
}

export default function NewBookingForm({ initialDate, initialGirlId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Multi-step state
  const [step, setStep] = useState<Step>(1);

  // Step 1: Client
  const [clientQuery, setClientQuery] = useState('');
  const [client, setClient] = useState<ClientSearchResult | null>(null);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [channel, setChannel] = useState<Channel>('phone');
  const [suggestions, setSuggestions] = useState<ClientSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Step 2: Girl
  const [date, setDate] = useState(initialDate);
  const [girls, setGirls] = useState<AvailableGirl[]>([]);
  const [selectedGirlId, setSelectedGirlId] = useState<number | null>(initialGirlId);
  const [girlsLoaded, setGirlsLoaded] = useState(false);

  // Step 3: Time
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  // Step 4: Summary
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived
  const selectedGirl = girls.find((g) => g.id === selectedGirlId);
  const isNewClient = client === null && clientNotFound;
  const maxDuration = isNewClient ? 60 : 120;

  // --- Actions ---

  // Autocomplete: debounced search as user types
  const handleClientQueryChange = useCallback((value: string) => {
    setClientQuery(value);
    setClient(null);
    setClientNotFound(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchClients(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
  }, []);

  function selectSuggestion(c: ClientSearchResult) {
    setClient(c);
    setClientQuery(c.nickname);
    setSuggestions([]);
    setShowSuggestions(false);
    setClientNotFound(false);
  }

  function handleSearchClient() {
    startTransition(async () => {
      const result = await searchClient(clientQuery);
      if (result) {
        setClient(result);
        setClientNotFound(false);
      } else {
        setClient(null);
        setClientNotFound(true);
      }
      setShowSuggestions(false);
    });
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleGoToStep2() {
    startTransition(async () => {
      const availableGirls = await getAvailableGirls(date);
      setGirls(availableGirls);
      setGirlsLoaded(true);
      setStep(2);
    });
  }

  function handleGoToStep3() {
    if (!selectedGirlId) return;
    startTransition(async () => {
      const availableSlots = await getAvailableSlots(selectedGirlId!, date, duration);
      setSlots(availableSlots);
      setStep(3);
    });
  }

  function handleDurationChange(newDuration: number) {
    setDuration(newDuration);
    setSelectedTime(null);
    if (selectedGirlId) {
      startTransition(async () => {
        const availableSlots = await getAvailableSlots(selectedGirlId!, date, newDuration);
        setSlots(availableSlots);
      });
    }
  }

  function handleDateChange(newDate: string) {
    setDate(newDate);
    setGirlsLoaded(false);
    setSelectedGirlId(null);
    setSelectedTime(null);
  }

  async function handleSubmit() {
    if (!selectedGirlId || !selectedTime) return;
    setCreating(true);
    setError(null);

    let clientId = client?.id;

    // Create new client if needed
    if (!clientId && isNewClient && newClientName.trim()) {
      const newClient = await createClient(newClientName.trim(), channel);
      clientId = newClient.id;
    }

    if (!clientId) {
      setError('Klient neni vybran.');
      setCreating(false);
      return;
    }

    const result = await createBooking({
      clientId,
      girlId: selectedGirlId,
      date,
      startTime: selectedTime,
      durationMinutes: duration,
      channel,
      notes: notes.trim() || undefined,
    });

    if ('error' in result) {
      setError(result.error);
      setCreating(false);
      return;
    }

    // Success — redirect to calendar with detail
    router.push(`/booking/calendar?view=day&date=${date}&detail=${result.id}`);
  }

  // Calculate end time for display
  let endTime = '';
  if (selectedTime) {
    const [h, m] = selectedTime.split(':').map(Number);
    const endMin = h * 60 + m + duration;
    endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORM_STYLES }} />
      <div className="nbf-overlay">
        <div className="nbf-modal">
          <div className="nbf-header">
            <span className="nbf-title">Nova rezervace</span>
            <button className="nbf-close" onClick={() => router.back()}>&times;</button>
          </div>

          {/* Steps indicator */}
          <div className="nbf-steps">
            {(['Klient', 'Divka', 'Cas', 'Souhrn'] as const).map((label, i) => {
              const n = (i + 1) as Step;
              const isDone = step > n;
              const isActive = step === n;
              return (
                <div key={n} className={`nbf-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                  <span className="nbf-step-num">{isDone ? '\u2713' : n}</span>
                  {label}
                </div>
              );
            })}
          </div>

          <div className="nbf-body">
            {/* ====== STEP 1: Client ====== */}
            {step === 1 && (
              <>
                <div className="nbf-group" ref={suggestionsRef}>
                  <label className="nbf-label">Vyhledat klienta (kod / jmeno)</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="nbf-input"
                        value={clientQuery}
                        onChange={(e) => handleClientQueryChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClient()}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="242 nebo Josef..."
                        autoComplete="off"
                      />
                      <button className="nbf-btn-search" onClick={handleSearchClient} disabled={isPending}>
                        {isPending ? '...' : 'Hledat'}
                      </button>
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="nbf-suggestions">
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            className="nbf-suggestion"
                            onClick={() => selectSuggestion(s)}
                            type="button"
                          >
                            <span className="nbf-sug-name">{s.nickname}</span>
                            <span className="nbf-sug-code">{s.clientNumber}</span>
                            <span className={`nbf-sug-badge nbf-badge-${s.trustLevel}`}>
                              {s.trustLevel === 'vip' ? 'VIP' : s.trustLevel === 'new' ? 'Novy' : 'Staly'}
                            </span>
                            <span className="nbf-sug-visits">{s.totalVisits}x</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Found client */}
                {client && (
                  <div className="nbf-client-result">
                    <div className="nbf-client-found">
                      <div className="nbf-client-av">{client.nickname.charAt(0)}</div>
                      <div className="nbf-client-info">
                        <div className="nbf-client-name">
                          {client.nickname}
                          <span className={`nbf-badge nbf-badge-${client.trustLevel}`}>
                            {client.trustLevel === 'vip' ? 'VIP' : client.trustLevel === 'new' ? 'Novy' : 'Staly'}
                          </span>
                        </div>
                        <div className="nbf-client-code">{client.clientNumber}</div>
                        <div className="nbf-client-stats">
                          <span>{client.totalVisits} navstev</span>
                          <span>{client.noShowCount} no-shows</span>
                          {client.lastVisitDate && <span>Posl. {client.lastVisitDate}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Client not found — create new */}
                {clientNotFound && (
                  <div className="nbf-client-new">
                    <div className="nbf-info-box blue">Klient nenalezen. Vytvorit novou kartu?</div>
                    <div className="nbf-info-box yellow">
                      <strong>Novy klient — max 60 min.</strong> Programy 90/120 min jsou dostupne az pro stale a VIP klienty.
                    </div>
                    <div className="nbf-group">
                      <label className="nbf-label">Jmeno (prezdivka)</label>
                      <input
                        className="nbf-input"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Petr"
                      />
                    </div>
                  </div>
                )}

                <div className="nbf-group" style={{ marginTop: 16 }}>
                  <label className="nbf-label">Zdroj rezervace</label>
                  <div className="nbf-channels">
                    {CHANNELS.map((ch) => (
                      <button
                        key={ch.value}
                        className={`nbf-channel${channel === ch.value ? ' selected' : ''}`}
                        onClick={() => setChannel(ch.value)}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ====== STEP 2: Girl ====== */}
            {step === 2 && (
              <>
                <div className="nbf-row">
                  <div className="nbf-group">
                    <label className="nbf-label">Datum</label>
                    <input
                      className="nbf-input"
                      type="date"
                      value={date}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                  </div>
                </div>

                {!girlsLoaded && (
                  <button className="nbf-btn-search" onClick={handleGoToStep2}>
                    Nacist divky
                  </button>
                )}

                {girlsLoaded && (
                  <div className="nbf-group">
                    <label className="nbf-label">Dostupne divky pro {date}</label>
                    <div className="nbf-girl-options">
                      {girls.map((g) => (
                        <button
                          key={g.id}
                          className={`nbf-girl-opt${selectedGirlId === g.id ? ' selected' : ''}${!g.isWorking ? ' unavailable' : ''}`}
                          onClick={() => g.isWorking && setSelectedGirlId(g.id)}
                          disabled={!g.isWorking}
                        >
                          <div className="nbf-girl-av">
                            {g.photoUrl
                              ? <img src={g.photoUrl} alt={g.name} width={32} height={32} />
                              : g.name.charAt(0)
                            }
                          </div>
                          <div>
                            <div className="nbf-girl-name">{g.name}</div>
                            <div className="nbf-girl-shift">
                              {g.isWorking
                                ? `Smena ${g.shiftStart} - ${g.shiftEnd}${g.locationName ? ` / ${g.locationName}` : ''}`
                                : `Nepracuje ${date}`
                              }
                            </div>
                          </div>
                          <div className={`nbf-girl-status ${g.isWorking ? 'avail' : 'off'}`}>
                            {g.isWorking
                              ? `Volna ${g.shiftStart}+`
                              : 'Nedostupna'
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ====== STEP 3: Time + Duration ====== */}
            {step === 3 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  {selectedGirl?.name} / {date} / Smena {selectedGirl?.shiftStart} - {selectedGirl?.shiftEnd}
                </div>

                {isNewClient && (
                  <div className="nbf-info-box yellow">
                    <strong>Novy klient ({newClientName || 'unnamed'})</strong> — max 60 min. Pro 90/120 min musi byt staly nebo VIP.
                  </div>
                )}

                <div className="nbf-group">
                  <label className="nbf-label">Program</label>
                  <select
                    className="nbf-select"
                    value={duration}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                  >
                    {DURATIONS.filter((d) => d <= maxDuration).map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                  {isNewClient && (
                    <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                      90 min a 120 min nejsou dostupne pro nove klienty
                    </div>
                  )}
                </div>

                <div className="nbf-group">
                  <label className="nbf-label">Dostupne casy (obsazene preskoceny)</label>
                  <div className="nbf-time-slots">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        className={`nbf-time-btn${selectedTime === s.time ? ' selected' : ''}${!s.available ? ' taken' : ''}`}
                        onClick={() => s.available && setSelectedTime(s.time)}
                        disabled={!s.available}
                      >
                        {s.time}
                      </button>
                    ))}
                    {slots.length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--dim)' }}>
                        {isPending ? 'Nacitam...' : 'Zadne volne sloty'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="nbf-group">
                  <label className="nbf-label">Lokace (z rozvrhu)</label>
                  <div className="nbf-input" style={{ color: 'var(--muted)', cursor: 'default' }}>
                    {selectedGirl?.locationName ?? 'Neurcena'}
                  </div>
                </div>

                <div className="nbf-group">
                  <label className="nbf-label">Poznamky (interni)</label>
                  <input
                    className="nbf-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Volitelna poznamka pro operatorku..."
                  />
                </div>
              </>
            )}

            {/* ====== STEP 4: Summary ====== */}
            {step === 4 && (
              <>
                <div className="nbf-summary">
                  <div className="nbf-sum-row">
                    <span className="nbf-sum-label">Klient</span>
                    <span className="nbf-sum-value">
                      {client ? `${client.nickname} (${client.clientNumber})` : newClientName}
                      {client && (
                        <span className={`nbf-badge nbf-badge-${client.trustLevel}`} style={{ fontSize: 9, marginLeft: 4 }}>
                          {client.trustLevel === 'vip' ? 'VIP' : client.trustLevel === 'new' ? 'Novy' : 'Staly'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="nbf-sum-row">
                    <span className="nbf-sum-label">Divka</span>
                    <span className="nbf-sum-value">{selectedGirl?.name}</span>
                  </div>
                  <div className="nbf-sum-row">
                    <span className="nbf-sum-label">Datum + cas</span>
                    <span className="nbf-sum-value">{date} / {selectedTime} - {endTime}</span>
                  </div>
                  <div className="nbf-sum-row">
                    <span className="nbf-sum-label">Program</span>
                    <span className="nbf-sum-value">{duration} min</span>
                  </div>
                  <div className="nbf-sum-row">
                    <span className="nbf-sum-label">Lokace</span>
                    <span className="nbf-sum-value">{selectedGirl?.locationName ?? 'Neurcena'}</span>
                  </div>
                  <div className="nbf-sum-row">
                    <span className="nbf-sum-label">Zdroj</span>
                    <span className="nbf-sum-value">{CHANNELS.find((c) => c.value === channel)?.label}</span>
                  </div>
                  {notes && (
                    <div className="nbf-sum-row">
                      <span className="nbf-sum-label">Poznamky</span>
                      <span className="nbf-sum-value">{notes}</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="nbf-info-box red" style={{ marginTop: 12 }}>{error}</div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="nbf-footer">
            {step > 1 && (
              <button className="nbf-btn nbf-btn-ghost" onClick={() => setStep((step - 1) as Step)}>
                &larr; Zpet
              </button>
            )}
            {step === 1 && (
              <button className="nbf-btn nbf-btn-ghost" onClick={() => router.back()}>
                Zrusit
              </button>
            )}

            <div style={{ flex: 1 }} />

            {step === 1 && (
              <button
                className="nbf-btn nbf-btn-primary"
                disabled={!client && !isNewClient}
                onClick={handleGoToStep2}
              >
                Dalsi: Divka &rarr;
              </button>
            )}
            {step === 2 && (
              <button
                className="nbf-btn nbf-btn-primary"
                disabled={!selectedGirlId}
                onClick={handleGoToStep3}
              >
                Dalsi: Cas &rarr;
              </button>
            )}
            {step === 3 && (
              <button
                className="nbf-btn nbf-btn-primary"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
              >
                Dalsi: Souhrn &rarr;
              </button>
            )}
            {step === 4 && (
              <button
                className="nbf-btn nbf-btn-success"
                disabled={creating}
                onClick={handleSubmit}
              >
                {creating ? 'Vytvari se...' : 'Vytvorit rezervaci'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const FORM_STYLES = `
.nbf-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
}
.nbf-modal {
  background: var(--bg-soft); border: 1px solid var(--line); border-radius: 16px;
  width: 520px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.nbf-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--line);
}
.nbf-title { font-size: 16px; font-weight: 700; }
.nbf-close { font-size: 20px; color: var(--dim); cursor: pointer; background: none; border: none; font-family: inherit; }

/* Steps */
.nbf-steps {
  display: flex; padding: 0 20px; border-bottom: 1px solid var(--line);
}
.nbf-step {
  flex: 1; padding: 12px 0; text-align: center;
  font-size: 11px; font-weight: 600; color: var(--dim);
  text-transform: uppercase; letter-spacing: 0.05em;
  position: relative;
}
.nbf-step.active { color: var(--coral); }
.nbf-step.active::after {
  content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
  height: 2px; background: var(--coral);
}
.nbf-step.done { color: var(--green); }
.nbf-step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--bg-elev); border: 1px solid var(--line);
  font-size: 10px; margin-right: 4px;
}
.nbf-step.active .nbf-step-num { background: var(--coral); color: #fff; border-color: var(--coral); }
.nbf-step.done .nbf-step-num { background: var(--green); color: #000; border-color: var(--green); }

.nbf-body { padding: 20px; }

/* Form elements */
.nbf-group { margin-bottom: 16px; }
.nbf-label {
  display: block; font-size: 11px; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 6px; font-weight: 600;
}
.nbf-input, .nbf-select {
  width: 100%; padding: 10px 12px;
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 8px; color: var(--text); font-size: 14px;
  outline: none; font-family: inherit;
}
.nbf-input:focus, .nbf-select:focus { border-color: var(--coral); }
.nbf-input::placeholder { color: var(--dim); }

/* Autocomplete suggestions */
.nbf-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-top: 4px;
  z-index: 50;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.nbf-suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--line);
}
.nbf-suggestion:last-child { border-bottom: none; }
.nbf-suggestion:hover { background: var(--bg-elev); }
.nbf-sug-name { font-weight: 600; flex: 1; }
.nbf-sug-code { font-size: 11px; color: var(--dim); }
.nbf-sug-badge {
  display: inline-block; padding: 1px 5px; border-radius: 4px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
}
.nbf-sug-visits { font-size: 10px; color: var(--dim); }
.nbf-row { display: flex; gap: 12px; }
.nbf-row .nbf-group { flex: 1; }

.nbf-btn-search {
  padding: 10px 16px; border-radius: 8px; border: 1px solid var(--line);
  background: var(--bg-elev); color: var(--coral); font-size: 13px;
  font-weight: 600; cursor: pointer; white-space: nowrap; font-family: inherit;
}
.nbf-btn-search:hover { border-color: var(--coral); }
.nbf-btn-search:disabled { opacity: 0.5; cursor: not-allowed; }

/* Client search result */
.nbf-client-result {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 8px; margin-top: 8px; overflow: hidden;
}
.nbf-client-found {
  padding: 12px; display: flex; align-items: center; gap: 12px;
}
.nbf-client-av {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--bg); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--coral); font-size: 14px; flex-shrink: 0;
}
.nbf-client-info { flex: 1; }
.nbf-client-name { font-weight: 600; font-size: 14px; }
.nbf-client-code { font-size: 12px; color: var(--muted); }
.nbf-client-stats { display: flex; gap: 12px; font-size: 11px; color: var(--dim); margin-top: 4px; }

.nbf-badge {
  display: inline-block; padding: 2px 6px; border-radius: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; margin-left: 4px;
}
.nbf-badge-vip { background: rgba(251,191,36,0.2); color: var(--yellow); }
.nbf-badge-regular { background: rgba(74,222,128,0.2); color: var(--green); }
.nbf-badge-new { background: rgba(96,165,250,0.2); color: var(--blue); }
.nbf-badge-verified { background: rgba(167,139,250,0.2); color: #a78bfa; }

/* Info boxes */
.nbf-info-box {
  border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;
  font-size: 12px; display: flex; align-items: center; gap: 8px;
}
.nbf-info-box.blue { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3); color: var(--blue); }
.nbf-info-box.yellow { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); color: var(--yellow); }
.nbf-info-box.red { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--red); }

/* Channel buttons */
.nbf-channels { display: flex; gap: 6px; }
.nbf-channel {
  flex: 1; padding: 10px 8px; border-radius: 8px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); font-size: 12px; text-align: center;
  cursor: pointer; font-weight: 600; font-family: inherit;
}
.nbf-channel.selected { border-color: var(--coral); color: var(--coral); background: rgba(242,125,141,0.08); }

/* Girl options */
.nbf-girl-options { display: flex; flex-direction: column; gap: 6px; }
.nbf-girl-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: var(--bg-elev);
  border: 1px solid var(--line); border-radius: 8px;
  cursor: pointer; font-family: inherit; color: var(--text); text-align: left;
}
.nbf-girl-opt:hover { border-color: var(--coral); }
.nbf-girl-opt.selected { border-color: var(--coral); background: rgba(242,125,141,0.08); }
.nbf-girl-opt.unavailable { opacity: 0.35; cursor: not-allowed; }
.nbf-girl-av {
  width: 32px; height: 32px; border-radius: 50%; background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--coral); font-size: 12px;
  overflow: hidden; flex-shrink: 0;
}
.nbf-girl-av img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.nbf-girl-name { font-weight: 600; font-size: 13px; }
.nbf-girl-shift { font-size: 11px; color: var(--muted); }
.nbf-girl-status { margin-left: auto; font-size: 10px; }
.nbf-girl-status.avail { color: var(--green); }
.nbf-girl-status.off { color: var(--dim); }

/* Time slots */
.nbf-time-slots { display: flex; flex-wrap: wrap; gap: 6px; }
.nbf-time-btn {
  padding: 8px 14px; border-radius: 8px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--text); font-size: 13px; cursor: pointer; font-family: inherit;
}
.nbf-time-btn:hover:not(:disabled) { border-color: var(--coral); }
.nbf-time-btn.selected { background: var(--coral); color: #fff; border-color: var(--coral); }
.nbf-time-btn.taken { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }

/* Summary */
.nbf-summary {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 10px; padding: 16px;
}
.nbf-sum-row {
  display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;
}
.nbf-sum-label { color: var(--muted); }
.nbf-sum-value { font-weight: 600; }

/* Footer */
.nbf-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-top: 1px solid var(--line);
}
.nbf-btn {
  padding: 10px 20px; border-radius: 8px; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.nbf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.nbf-btn-primary { background: var(--coral); color: #fff; }
.nbf-btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--line); }
.nbf-btn-success { background: var(--green); color: #000; font-size: 14px; padding: 12px 28px; }
`;
