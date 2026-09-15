/**
 * STUDIOFLOW — Client Detail Card
 * Server Component: shows client stats, booking history, visited girls, notes.
 * Matches mockup 04-client-card.html (detail section).
 */

import { notFound } from 'next/navigation';
import {
  getClientDetail,
  getClientBookingHistory,
  getClientGirlStats,
} from '@/lib/client-queries';
import ClientNotes from '@/components/booking/ClientNotes';
import ClientTrustActions from '@/components/booking/ClientTrustActions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const TRUST_LABELS: Record<string, { label: string; cls: string }> = {
  vip: { label: 'VIP', cls: 'cd-badge-vip' },
  regular: { label: 'Staly', cls: 'cd-badge-regular' },
  verified: { label: 'Overeny', cls: 'cd-badge-verified' },
  new: { label: 'Novy', cls: 'cd-badge-new' },
};

const CHANNEL_LABELS: Record<string, string> = {
  phone: 'TEL',
  telegram: 'TG',
  whatsapp: 'WA',
  admin: 'ADM',
  sms: 'SMS',
};

const STATUS_PILLS: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Dokonceno', cls: 'cd-status-ok' },
  confirmed: { label: 'Potvrzeno', cls: 'cd-status-ok' },
  in_progress: { label: 'Probiha', cls: 'cd-status-ok' },
  pending: { label: 'Ceka', cls: 'cd-status-pending' },
  no_show: { label: 'No-show', cls: 'cd-status-noshow' },
  cancelled_client: { label: 'Zruseno', cls: 'cd-status-cancelled' },
  cancelled_girl: { label: 'Zruseno', cls: 'cd-status-cancelled' },
  declined: { label: 'Odmitnuto', cls: 'cd-status-cancelled' },
  rescheduled: { label: 'Presunuto', cls: 'cd-status-pending' },
};

function formatDateCS(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('cs-CZ') + ' Kc';
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

  const initial = client.nickname.charAt(0).toUpperCase();
  const badge = TRUST_LABELS[client.trustLevel] ?? TRUST_LABELS.new;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Back + header */}
      <div className="cd-back-bar">
        <a href="/booking/clients" className="cd-back-link">&lt; Zpet na seznam</a>
      </div>

      <div className="cd-container">
        {/* Header */}
        <div className="cd-header">
          <div className={`cd-avatar${client.isBanned ? ' banned' : ''}`}>{initial}</div>
          <div>
            <div className="cd-name">
              {client.nickname}{' '}
              {client.isBanned ? (
                <span className="cd-badge cd-badge-banned">Banovany</span>
              ) : (
                <span className={`cd-badge ${badge.cls}`}>{badge.label}</span>
              )}
            </div>
            <div className="cd-code">
              {client.clientNumber}
              {client.telegramId && (
                <span className="cd-tg"> / TG: {client.telegramId}</span>
              )}
            </div>
          </div>
          <div className="cd-actions">
            <a href={`/booking/calendar/new?client=${client.id}`} className="cd-btn-primary">+ Rezervace</a>
          </div>
        </div>

        {/* Stat cards */}
        <div className="cd-stat-cards">
          <div className="cd-stat-card">
            <div className="cd-stat-num coral">{client.totalVisits}</div>
            <div className="cd-stat-lbl">Navstevy</div>
          </div>
          <div className="cd-stat-card">
            <div className={`cd-stat-num${client.noShowCount > 0 ? ' red' : ' green'}`}>{client.noShowCount}</div>
            <div className="cd-stat-lbl">No-shows</div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-num yellow">{client.totalSpent.toLocaleString('cs-CZ')}</div>
            <div className="cd-stat-lbl">Utraceno Kc</div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-num yellow">{client.totalPoints.toLocaleString('cs-CZ')}</div>
            <div className="cd-stat-lbl">Body celkem</div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-num" style={{ color: 'var(--purple)' }}>{client.source}</div>
            <div className="cd-stat-lbl">Zdroj</div>
          </div>
        </div>

        {/* Info cards */}
        <div className="cd-info-grid">
          <div className="cd-info-card">
            <div className="cd-info-title">Kontakt</div>
            <div className="cd-info-row">
              <span className="cd-info-label">Telefon</span>
              <span className="cd-info-value">
                {client.phoneDecrypted ? (
                  <a href={`tel:${client.phoneDecrypted}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                    {client.phoneDecrypted}
                  </a>
                ) : client.phoneEncrypted ? (
                  <span className="cd-encrypted">sifrovano</span>
                ) : (
                  <span className="cd-dim">--</span>
                )}
              </span>
            </div>
            <div className="cd-info-row">
              <span className="cd-info-label">Telegram</span>
              <span className="cd-info-value" style={{ color: client.telegramId ? '#229ED9' : 'var(--dim)' }}>
                {client.telegramId ?? '--'}
              </span>
            </div>
            {client.deepLinkToken && !client.telegramId && (
              <div className="cd-info-row">
                <span className="cd-info-label">Deep-link</span>
                <span className="cd-info-value" style={{
                  fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all',
                  color: '#229ED9', userSelect: 'all',
                }}>
                  t.me/studioflow3_bot?start=LG_{client.deepLinkToken}
                </span>
              </div>
            )}
            <div className="cd-info-row">
              <span className="cd-info-label">Email</span>
              <span className="cd-info-value">
                {client.emailDecrypted ? (
                  <a href={`mailto:${client.emailDecrypted}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                    {client.emailDecrypted}
                  </a>
                ) : client.emailEncrypted ? (
                  <span className="cd-encrypted">sifrovano</span>
                ) : (
                  <span className="cd-dim">--</span>
                )}
              </span>
            </div>
          </div>
          <div className="cd-info-card">
            <div className="cd-info-title">Statistiky</div>
            <div className="cd-info-row">
              <span className="cd-info-label">Prvni navsteva</span>
              <span className="cd-info-value">
                {client.firstVisitDate ? formatDateCS(client.firstVisitDate) : '--'}
              </span>
            </div>
            <div className="cd-info-row">
              <span className="cd-info-label">Posledni navsteva</span>
              <span className="cd-info-value">
                {client.lastVisitDate ? formatDateCS(client.lastVisitDate) : '--'}
              </span>
            </div>
            <div className="cd-info-row">
              <span className="cd-info-label">Staly od</span>
              <span className="cd-info-value" style={{ color: client.regularSince ? 'var(--green)' : 'var(--dim)' }}>
                {client.regularSince ? `${client.regularSince}. navstevy` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Visited girls */}
        {girlStats.length > 0 && (
          <div className="cd-info-card cd-mb">
            <div className="cd-info-title">Navstivene divky</div>
            <div className="cd-girl-chips">
              {girlStats.map((gs) => (
                <div key={gs.girlName} className="cd-girl-chip">
                  <span className="cd-chip-count">{gs.visitCount}</span> {gs.girlName}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes (editable client component) */}
        <ClientNotes clientId={client.id} initialNotes={client.notes ?? ''} />

        {/* Trust level / ban actions (client component, admin only) */}
        <ClientTrustActions
          clientId={client.id}
          currentTrustLevel={client.trustLevel}
          isBanned={client.isBanned}
          banReason={client.banReason}
        />

        {/* History tab */}
        <div className="cd-tabs">
          <div className="cd-tab active">Historie ({history.length})</div>
        </div>

        {/* History table */}
        {history.length === 0 ? (
          <div className="cd-empty">Zatim zadne rezervace.</div>
        ) : (
          <table className="cd-history">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Divka</th>
                <th>Program</th>
                <th>Zdroj</th>
                <th>Status</th>
                <th>Cena</th>
                <th>Body</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => {
                const statusInfo = STATUS_PILLS[h.status] ?? { label: h.status, cls: 'cd-status-cancelled' };
                const channelLabel = CHANNEL_LABELS[h.channel] ?? h.channel;
                return (
                  <tr key={h.id}>
                    <td>
                      <a href={`/booking/calendar?view=day&date=${h.date}&detail=${h.id}`} className="cd-hist-link">
                        {formatDateCS(h.date)} {h.startTime}
                      </a>
                    </td>
                    <td>{h.girlName}</td>
                    <td>{h.durationMinutes} min</td>
                    <td><span className="cd-source-icon">{channelLabel}</span></td>
                    <td><span className={`cd-status-pill ${statusInfo.cls}`}>{statusInfo.label}</span></td>
                    <td>{h.price != null ? formatMoney(h.price) : '--'}</td>
                    <td className="cd-points">{h.pointsEarned > 0 ? h.pointsEarned.toLocaleString('cs-CZ') : '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const STYLES = `
.cd-back-bar {
  margin: -24px -24px 0;
  padding: 10px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
}
.cd-back-link {
  font-size: 13px; color: var(--muted);
  text-decoration: none;
}
.cd-back-link:hover { color: var(--coral); }

.cd-container { max-width: 700px; margin: 20px auto 0; }

/* Header */
.cd-header {
  display: flex; align-items: center; gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}
.cd-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--bg-elev); border: 2px solid var(--coral);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--coral); font-size: 22px;
  flex-shrink: 0;
}
.cd-avatar.banned { border-color: var(--red); color: var(--red); }
.cd-name { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.cd-code { font-size: 14px; color: var(--muted); }
.cd-tg { color: #229ED9; }
.cd-actions { margin-left: auto; display: flex; gap: 8px; }
.cd-btn-primary {
  padding: 8px 16px; border-radius: 8px;
  background: var(--coral); color: #fff;
  font-size: 13px; font-weight: 600;
  text-decoration: none;
}
.cd-btn-primary:hover { opacity: 0.9; }

/* Badge */
.cd-badge {
  padding: 3px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  vertical-align: middle;
}
.cd-badge-vip { background: rgba(251,191,36,0.2); color: var(--yellow); }
.cd-badge-regular { background: rgba(74,222,128,0.2); color: var(--green); }
.cd-badge-verified { background: rgba(96,165,250,0.2); color: var(--blue); }
.cd-badge-new { background: rgba(96,165,250,0.2); color: var(--blue); }
.cd-badge-banned { background: rgba(239,68,68,0.2); color: var(--red); }

/* Stat cards */
.cd-stat-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
.cd-stat-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 10px; padding: 12px; text-align: center;
}
.cd-stat-num { font-size: 24px; font-weight: 700; font-family: Georgia, serif; }
.cd-stat-num.coral { color: var(--coral); }
.cd-stat-num.green { color: var(--green); }
.cd-stat-num.yellow { color: var(--yellow); }
.cd-stat-num.red { color: var(--red); }
.cd-stat-lbl { font-size: 10px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

/* Info grid */
.cd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.cd-info-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 10px; padding: 14px;
}
.cd-mb { margin-bottom: 20px; }
.cd-info-title { font-size: 11px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; font-weight: 600; }
.cd-info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
.cd-info-label { color: var(--muted); }
.cd-info-value { font-weight: 600; }
.cd-dim { color: var(--dim); }
.cd-encrypted {
  font-size: 11px; padding: 2px 6px;
  background: rgba(167,139,250,0.15); color: var(--purple);
  border-radius: 3px; font-weight: 600;
}

/* Girl chips */
.cd-girl-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.cd-girl-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 16px;
  background: var(--bg); border: 1px solid var(--line);
  font-size: 11px; color: var(--muted);
}
.cd-chip-count { font-weight: 700; color: var(--coral); }

/* Tabs */
.cd-tabs { display: flex; gap: 24px; border-bottom: 1px solid var(--line); margin-bottom: 16px; }
.cd-tab {
  padding: 10px 0; font-size: 13px; font-weight: 600;
  color: var(--muted); position: relative;
}
.cd-tab.active { color: var(--coral); }
.cd-tab.active::after {
  content: ''; position: absolute;
  bottom: -1px; left: 0; right: 0;
  height: 2px; background: var(--coral);
}

/* History table */
.cd-history { width: 100%; font-size: 12px; border-collapse: collapse; }
.cd-history th {
  text-align: left; padding: 8px; font-size: 10px; color: var(--dim);
  text-transform: uppercase; border-bottom: 1px solid var(--line);
  font-weight: 600; letter-spacing: 0.05em;
}
.cd-history td { padding: 8px; border-bottom: 1px solid rgba(42,34,48,0.5); vertical-align: middle; }
.cd-history tr:hover { background: rgba(242,125,141,0.04); }
.cd-hist-link { color: var(--text); text-decoration: none; }
.cd-hist-link:hover { color: var(--coral); }
.cd-source-icon { font-size: 11px; color: var(--muted); font-weight: 600; }
.cd-status-pill {
  display: inline-block; padding: 2px 8px; border-radius: 10px;
  font-size: 10px; font-weight: 700;
}
.cd-status-ok { background: rgba(74,222,128,0.15); color: var(--green); }
.cd-status-noshow { background: rgba(239,68,68,0.15); color: var(--red); }
.cd-status-pending { background: rgba(251,191,36,0.15); color: var(--yellow); }
.cd-status-cancelled { background: rgba(106,94,114,0.2); color: var(--dim); }
.cd-points { color: var(--yellow); font-weight: 700; }
.cd-empty { padding: 24px 0; text-align: center; font-size: 13px; color: var(--dim); }
`;
