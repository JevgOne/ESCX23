'use client';

import type { CalendarBooking } from '@/lib/booking-queries';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { updateBookingStatus } from '@/lib/booking-actions';

interface Props {
  booking: CalendarBooking;
  backUrl: string;
}

export default function BookingDetailOverlay({ booking, backUrl }: Props) {
  const router = useRouter();
  const b = booking;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isFinalized = ['completed', 'no_show', 'cancelled_client', 'cancelled_girl', 'declined', 'expired'].includes(b.status);

  const statusLabels: Record<string, string> = {
    confirmed: 'Potvrzena',
    completed: 'Dokoncena',
    in_progress: 'Probiha',
    pending: 'Ceka na potvrzeni',
    no_show: 'No-show',
    cancelled_client: 'Zruseno klientem',
    cancelled_girl: 'Zruseno',
    declined: 'Odmitnuta',
    expired: 'Expirovana',
  };
  const statusLabel = statusLabels[b.status] ?? b.status;

  const statusClass = b.status === 'pending' ? 's-pending'
    : isFinalized ? 's-finalized'
    : 's-confirmed';

  const sourceLabel = b.channel === 'telegram' ? 'Telegram'
    : b.channel === 'whatsapp' ? 'WhatsApp'
    : b.channel === 'admin' ? 'Admin'
    : 'Telefon';

  const sourceColorClass = `src-${b.channel}`;

  const clientInitial = b.clientNickname.charAt(0).toUpperCase();

  const trustLabel = b.clientTrustLevel === 'vip' ? 'VIP'
    : b.clientTrustLevel === 'new' ? 'Novy'
    : b.clientTrustLevel === 'regular' ? 'Staly'
    : 'Novy';

  const trustClass = b.clientTrustLevel === 'vip' ? 'badge-vip'
    : b.clientTrustLevel === 'new' ? 'badge-new'
    : 'badge-regular';

  // Format date for display
  const dObj = new Date(b.date + 'T12:00:00');
  const dayNames = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];
  const dayLabel = dayNames[dObj.getDay()];
  const [, m, d] = b.date.split('-');
  const dateStr = `${dayLabel} ${parseInt(d)}.${parseInt(m)}.`;

  function close() {
    router.push(backUrl);
  }

  function handleAction(newStatus: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(b.id, newStatus);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: OVERLAY_STYLES }} />
      <div className="bdo-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="bdo-panel">
          <div className="bdo-header">
            <span className="bdo-header-title">Rezervace #{b.id}</span>
            <button className="bdo-close" onClick={close}>&times;</button>
          </div>
          <div className={`bdo-status ${statusClass}`}>{statusLabel}</div>
          <div className="bdo-hero">
            <div className="bdo-girl">{b.girlName}</div>
            <div className="bdo-datetime">{dateStr} &middot; {b.startTime} - {b.endTime}</div>
            <div className="bdo-program">
              {b.durationMinutes} min{b.price ? ` / ${b.price.toLocaleString('cs-CZ')} Kc` : ''}
              {b.locationName ? ` \u00b7 ${b.locationName}` : ''}
            </div>
            <div className="bdo-meta">
              <span className={`bdo-src ${sourceColorClass}`}>{sourceLabel}</span>
              {b.pointsEarned > 0 && (
                <span className="bdo-pts">{b.pointsEarned.toLocaleString('cs-CZ')} b</span>
              )}
            </div>
          </div>
          <div className="bdo-client">
            <div className="bdo-client-av">{clientInitial}</div>
            <div>
              <span className="bdo-client-name">{b.clientNickname}</span>
              <span className={`bdo-client-badge ${trustClass}`}>{trustLabel}</span>
            </div>
          </div>
          {isFinalized ? (
            <div className="bdo-finalized">Uzavreno</div>
          ) : (
            <div className="bdo-actions">
              {b.status === 'pending' ? (
                <>
                  <button className="bdo-btn bdo-primary" onClick={() => handleAction('confirmed')} disabled={isPending}>
                    <span className="bdo-icon">&#10003;</span> Potvrdit
                  </button>
                  <button className="bdo-btn" onClick={() => handleAction('rescheduled', 'Presunout rezervaci na jiny cas?')} disabled={isPending}>
                    <span className="bdo-icon">&#8644;</span> Jiny cas
                  </button>
                  <button className="bdo-btn bdo-danger" onClick={() => handleAction('declined', 'Odmitnout rezervaci?')} disabled={isPending} style={{ gridColumn: '1 / -1' }}>
                    <span className="bdo-icon">&#10007;</span> Odmitnout
                  </button>
                </>
              ) : (
                <>
                  <button className="bdo-btn bdo-primary" onClick={() => handleAction('completed')} disabled={isPending}>
                    <span className="bdo-icon">&#10003;</span> Dokonceno
                  </button>
                  <button className="bdo-btn" onClick={() => handleAction('rescheduled', 'Presunout rezervaci?')} disabled={isPending}>
                    <span className="bdo-icon">&#8644;</span> Presunout
                  </button>
                  <button className="bdo-btn bdo-danger" onClick={() => handleAction('no_show', 'Oznacit jako no-show?')} disabled={isPending}>
                    <span className="bdo-icon">&#10007;</span> No-show
                  </button>
                  <button className="bdo-btn bdo-danger" onClick={() => handleAction('cancelled_client', 'Zrusit rezervaci?')} disabled={isPending}>
                    <span className="bdo-icon">&#128465;</span> Zrusit
                  </button>
                </>
              )}
            </div>
          )}
          {error && <div className="bdo-error">{error}</div>}
          {b.notes && (
            <div className="bdo-notes">
              <div className="bdo-notes-label">Poznamky</div>
              <div className="bdo-notes-text">{b.notes}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const OVERLAY_STYLES = `
.bdo-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.6);
  display: flex; justify-content: center; align-items: flex-start;
  padding: 60px 20px;
}
.bdo-panel {
  background: var(--bg-soft); border: 1px solid var(--line); border-radius: 16px;
  width: 440px; max-height: calc(100vh - 120px); overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  animation: bdoSlideUp 0.15s ease-out;
}
@keyframes bdoSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.bdo-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--line);
  background: var(--bg-elev); border-radius: 16px 16px 0 0;
}
.bdo-header-title { font-size: 13px; font-weight: 600; color: var(--muted); }
.bdo-close {
  font-size: 22px; color: var(--dim); cursor: pointer;
  background: none; border: none; line-height: 1;
}
.bdo-close:hover { color: var(--text); }

.bdo-status {
  padding: 12px 24px; font-size: 13px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  display: flex; align-items: center; gap: 8px;
}
.bdo-status.s-confirmed { background: rgba(74,222,128,0.1); color: var(--green); border-bottom: 1px solid rgba(74,222,128,0.15); }
.bdo-status.s-pending { background: rgba(251,191,36,0.1); color: var(--yellow); border-bottom: 1px solid rgba(251,191,36,0.15); }

.bdo-hero { padding: 24px 24px 20px; border-bottom: 1px solid var(--line); }
.bdo-girl { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
.bdo-datetime { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
.bdo-program { font-size: 14px; color: var(--muted); }
.bdo-meta { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; color: var(--dim); }
.bdo-src { font-weight: 600; }
.bdo-src.src-telegram { color: #229ED9; }
.bdo-src.src-whatsapp { color: #25D366; }
.bdo-src.src-phone { color: var(--blue); }
.bdo-src.src-admin { color: var(--purple); }
.bdo-pts { color: var(--yellow); font-weight: 700; }

.bdo-client {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 24px; border-bottom: 1px solid var(--line);
}
.bdo-client-av {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--bg-elev); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--coral); font-size: 13px; flex-shrink: 0;
}
.bdo-client-name { font-weight: 700; font-size: 14px; }
.bdo-client-badge {
  padding: 2px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; margin-left: 6px;
}
.badge-vip { background: rgba(251,191,36,0.2); color: var(--yellow); }
.badge-new { background: rgba(96,165,250,0.2); color: var(--blue); }
.badge-regular { background: rgba(167,139,250,0.2); color: #a78bfa; }

.bdo-actions {
  padding: 20px 24px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.bdo-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 16px 8px;
  background: var(--bg-elev); border: 1px solid var(--line); border-radius: 10px;
  color: var(--text); font-size: 12px; font-weight: 600; cursor: pointer; text-align: center;
  font-family: inherit;
}
.bdo-btn:hover { border-color: var(--coral); }
.bdo-icon { font-size: 22px; }
.bdo-btn.bdo-primary {
  background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.3);
  color: var(--green); grid-column: 1 / -1;
}
.bdo-btn.bdo-primary:hover { border-color: var(--green); background: rgba(74,222,128,0.15); }
.bdo-btn.bdo-danger { color: var(--red); }
.bdo-btn.bdo-danger:hover { border-color: var(--red); }
.bdo-btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

.bdo-status.s-finalized { background: rgba(148,163,184,0.1); color: var(--dim); border-bottom: 1px solid rgba(148,163,184,0.15); }

.bdo-finalized {
  padding: 20px 24px; text-align: center;
  font-size: 13px; font-weight: 700; color: var(--dim);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.bdo-error {
  padding: 8px 24px 12px;
  font-size: 12px; color: var(--red);
  background: rgba(239,68,68,0.08);
}

.bdo-notes {
  padding: 12px 24px; border-top: 1px solid var(--line);
}
.bdo-notes-label {
  font-size: 10px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.08em; font-weight: 700; margin-bottom: 4px;
}
.bdo-notes-text { font-size: 12px; color: var(--muted); }
`;
