import { requireGirl } from '@/lib/auth';
import {
  getGirlDayBookings,
  getGirlDayPoints,
  getGirlShift,
  getGirlName,
} from '@/lib/studio-queries';
import StudioBookingActions from '@/components/studio/StudioBookingActions';

export const dynamic = 'force-dynamic';

const CZECH_DAYS = ['Nedele', 'Pondeli', 'Utery', 'Streda', 'Ctvrtek', 'Patek', 'Sobota'];
const CZECH_MONTHS = ['ledna', 'unora', 'brezna', 'dubna', 'kvetna', 'cervna', 'cervence', 'srpna', 'zari', 'rijna', 'listopadu', 'prosince'];
const POINTS_DAILY_TARGET = 4500;

function getPragueDate(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }),
  );
}

function formatCzechDate(d: Date): string {
  return `${CZECH_DAYS[d.getDay()]} ${d.getDate()}. ${CZECH_MONTHS[d.getMonth()]}`;
}

function getMinutesUntil(timeStr: string, now: Date): number {
  const [h, m] = timeStr.split(':').map(Number);
  const target = h * 60 + m;
  const current = now.getHours() * 60 + now.getMinutes();
  return target - current;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'ted';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `za ${h}h ${m}min`;
  return `za ${m}min`;
}

type BookingState = 'done' | 'in_progress' | 'next' | 'later';

function classifyBooking(
  status: string,
  startTime: string,
  endTime: string,
  now: Date,
  isNext: boolean,
): BookingState {
  if (status === 'completed') return 'done';
  if (status === 'in_progress') return 'in_progress';
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const [eh, em] = endTime.split(':').map(Number);
  if (currentMin >= eh * 60 + em && status === 'confirmed') return 'done';
  if (isNext) return 'next';
  return 'later';
}

const STYLES = `
  .shift-banner {
    background: var(--bg-elev);
    padding: 14px 20px;
    border-bottom: 1px solid var(--line);
  }
  .shift-date { font-size: 18px; font-weight: 800; }
  .shift-info { font-size: 12px; color: var(--muted); margin-top: 4px; display: flex; gap: 12px; flex-wrap: wrap; }
  .shift-tag { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .shift-tag-time { background: rgba(74,222,128,0.15); color: var(--green); }
  .shift-tag-loc { background: rgba(96,165,250,0.15); color: var(--blue); }
  .shift-off { padding: 14px 20px; background: var(--bg-elev); border-bottom: 1px solid var(--line); }
  .shift-off-text { font-size: 14px; color: var(--dim); }

  .points-bar {
    padding: 12px 20px;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .points-track { flex: 1; height: 8px; border-radius: 4px; background: var(--bg-elev); overflow: hidden; }
  .points-fill { height: 100%; border-radius: 4px; background: var(--yellow); }
  .points-label { font-size: 13px; font-weight: 700; color: var(--yellow); white-space: nowrap; }
  .points-goal { font-size: 10px; color: var(--dim); white-space: nowrap; }

  .section-label {
    padding: 12px 20px 6px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--dim);
    font-weight: 700;
  }

  .booking-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
    color: var(--text);
  }
  .booking-item.st-next { background: rgba(242,125,141,0.06); border-left: 3px solid var(--coral); }
  .booking-item.st-done { opacity: 0.45; }
  .booking-item.st-in-progress { background: rgba(74,222,128,0.06); border-left: 3px solid var(--green); }

  .bi-time { width: 52px; text-align: center; flex-shrink: 0; }
  .bi-time-h { font-size: 16px; font-weight: 800; }
  .bi-time-dur { font-size: 10px; color: var(--dim); }

  .bi-info { flex: 1; min-width: 0; }
  .bi-client { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .bi-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .bi-note { font-size: 10px; color: var(--yellow); margin-top: 3px; }
  .bi-countdown { font-size: 11px; color: var(--coral); font-weight: 700; margin-top: 2px; }

  .bi-badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .bi-badge-vip { background: rgba(251,191,36,0.2); color: var(--yellow); }
  .bi-badge-regular { background: rgba(74,222,128,0.2); color: var(--green); }
  .bi-badge-verified { background: rgba(167,139,250,0.2); color: #a78bfa; }
  .bi-badge-new { background: rgba(96,165,250,0.2); color: var(--blue); }

  .bi-status { flex-shrink: 0; font-size: 10px; font-weight: 600; }
  .bi-status-done { color: var(--green); }
  .bi-status-next { color: var(--coral); }
  .bi-status-later { color: var(--dim); }
  .bi-status-progress { color: var(--green); }

  /* Detail panel */
  .next-detail { padding: 20px; }
  .nd-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--dim); font-weight: 700; margin-bottom: 12px; }
  .nd-countdown { font-size: 32px; font-weight: 900; color: var(--coral); text-align: center; margin-bottom: 16px; }
  .nd-countdown-sub { font-size: 12px; color: var(--muted); font-weight: 400; }
  .nd-card { background: var(--bg-elev); border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
  .nd-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .nd-row-label { color: var(--muted); }
  .nd-row-value { font-weight: 600; }
  .nd-note-box { margin-top: 12px; padding: 10px 12px; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 8px; font-size: 12px; color: var(--yellow); }
  .nd-back { display: inline-block; margin-bottom: 12px; font-size: 12px; color: var(--muted); text-decoration: none; }
  .nd-back:hover { color: var(--text); }

  .empty-state { padding: 40px 20px; text-align: center; }
  .empty-icon { font-size: 32px; margin-bottom: 8px; }
  .empty-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .empty-sub { font-size: 12px; color: var(--dim); }
`;

function trustBadgeClass(level: string): string {
  switch (level) {
    case 'vip': return 'bi-badge bi-badge-vip';
    case 'regular': return 'bi-badge bi-badge-regular';
    case 'verified': return 'bi-badge bi-badge-verified';
    default: return 'bi-badge bi-badge-new';
  }
}

function trustLabel(level: string): string {
  switch (level) {
    case 'vip': return 'VIP';
    case 'regular': return 'Staly';
    case 'verified': return 'Overeny';
    default: return 'Novy';
  }
}

interface Props {
  searchParams: Promise<{ detail?: string }>;
}

export default async function StudioDashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await requireGirl();
  if (!user.girl_id) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: 'var(--red)' }}>Ucet neni propojen s profilem.</p>
      </div>
    );
  }

  const now = getPragueDate();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [bookings, shift, points, girlName] = await Promise.all([
    getGirlDayBookings(user.girl_id, todayStr),
    getGirlShift(user.girl_id, todayStr),
    getGirlDayPoints(user.girl_id, todayStr),
    getGirlName(user.girl_id),
  ]);

  const pointsPct = Math.min(100, Math.round((points / POINTS_DAILY_TARGET) * 100));

  // Classify bookings
  let foundNext = false;
  const classified = bookings.map((b) => {
    const state = classifyBooking(b.status, b.startTime, b.endTime, now, !foundNext && b.status === 'confirmed');
    if (state === 'next') foundNext = true;
    return { ...b, state };
  });

  const nextBooking = classified.find((b) => b.state === 'next');
  const activeBooking = classified.find((b) => b.state === 'in_progress');

  // Detail view
  const detailId = sp.detail ? Number(sp.detail) : null;
  const detailBooking = detailId ? classified.find((b) => b.id === detailId) : null;

  if (detailBooking) {
    const minutesUntil = getMinutesUntil(detailBooking.startTime, now);
    const countdown = detailBooking.state === 'in_progress' ? 'Probiha' : formatCountdown(minutesUntil);

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className="next-detail">
          <a href="/studio/dashboard" className="nd-back">&larr; Zpet na prehled</a>
          <div className="nd-label">
            {detailBooking.state === 'in_progress' ? 'Probihajici rezervace' : 'Detail rezervace'}
          </div>
          <div className="nd-countdown">
            {countdown}
            {detailBooking.state !== 'in_progress' && minutesUntil > 0 && (
              <div className="nd-countdown-sub">do bookingu</div>
            )}
          </div>
          <div className="nd-card">
            <div className="nd-row">
              <span className="nd-row-label">Klient</span>
              <span className="nd-row-value">
                {detailBooking.clientNickname}{' '}
                <span className={trustBadgeClass(detailBooking.clientTrustLevel)} style={{ fontSize: 9 }}>
                  {trustLabel(detailBooking.clientTrustLevel)}
                </span>
              </span>
            </div>
            <div className="nd-row">
              <span className="nd-row-label">Navstevy</span>
              <span className="nd-row-value">{detailBooking.clientVisits}</span>
            </div>
            <div className="nd-row">
              <span className="nd-row-label">Cas</span>
              <span className="nd-row-value">{detailBooking.startTime} - {detailBooking.endTime}</span>
            </div>
            <div className="nd-row">
              <span className="nd-row-label">Delka</span>
              <span className="nd-row-value">{detailBooking.durationMinutes} min</span>
            </div>
            {shift?.locationName && (
              <div className="nd-row">
                <span className="nd-row-label">Lokace</span>
                <span className="nd-row-value">{shift.locationName}</span>
              </div>
            )}
          </div>

          {detailBooking.girlNotes && (
            <div className="nd-note-box">{detailBooking.girlNotes}</div>
          )}

          {(detailBooking.state === 'next' || detailBooking.state === 'in_progress') && (
            <StudioBookingActions
              bookingId={detailBooking.id}
              status={detailBooking.status}
            />
          )}
        </div>
      </>
    );
  }

  // Main dashboard
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Shift banner */}
      {shift ? (
        <div className="shift-banner">
          <div className="shift-date">{formatCzechDate(now)}</div>
          <div className="shift-info">
            <span className="shift-tag shift-tag-time">{shift.startTime} - {shift.endTime}</span>
            {shift.locationName && (
              <span className="shift-tag shift-tag-loc">{shift.locationName}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="shift-off">
          <div className="shift-date" style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            {formatCzechDate(now)}
          </div>
          <div className="shift-off-text">Dnes nemas smenu</div>
        </div>
      )}

      {/* Points progress */}
      <div className="points-bar">
        <div className="points-label">{points.toLocaleString('cs-CZ')}</div>
        <div className="points-track">
          <div className="points-fill" style={{ width: `${pointsPct}%` }} />
        </div>
        <div className="points-goal">/ {POINTS_DAILY_TARGET.toLocaleString('cs-CZ')}</div>
      </div>

      {/* Active booking highlight */}
      {activeBooking && (
        <>
          <div className="section-label">Probiha</div>
          <a href={`/studio/dashboard?detail=${activeBooking.id}`} className="booking-item st-in-progress">
            <div className="bi-time">
              <div className="bi-time-h">{activeBooking.startTime}</div>
              <div className="bi-time-dur">{activeBooking.durationMinutes} min</div>
            </div>
            <div className="bi-info">
              <div className="bi-client">
                {activeBooking.clientNickname}
                <span className={trustBadgeClass(activeBooking.clientTrustLevel)}>
                  {trustLabel(activeBooking.clientTrustLevel)}
                </span>
              </div>
              <div className="bi-meta">{activeBooking.clientVisits} navstev</div>
            </div>
            <div className="bi-status bi-status-progress">Probiha</div>
          </a>
        </>
      )}

      {/* Booking list */}
      <div className="section-label">
        Dnesni rezervace ({bookings.length})
      </div>

      {classified.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">&#128198;</div>
          <div className="empty-title">Zadne rezervace</div>
          <div className="empty-sub">Na dnes nemas zadne bookings.</div>
        </div>
      )}

      {classified.map((b) => {
        const minutesUntil = getMinutesUntil(b.startTime, now);
        const stateClass = b.state === 'done' ? 'st-done'
          : b.state === 'next' ? 'st-next'
          : b.state === 'in_progress' ? 'st-in-progress'
          : '';

        return (
          <a
            key={b.id}
            href={`/studio/dashboard?detail=${b.id}`}
            className={`booking-item ${stateClass}`}
          >
            <div className="bi-time">
              <div className="bi-time-h">{b.startTime}</div>
              <div className="bi-time-dur">{b.durationMinutes} min</div>
            </div>
            <div className="bi-info">
              <div className="bi-client">
                {b.clientNickname}
                <span className={trustBadgeClass(b.clientTrustLevel)}>
                  {trustLabel(b.clientTrustLevel)}
                </span>
              </div>
              <div className="bi-meta">
                {b.clientVisits === 0 ? '1. navsteva' : `${b.clientVisits} navstev`}
              </div>
              {b.clientTrustLevel === 'new' && b.clientVisits <= 1 && (
                <div className="bi-note">&#9888; Prvni navsteva, overit</div>
              )}
              {b.girlNotes && (
                <div className="bi-note">{b.girlNotes}</div>
              )}
              {b.state === 'next' && minutesUntil > 0 && (
                <div className="bi-countdown">{formatCountdown(minutesUntil)}</div>
              )}
            </div>
            <div className={`bi-status ${
              b.state === 'done' ? 'bi-status-done'
              : b.state === 'in_progress' ? 'bi-status-progress'
              : b.state === 'next' ? 'bi-status-next'
              : 'bi-status-later'
            }`}>
              {b.state === 'done' ? '\u2713 Hotovo'
                : b.state === 'in_progress' ? 'Probiha'
                : b.state === 'next' ? 'Dalsi'
                : b.startTime}
            </div>
          </a>
        );
      })}
    </>
  );
}
