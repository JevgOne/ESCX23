/**
 * STUDIOFLOW — Client Detail Card (Premium Redesign)
 * Server Component: client profile, stats, contact, girl preferences, booking history.
 */

import { notFound } from 'next/navigation';
import {
  getClientDetail,
  getClientBookingHistory,
  getClientGirlStats,
} from '@/lib/client-queries';
import { getCurrentUser } from '@/lib/auth';
import { auditClientDecrypt } from '@/lib/audit';
import ClientNotes from '@/components/booking/ClientNotes';
import ClientTrustActions from '@/components/booking/ClientTrustActions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const TRUST_META: Record<string, { label: string; color: string; bg: string }> = {
  vip: { label: 'VIP', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  regular: { label: 'Staly klient', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  verified: { label: 'Overeny', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  new: { label: 'Novy', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

const CHANNEL_LABELS: Record<string, string> = {
  phone: 'TEL', telegram: 'TG', whatsapp: 'WA', admin: 'ADM', sms: 'SMS',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: 'Dokonceno', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  confirmed: { label: 'Potvrzeno', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  in_progress: { label: 'Probiha', color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
  pending: { label: 'Ceka', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  no_show: { label: 'No-show', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  cancelled_client: { label: 'Zruseno', color: '#6a5e72', bg: 'rgba(106,94,114,0.15)' },
  cancelled_girl: { label: 'Zruseno', color: '#6a5e72', bg: 'rgba(106,94,114,0.15)' },
  declined: { label: 'Odmitnuto', color: '#6a5e72', bg: 'rgba(106,94,114,0.15)' },
  rescheduled: { label: 'Presunuto', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
};

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('cs-CZ') + ' Kc';
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) notFound();

  const [client, history, girlStats] = await Promise.all([
    getClientDetail(clientId),
    getClientBookingHistory(clientId),
    getClientGirlStats(clientId),
  ]);

  if (!client) notFound();

  const user = await getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const phone = isAdmin ? client.phoneDecrypted : null;
  const email = isAdmin ? client.emailDecrypted : null;

  if (isAdmin && user) {
    if (phone) auditClientDecrypt(user.id, client.id, 'phone').catch(() => {});
    if (email) auditClientDecrypt(user.id, client.id, 'email').catch(() => {});
  }

  const initial = client.nickname.charAt(0).toUpperCase();
  const trust = TRUST_META[client.trustLevel] ?? TRUST_META.new;
  const completedBookings = history.filter(h => h.status === 'completed' || h.status === 'confirmed' || h.status === 'in_progress');
  const favoriteGirl = girlStats.length > 0 ? girlStats[0] : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Breadcrumb */}
      <div className="cc-bread">
        <a href="/booking/clients" className="cc-bread-link">Klienti</a>
        <span className="cc-bread-sep">/</span>
        <span className="cc-bread-current">{client.nickname}</span>
      </div>

      <div className="cc-layout">
        {/* ─── LEFT COLUMN: Profile + Contact + Girls ─── */}
        <div className="cc-left">

          {/* Profile card */}
          <div className="cc-profile-card">
            <div className="cc-profile-glow" />
            <div className={`cc-avatar${client.isBanned ? ' banned' : ''}`}>
              {initial}
              {client.isBanned && <span className="cc-avatar-ban">!</span>}
            </div>
            <div className="cc-profile-name">{client.nickname}</div>
            <div className="cc-profile-code">{client.clientNumber}</div>
            <div className="cc-profile-badge" style={{ color: client.isBanned ? '#ef4444' : trust.color, background: client.isBanned ? 'rgba(239,68,68,0.12)' : trust.bg }}>
              {client.isBanned ? 'Banovany' : trust.label}
            </div>

            {/* Quick stats row */}
            <div className="cc-quick-stats">
              <div className="cc-qs">
                <span className="cc-qs-num" style={{ color: 'var(--coral)' }}>{client.totalVisits}</span>
                <span className="cc-qs-label">Navstevy</span>
              </div>
              <div className="cc-qs-divider" />
              <div className="cc-qs">
                <span className="cc-qs-num" style={{ color: client.noShowCount > 0 ? '#ef4444' : '#4ade80' }}>{client.noShowCount}</span>
                <span className="cc-qs-label">No-show</span>
              </div>
              <div className="cc-qs-divider" />
              <div className="cc-qs">
                <span className="cc-qs-num" style={{ color: '#fbbf24' }}>{client.totalPoints.toLocaleString('cs-CZ')}</span>
                <span className="cc-qs-label">Body</span>
              </div>
            </div>

            <a href={`/booking/calendar/new?client=${client.id}`} className="cc-book-btn">
              + Nova rezervace
            </a>
          </div>

          {/* Contact card */}
          <div className="cc-card">
            <div className="cc-card-title">Kontakt</div>
            <div className="cc-contact-rows">
              <div className="cc-contact-row">
                <span className="cc-contact-icon">T</span>
                <div className="cc-contact-content">
                  <span className="cc-contact-label">Telefon</span>
                  {phone ? (
                    <a href={`tel:${phone}`} className="cc-contact-value cc-link-coral">{phone}</a>
                  ) : client.phoneEncrypted ? (
                    <span className="cc-encrypted">sifrovano</span>
                  ) : (
                    <span className="cc-contact-empty">--</span>
                  )}
                </div>
              </div>
              <div className="cc-contact-row">
                <span className="cc-contact-icon" style={{ background: 'rgba(34,158,217,0.12)', color: '#229ED9' }}>TG</span>
                <div className="cc-contact-content">
                  <span className="cc-contact-label">Telegram</span>
                  <span className="cc-contact-value" style={{ color: client.telegramId ? '#229ED9' : 'var(--dim)' }}>
                    {client.telegramId ?? '--'}
                  </span>
                </div>
              </div>
              {client.deepLinkToken && !client.telegramId && (
                <div className="cc-contact-row">
                  <span className="cc-contact-icon" style={{ background: 'rgba(34,158,217,0.12)', color: '#229ED9' }}>DL</span>
                  <div className="cc-contact-content">
                    <span className="cc-contact-label">Deep-link</span>
                    <span className="cc-contact-value" style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', color: '#229ED9', userSelect: 'all' }}>
                      t.me/studioflow3_bot?start=LG_{client.deepLinkToken}
                    </span>
                  </div>
                </div>
              )}
              <div className="cc-contact-row">
                <span className="cc-contact-icon" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>@</span>
                <div className="cc-contact-content">
                  <span className="cc-contact-label">Email</span>
                  {email ? (
                    <a href={`mailto:${email}`} className="cc-contact-value" style={{ color: '#60a5fa', textDecoration: 'none' }}>{email}</a>
                  ) : client.emailEncrypted ? (
                    <span className="cc-encrypted">sifrovano</span>
                  ) : (
                    <span className="cc-contact-empty">--</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visited girls */}
          {girlStats.length > 0 && (
            <div className="cc-card">
              <div className="cc-card-title">Oblibene divky</div>
              <div className="cc-girls-list">
                {girlStats.map((gs, i) => (
                  <div key={gs.girlName} className={`cc-girl-row${i === 0 ? ' cc-girl-fav' : ''}`}>
                    <span className="cc-girl-rank">{i + 1}</span>
                    <span className="cc-girl-name">{gs.girlName}</span>
                    <span className="cc-girl-visits">{gs.visitCount}x</span>
                    {i === 0 && <span className="cc-girl-star">*</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT COLUMN: Stats + History + Notes + Actions ─── */}
        <div className="cc-right">

          {/* Revenue stats */}
          <div className="cc-stats-bar">
            <div className="cc-stat-block">
              <span className="cc-stat-label">Utraceno celkem</span>
              <span className="cc-stat-val" style={{ color: '#fbbf24' }}>{fmtMoney(client.totalSpent)}</span>
            </div>
            <div className="cc-stat-sep" />
            <div className="cc-stat-block">
              <span className="cc-stat-label">Zdroj</span>
              <span className="cc-stat-val" style={{ color: 'var(--purple)' }}>{client.source}</span>
            </div>
            <div className="cc-stat-sep" />
            <div className="cc-stat-block">
              <span className="cc-stat-label">Prvni navsteva</span>
              <span className="cc-stat-val">{client.firstVisitDate ? fmtDate(client.firstVisitDate) : '--'}</span>
            </div>
            <div className="cc-stat-sep" />
            <div className="cc-stat-block">
              <span className="cc-stat-label">Posledni navsteva</span>
              <span className="cc-stat-val">{client.lastVisitDate ? fmtDate(client.lastVisitDate) : '--'}</span>
            </div>
            {client.regularSince && (
              <>
                <div className="cc-stat-sep" />
                <div className="cc-stat-block">
                  <span className="cc-stat-label">Staly od</span>
                  <span className="cc-stat-val" style={{ color: '#4ade80' }}>{client.regularSince}. navstevy</span>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <ClientNotes clientId={client.id} initialNotes={client.notes ?? ''} />

          {/* Trust / Ban actions */}
          <ClientTrustActions
            clientId={client.id}
            currentTrustLevel={client.trustLevel}
            isBanned={client.isBanned}
            banReason={client.banReason}
          />

          {/* Booking history */}
          <div className="cc-card">
            <div className="cc-card-title-row">
              <span className="cc-card-title">Historie rezervaci</span>
              <span className="cc-count-badge">{history.length}</span>
            </div>

            {history.length === 0 ? (
              <div className="cc-empty">Zatim zadne rezervace.</div>
            ) : (
              <>
                {/* Desktop table */}
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Divka</th>
                      <th>Delka</th>
                      <th>Kanal</th>
                      <th>Status</th>
                      <th>Cena</th>
                      <th>Body</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => {
                      const st = STATUS_META[h.status] ?? { label: h.status, color: '#6a5e72', bg: 'rgba(106,94,114,0.15)' };
                      const ch = CHANNEL_LABELS[h.channel] ?? h.channel;
                      return (
                        <tr key={h.id}>
                          <td>
                            <a href={`/booking/calendar?view=day&date=${h.date}&detail=${h.id}`} className="cc-table-link">
                              {fmtDate(h.date)} <span className="cc-table-time">{h.startTime}</span>
                            </a>
                          </td>
                          <td className="cc-table-girl">{h.girlName}</td>
                          <td>{h.durationMinutes}m</td>
                          <td><span className="cc-channel">{ch}</span></td>
                          <td>
                            <span className="cc-status" style={{ color: st.color, background: st.bg }}>
                              {st.label}
                            </span>
                          </td>
                          <td className="cc-table-price">{h.price != null ? fmtMoney(h.price) : '--'}</td>
                          <td className="cc-table-points">{h.pointsEarned > 0 ? h.pointsEarned.toLocaleString('cs-CZ') : '--'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="cc-hist-mobile">
                  {history.map((h) => {
                    const st = STATUS_META[h.status] ?? { label: h.status, color: '#6a5e72', bg: 'rgba(106,94,114,0.15)' };
                    return (
                      <a key={h.id} href={`/booking/calendar?view=day&date=${h.date}&detail=${h.id}`} className="cc-hist-card">
                        <div className="cc-hist-top">
                          <span className="cc-hist-date">{fmtDate(h.date)} {h.startTime}</span>
                          <span className="cc-status" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </div>
                        <div className="cc-hist-bottom">
                          <span className="cc-hist-girl">{h.girlName}</span>
                          <span className="cc-hist-dur">{h.durationMinutes}m</span>
                          {h.price != null && <span className="cc-hist-price">{fmtMoney(h.price)}</span>}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const STYLES = `
/* ─── Breadcrumb ─── */
.cc-bread {
  margin: -24px -24px 20px;
  padding: 10px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
  display: flex; align-items: center; gap: 8px;
  font-size: 13px;
}
.cc-bread-link { color: var(--muted); text-decoration: none; }
.cc-bread-link:hover { color: var(--coral); }
.cc-bread-sep { color: var(--dim); }
.cc-bread-current { color: var(--text); font-weight: 600; }

/* ─── Two-column layout ─── */
.cc-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

/* ─── Profile card (left hero) ─── */
.cc-profile-card {
  position: relative;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 28px 20px 20px;
  text-align: center;
  overflow: hidden;
  margin-bottom: 16px;
}
.cc-profile-glow {
  position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
  width: 160px; height: 80px;
  background: radial-gradient(ellipse, rgba(242,125,141,0.18) 0%, transparent 70%);
  pointer-events: none;
}
.cc-avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, var(--coral), #c9536a);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 800; color: #fff;
  margin: 0 auto 12px;
  box-shadow: 0 4px 20px -4px rgba(242,125,141,0.4);
  position: relative;
}
.cc-avatar.banned {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  box-shadow: 0 4px 20px -4px rgba(239,68,68,0.4);
}
.cc-avatar-ban {
  position: absolute; bottom: -2px; right: -2px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #ef4444; border: 2px solid var(--bg-elev);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #fff;
}
.cc-profile-name { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.cc-profile-code { font-size: 12px; color: var(--dim); margin-bottom: 10px; font-family: ui-monospace, monospace; }
.cc-profile-badge {
  display: inline-block; padding: 4px 12px; border-radius: 999px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; margin-bottom: 16px;
}

.cc-quick-stats {
  display: flex; align-items: center; justify-content: center; gap: 0;
  padding: 12px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
}
.cc-qs {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.cc-qs-num { font-size: 20px; font-weight: 800; font-family: Georgia, serif; }
.cc-qs-label { font-size: 9px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.08em; }
.cc-qs-divider { width: 1px; height: 32px; background: var(--line); }

.cc-book-btn {
  display: block; width: 100%; padding: 10px;
  background: linear-gradient(135deg, var(--coral), #c9536a);
  color: #fff; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 700; text-align: center;
  text-decoration: none;
  box-shadow: 0 4px 16px -4px rgba(242,125,141,0.4);
  transition: all 0.15s;
}
.cc-book-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px -4px rgba(242,125,141,0.5); }

/* ─── Generic card ─── */
.cc-card {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}
.cc-card-title {
  font-size: 11px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.08em; font-weight: 700; margin-bottom: 12px;
}
.cc-card-title-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
}
.cc-count-badge {
  font-size: 10px; font-weight: 700; color: var(--coral);
  background: rgba(242,125,141,0.12); padding: 2px 8px;
  border-radius: 999px;
}

/* ─── Contact ─── */
.cc-contact-rows { display: flex; flex-direction: column; gap: 0; }
.cc-contact-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(42,34,48,0.4);
}
.cc-contact-row:last-child { border-bottom: none; }
.cc-contact-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(242,125,141,0.1); color: var(--coral);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; flex-shrink: 0;
}
.cc-contact-content { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.cc-contact-label { font-size: 10px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; }
.cc-contact-value { font-size: 13px; color: var(--text); font-weight: 500; }
.cc-contact-empty { font-size: 13px; color: var(--dim); }
.cc-link-coral { color: var(--coral) !important; text-decoration: none; font-weight: 600; }
.cc-link-coral:hover { text-decoration: underline; }
.cc-encrypted {
  display: inline-block; font-size: 10px; padding: 2px 8px;
  background: rgba(167,139,250,0.12); color: var(--purple);
  border-radius: 4px; font-weight: 600;
}

/* ─── Girls list ─── */
.cc-girls-list { display: flex; flex-direction: column; gap: 0; }
.cc-girl-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  transition: background 0.1s;
}
.cc-girl-row:hover { background: rgba(242,125,141,0.04); }
.cc-girl-fav { background: rgba(242,125,141,0.06); }
.cc-girl-rank {
  width: 22px; height: 22px; border-radius: 6px;
  background: rgba(242,125,141,0.1); color: var(--coral);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; flex-shrink: 0;
}
.cc-girl-fav .cc-girl-rank {
  background: linear-gradient(135deg, var(--coral), #c9536a);
  color: #fff;
}
.cc-girl-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--text); }
.cc-girl-visits { font-size: 12px; font-weight: 700; color: var(--muted); font-family: ui-monospace, monospace; }
.cc-girl-star { color: var(--coral); font-size: 14px; font-weight: 700; }

/* ─── Stats bar ─── */
.cc-stats-bar {
  display: flex; align-items: center; gap: 0;
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 14px; padding: 14px 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.cc-stat-block {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 0 8px;
}
.cc-stat-label { font-size: 9px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
.cc-stat-val { font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; }
.cc-stat-sep { width: 1px; height: 28px; background: var(--line); flex-shrink: 0; }

/* ─── History table (desktop) ─── */
.cc-table { width: 100%; font-size: 12px; border-collapse: collapse; }
.cc-table th {
  text-align: left; padding: 8px 6px; font-size: 10px; color: var(--dim);
  text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
  border-bottom: 1px solid var(--line);
}
.cc-table td {
  padding: 8px 6px;
  border-bottom: 1px solid rgba(42,34,48,0.4);
  vertical-align: middle;
}
.cc-table tr:hover { background: rgba(242,125,141,0.03); }
.cc-table-link { color: var(--text); text-decoration: none; font-weight: 500; }
.cc-table-link:hover { color: var(--coral); }
.cc-table-time { color: var(--muted); font-family: ui-monospace, monospace; font-size: 11px; }
.cc-table-girl { font-weight: 600; color: var(--coral); }
.cc-table-price { font-weight: 600; }
.cc-table-points { color: #fbbf24; font-weight: 700; }
.cc-channel {
  display: inline-block; padding: 2px 6px; border-radius: 4px;
  background: rgba(168,156,176,0.1); color: var(--muted);
  font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
}
.cc-status {
  display: inline-block; padding: 3px 8px; border-radius: 999px;
  font-size: 10px; font-weight: 700;
}
.cc-empty {
  padding: 32px 16px; text-align: center;
  color: var(--dim); font-size: 13px;
}

/* ─── History mobile cards ─── */
.cc-hist-mobile { display: none; }
.cc-hist-card {
  display: block; padding: 10px 0;
  border-bottom: 1px solid rgba(42,34,48,0.4);
  text-decoration: none;
}
.cc-hist-card:last-child { border-bottom: none; }
.cc-hist-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.cc-hist-date { font-size: 13px; font-weight: 600; color: var(--text); }
.cc-hist-bottom { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--muted); }
.cc-hist-girl { font-weight: 600; color: var(--coral); }
.cc-hist-dur { color: var(--dim); }
.cc-hist-price { margin-left: auto; font-weight: 600; color: var(--text); }

/* ─── Responsive ─── */
@media (max-width: 860px) {
  .cc-layout {
    grid-template-columns: 1fr;
  }
  .cc-left { order: 0; }
  .cc-right { order: 1; }
  .cc-profile-card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 16px;
    text-align: left;
    padding: 16px;
  }
  .cc-profile-glow { display: none; }
  .cc-avatar { margin: 0; grid-row: 1 / 3; align-self: center; width: 56px; height: 56px; font-size: 22px; }
  .cc-profile-name { font-size: 17px; align-self: end; }
  .cc-profile-code { font-size: 11px; }
  .cc-profile-badge { grid-column: 1 / -1; margin-top: 10px; text-align: center; }
  .cc-quick-stats { grid-column: 1 / -1; }
  .cc-book-btn { grid-column: 1 / -1; }

  .cc-stats-bar { flex-wrap: wrap; gap: 8px; }
  .cc-stat-sep { display: none; }
  .cc-stat-block { min-width: 45%; }

  .cc-table { display: none; }
  .cc-hist-mobile { display: block; }
}
`;
