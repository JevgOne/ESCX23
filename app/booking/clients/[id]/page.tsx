/**
 * STUDIOFLOW — Client Detail Card (Modern Redesign v2)
 * Server Component: client profile, stats, contact, girl preferences, booking history.
 */

import { notFound } from 'next/navigation';
import {
  getClientDetail,
  getClientBookingHistory,
  getClientGirlStats,
  getClientContacts,
} from '@/lib/client-queries';
import type { ClientContact } from '@/lib/client-queries';
import { getCurrentUser } from '@/lib/auth';
import { auditClientDecrypt } from '@/lib/audit';
import ClientNotes from '@/components/booking/ClientNotes';
import ClientTrustActions from '@/components/booking/ClientTrustActions';
import ContactSection from '@/components/booking/ContactSection';
import ClientDuplicates from '@/components/booking/ClientDuplicates';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const TRUST_META: Record<string, { label: string; color: string; bg: string; level: number }> = {
  vip:      { label: 'VIP Klient',     color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', level: 4 },
  regular:  { label: 'Staly klient',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)', level: 3 },
  verified: { label: 'Overeny klient', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', level: 2 },
  new:      { label: 'Novy klient',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', level: 1 },
};

const TRUST_GRADIENT: Record<string, string> = {
  vip:      'linear-gradient(90deg, #fbbf24, #f59e0b)',
  regular:  'linear-gradient(90deg, #4ade80, #22c55e)',
  verified: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
  new:      'linear-gradient(90deg, #a78bfa, #8b5cf6)',
};

const CHANNEL_LABELS: Record<string, string> = {
  phone: 'TEL', telegram: 'TG', whatsapp: 'WA', admin: 'ADM', sms: 'SMS',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  completed:        { label: 'Dokonceno',  color: '#4ade80', bg: 'rgba(74,222,128,0.10)', icon: '✓' },
  confirmed:        { label: 'Potvrzeno',  color: '#4ade80', bg: 'rgba(74,222,128,0.10)', icon: '✓' },
  in_progress:      { label: 'Probiha',    color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)', icon: '▶' },
  pending:          { label: 'Ceka',       color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', icon: '⏳' },
  no_show:          { label: 'No-show',    color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: '✗' },
  cancelled_client: { label: 'Zruseno',    color: '#6a5e72', bg: 'rgba(106,94,114,0.10)', icon: '–' },
  cancelled_girl:   { label: 'Zruseno',    color: '#6a5e72', bg: 'rgba(106,94,114,0.10)', icon: '–' },
  declined:         { label: 'Odmitnuto',  color: '#6a5e72', bg: 'rgba(106,94,114,0.10)', icon: '–' },
  expired:          { label: 'Expirovano', color: '#6a5e72', bg: 'rgba(106,94,114,0.10)', icon: '–' },
  rescheduled:      { label: 'Presunuto',  color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', icon: '↻' },
};

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('cs-CZ') + ' Kc';
}

function fmtRelativeDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Dnes';
  if (diffDays === 1) return 'Vcera';
  if (diffDays < 7) return `Pred ${diffDays} dny`;
  if (diffDays < 30) return `Pred ${Math.floor(diffDays / 7)} tydny`;
  if (diffDays < 365) return `Pred ${Math.floor(diffDays / 30)} mesici`;
  return fmtDate(dateStr);
}

const CONTACT_CHANNEL_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  phone:    { icon: 'T',  label: 'Telefon',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  whatsapp: { icon: 'WA', label: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.12)' },
  telegram: { icon: 'TG', label: 'Telegram', color: '#229ED9', bg: 'rgba(34,158,217,0.12)' },
  email:    { icon: '@',  label: 'Email',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
};

function ContactRow({
  contact,
  isAdmin,
  telegramActive,
  telegramLastInteraction,
}: {
  contact: ClientContact;
  isAdmin: boolean;
  telegramActive: boolean;
  telegramLastInteraction: string | null;
}) {
  const meta = CONTACT_CHANNEL_META[contact.channel] ?? CONTACT_CHANNEL_META.phone;
  const displayValue = isAdmin ? contact.valueDecrypted : null;

  return (
    <div className="mc-contact-row">
      <span className="mc-contact-icon" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</span>
      <div className="mc-contact-content">
        <span className="mc-contact-label">
          {meta.label}
          {contact.label ? ` (${contact.label})` : ''}
          {contact.isPrimary && <span className="mc-primary-tag">PRIMARY</span>}
        </span>
        {displayValue ? (
          contact.channel === 'phone' || contact.channel === 'whatsapp' ? (
            <a href={`tel:${displayValue}`} className="mc-contact-value mc-link-accent">{displayValue}</a>
          ) : contact.channel === 'email' ? (
            <a href={`mailto:${displayValue}`} className="mc-contact-value" style={{ color: '#60a5fa', textDecoration: 'none' }}>{displayValue}</a>
          ) : (
            <span className="mc-contact-value" style={{ color: meta.color }}>
              {contact.telegramUsername ? `@${contact.telegramUsername}` : displayValue}
            </span>
          )
        ) : contact.valueEncrypted ? (
          <span className="mc-encrypted">sifrovano</span>
        ) : (
          <span className="mc-contact-empty">--</span>
        )}
        {contact.channel === 'telegram' && (
          <div className="mc-tg-status">
            {telegramActive && <span className="mc-tg-active">Aktivni</span>}
            {!telegramActive && contact.verified && <span className="mc-tg-inactive">Neaktivni</span>}
            {telegramLastInteraction && (
              <span className="mc-tg-last">Posl. interakce: {fmtDate(telegramLastInteraction)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) notFound();

  const [client, history, girlStats, contacts] = await Promise.all([
    getClientDetail(clientId),
    getClientBookingHistory(clientId),
    getClientGirlStats(clientId),
    getClientContacts(clientId),
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
  const trustGradient = TRUST_GRADIENT[client.trustLevel] ?? TRUST_GRADIENT.new;
  const completedBookings = history.filter(h => h.status === 'completed');
  const activeBookings = history.filter(h => h.status === 'confirmed' || h.status === 'pending' || h.status === 'in_progress');
  const favoriteGirl = girlStats.length > 0 ? girlStats[0] : null;

  // Trust score percentage (1-4 → 25-100%)
  const trustPct = (trust.level / 4) * 100;

  // Reliability score (visits vs no-shows)
  const totalAttempts = client.totalVisits + client.noShowCount;
  const reliabilityPct = totalAttempts > 0 ? Math.round((client.totalVisits / totalAttempts) * 100) : 100;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Breadcrumb */}
      <div className="mc-bread">
        <a href="/booking/clients" className="mc-bread-link">Klienti</a>
        <span className="mc-bread-sep">/</span>
        <span className="mc-bread-current">{client.nickname}</span>
      </div>

      {/* ─── HERO HEADER ─── */}
      <div className={`mc-hero${client.isBanned ? ' mc-hero-banned' : ''}`}>
        <div className="mc-hero-bg" />
        <div className="mc-hero-content">
          <div className={`mc-avatar${client.isBanned ? ' banned' : ''}`}>
            <span className="mc-avatar-letter">{initial}</span>
            {client.isBanned && <span className="mc-avatar-ban">!</span>}
          </div>
          <div className="mc-hero-info">
            <div className="mc-hero-name-row">
              <h1 className="mc-hero-name">{client.nickname}</h1>
              <span className="mc-hero-badge" style={{ color: client.isBanned ? '#ef4444' : trust.color, background: client.isBanned ? 'rgba(239,68,68,0.15)' : trust.bg, borderColor: client.isBanned ? 'rgba(239,68,68,0.3)' : `${trust.color}33` }}>
                {client.isBanned ? 'Banovany' : trust.label}
              </span>
            </div>
            <div className="mc-hero-meta">
              <span className="mc-hero-code">{client.clientNumber}</span>
              {client.source && <span className="mc-hero-source">{client.source}</span>}
              {favoriteGirl && <span className="mc-hero-fav">★ {favoriteGirl.girlName}</span>}
            </div>
          </div>
          <a href={`/booking/calendar/new?client=${client.id}`} className="mc-hero-cta">
            + Nova rezervace
          </a>
        </div>
      </div>

      {/* ─── STAT CARDS ROW ─── */}
      <div className="mc-stats-row">
        <div className="mc-stat-card">
          <div className="mc-stat-icon" style={{ background: 'rgba(242,125,141,0.12)', color: 'var(--coral)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="mc-stat-data">
            <span className="mc-stat-num">{client.totalVisits}</span>
            <span className="mc-stat-label">Navstevy</span>
          </div>
        </div>

        <div className="mc-stat-card">
          <div className="mc-stat-icon" style={{ background: client.noShowCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.12)', color: client.noShowCount > 0 ? '#ef4444' : '#4ade80' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          </div>
          <div className="mc-stat-data">
            <span className="mc-stat-num" style={{ color: client.noShowCount > 0 ? '#ef4444' : '#4ade80' }}>{client.noShowCount}</span>
            <span className="mc-stat-label">No-show</span>
          </div>
        </div>

        <div className="mc-stat-card">
          <div className="mc-stat-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="mc-stat-data">
            <span className="mc-stat-num" style={{ color: '#fbbf24' }}>{fmtMoney(client.totalSpent)}</span>
            <span className="mc-stat-label">Utraceno celkem</span>
          </div>
        </div>

        <div className="mc-stat-card">
          <div className="mc-stat-icon" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div className="mc-stat-data">
            <span className="mc-stat-num" style={{ color: '#a78bfa' }}>{client.totalPoints.toLocaleString('cs-CZ')}</span>
            <span className="mc-stat-label">Body</span>
          </div>
        </div>
      </div>

      {/* ─── TRUST & RELIABILITY METERS ─── */}
      <div className="mc-meters-row">
        <div className="mc-meter-card">
          <div className="mc-meter-header">
            <span className="mc-meter-title">Duverihodnost</span>
            <span className="mc-meter-value" style={{ color: trust.color }}>{trust.label}</span>
          </div>
          <div className="mc-meter-track">
            <div className="mc-meter-fill" style={{ width: `${trustPct}%`, background: trustGradient }} />
            <div className="mc-meter-steps">
              <div className={`mc-meter-dot${trust.level >= 1 ? ' active' : ''}`} style={{ left: '12.5%' }} title="Novy" />
              <div className={`mc-meter-dot${trust.level >= 2 ? ' active' : ''}`} style={{ left: '37.5%' }} title="Overeny" />
              <div className={`mc-meter-dot${trust.level >= 3 ? ' active' : ''}`} style={{ left: '62.5%' }} title="Staly" />
              <div className={`mc-meter-dot${trust.level >= 4 ? ' active' : ''}`} style={{ left: '87.5%' }} title="VIP" />
            </div>
          </div>
          <div className="mc-meter-labels">
            <span>Novy</span><span>Overeny</span><span>Staly</span><span>VIP</span>
          </div>
        </div>

        <div className="mc-meter-card">
          <div className="mc-meter-header">
            <span className="mc-meter-title">Spolehlivost</span>
            <span className="mc-meter-value" style={{ color: reliabilityPct >= 80 ? '#4ade80' : reliabilityPct >= 50 ? '#fbbf24' : '#ef4444' }}>{reliabilityPct}%</span>
          </div>
          <div className="mc-meter-track">
            <div className="mc-meter-fill" style={{
              width: `${reliabilityPct}%`,
              background: reliabilityPct >= 80 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : reliabilityPct >= 50 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
            }} />
          </div>
          <div className="mc-meter-sub">
            {client.totalVisits} navstev / {client.noShowCount} no-show
            {client.firstVisitDate && <> · Od {fmtDate(client.firstVisitDate)}</>}
          </div>
        </div>
      </div>

      <div className="mc-layout">
        {/* ─── LEFT COLUMN ─── */}
        <div className="mc-left">

          {/* Contacts */}
          <div className="mc-card">
            <div className="mc-card-header">
              <span className="mc-card-title">Kontakty</span>
              <span className="mc-badge">{contacts.length}</span>
            </div>
            <ContactSection clientId={client.id}>
              <div className="mc-contact-list">
                {contacts.length === 0 && !client.phoneEncrypted && !client.telegramId && !client.emailEncrypted && (
                  <div className="mc-empty-small">Zadne kontakty</div>
                )}
                {contacts.length > 0 ? (
                  contacts.map((c) => (
                    <ContactRow key={c.id} contact={c} isAdmin={isAdmin} telegramActive={client.telegramActive} telegramLastInteraction={client.telegramLastInteraction} />
                  ))
                ) : (
                  <>
                    {(phone || client.phoneEncrypted) && (
                      <div className="mc-contact-row">
                        <span className="mc-contact-icon" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>T</span>
                        <div className="mc-contact-content">
                          <span className="mc-contact-label">Telefon</span>
                          {phone ? (
                            <a href={`tel:${phone}`} className="mc-contact-value mc-link-accent">{phone}</a>
                          ) : (
                            <span className="mc-encrypted">sifrovano</span>
                          )}
                        </div>
                      </div>
                    )}
                    {client.telegramId && (
                      <div className="mc-contact-row">
                        <span className="mc-contact-icon" style={{ background: 'rgba(34,158,217,0.12)', color: '#229ED9' }}>TG</span>
                        <div className="mc-contact-content">
                          <span className="mc-contact-label">Telegram</span>
                          <span className="mc-contact-value" style={{ color: '#229ED9' }}>{client.telegramId}</span>
                        </div>
                      </div>
                    )}
                    {(email || client.emailEncrypted) && (
                      <div className="mc-contact-row">
                        <span className="mc-contact-icon" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>@</span>
                        <div className="mc-contact-content">
                          <span className="mc-contact-label">Email</span>
                          {email ? (
                            <a href={`mailto:${email}`} className="mc-contact-value" style={{ color: '#60a5fa', textDecoration: 'none' }}>{email}</a>
                          ) : (
                            <span className="mc-encrypted">sifrovano</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {client.deepLinkToken && (
                  <div className="mc-contact-row">
                    <span className="mc-contact-icon" style={{ background: 'rgba(34,158,217,0.12)', color: '#229ED9' }}>DL</span>
                    <div className="mc-contact-content">
                      <span className="mc-contact-label">Deep-link {client.telegramId ? '(aktivovan)' : ''}</span>
                      <span className="mc-contact-value" style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', color: '#229ED9', userSelect: 'all' }}>
                        t.me/studioflow3_bot?start=LG_{client.deepLinkToken}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ContactSection>
          </div>

          {/* Favorite girls */}
          {girlStats.length > 0 && (
            <div className="mc-card">
              <div className="mc-card-header">
                <span className="mc-card-title">Oblibene divky</span>
              </div>
              <div className="mc-girls-list">
                {girlStats.map((gs, i) => (
                  <div key={gs.girlName} className={`mc-girl-row${i === 0 ? ' mc-girl-fav' : ''}`}>
                    <span className="mc-girl-rank" style={i === 0 ? { background: 'linear-gradient(135deg, var(--coral), #c9536a)', color: '#fff' } : undefined}>{i + 1}</span>
                    <span className="mc-girl-name">{gs.girlName}</span>
                    <span className="mc-girl-count">{gs.visitCount}x</span>
                    {i === 0 && <span className="mc-girl-star">★</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date info */}
          <div className="mc-card mc-card-meta">
            {client.firstVisitDate && (
              <div className="mc-meta-row">
                <span className="mc-meta-label">Prvni navsteva</span>
                <span className="mc-meta-value">{fmtDate(client.firstVisitDate)}</span>
              </div>
            )}
            {client.lastVisitDate && (
              <div className="mc-meta-row">
                <span className="mc-meta-label">Posledni navsteva</span>
                <span className="mc-meta-value">{fmtDate(client.lastVisitDate)}</span>
              </div>
            )}
            {client.regularSince && (
              <div className="mc-meta-row">
                <span className="mc-meta-label">Staly od</span>
                <span className="mc-meta-value" style={{ color: '#4ade80' }}>{client.regularSince}. navstevy</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="mc-right">

          {/* Duplicates warning */}
          {isAdmin && (
            <ClientDuplicates
              clientId={client.id}
              clientNickname={client.nickname}
              clientNumber={client.clientNumber}
            />
          )}

          {/* Notes */}
          <ClientNotes clientId={client.id} initialNotes={client.notes ?? ''} />

          {/* Trust / Ban actions */}
          <ClientTrustActions
            clientId={client.id}
            currentTrustLevel={client.trustLevel}
            isBanned={client.isBanned}
            banReason={client.banReason}
          />

          {/* Active bookings highlight */}
          {activeBookings.length > 0 && (
            <div className="mc-card mc-card-active">
              <div className="mc-card-header">
                <span className="mc-card-title">Aktivni rezervace</span>
                <span className="mc-badge mc-badge-active">{activeBookings.length}</span>
              </div>
              {activeBookings.map((h) => {
                const st = STATUS_META[h.status] ?? { label: h.status, color: '#6a5e72', bg: 'rgba(106,94,114,0.10)', icon: '·' };
                return (
                  <a key={h.id} href={`/booking/calendar?view=day&date=${h.date}&detail=${h.id}`} className="mc-active-item">
                    <div className="mc-active-indicator" style={{ background: st.color }} />
                    <div className="mc-active-info">
                      <span className="mc-active-girl">{h.girlName}</span>
                      <span className="mc-active-date">{fmtDate(h.date)} · {h.startTime?.substring(0, 5)}</span>
                    </div>
                    <div className="mc-active-right">
                      <span className="mc-status-pill" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      {h.price != null && <span className="mc-active-price">{fmtMoney(h.price)}</span>}
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Booking history — timeline style */}
          <div className="mc-card">
            <div className="mc-card-header">
              <span className="mc-card-title">Historie rezervaci</span>
              <span className="mc-badge">{history.length}</span>
            </div>

            {history.length === 0 ? (
              <div className="mc-empty">Zatim zadne rezervace.</div>
            ) : (
              <>
                {/* Desktop table */}
                <table className="mc-table">
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
                      const st = STATUS_META[h.status] ?? { label: h.status, color: '#6a5e72', bg: 'rgba(106,94,114,0.10)', icon: '·' };
                      const ch = CHANNEL_LABELS[h.channel] ?? h.channel;
                      return (
                        <tr key={h.id}>
                          <td>
                            <a href={`/booking/calendar?view=day&date=${h.date}&detail=${h.id}`} className="mc-table-link">
                              {fmtDate(h.date)} <span className="mc-table-time">{h.startTime?.substring(0, 5)}</span>
                            </a>
                          </td>
                          <td className="mc-table-girl">{h.girlName}</td>
                          <td>{h.durationMinutes}m</td>
                          <td><span className="mc-channel-tag">{ch}</span></td>
                          <td>
                            <span className="mc-status-pill" style={{ color: st.color, background: st.bg }}>
                              <span className="mc-status-icon">{st.icon}</span> {st.label}
                            </span>
                          </td>
                          <td className="mc-table-price">{h.price != null ? fmtMoney(h.price) : '--'}</td>
                          <td className="mc-table-points">{h.pointsEarned > 0 ? h.pointsEarned.toLocaleString('cs-CZ') : '--'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile timeline cards */}
                <div className="mc-timeline">
                  {history.map((h) => {
                    const st = STATUS_META[h.status] ?? { label: h.status, color: '#6a5e72', bg: 'rgba(106,94,114,0.10)', icon: '·' };
                    return (
                      <a key={h.id} href={`/booking/calendar?view=day&date=${h.date}&detail=${h.id}`} className="mc-timeline-item">
                        <div className="mc-timeline-dot" style={{ background: st.color }} />
                        <div className="mc-timeline-card">
                          <div className="mc-timeline-top">
                            <span className="mc-timeline-date">{fmtDate(h.date)} {h.startTime?.substring(0, 5)}</span>
                            <span className="mc-status-pill" style={{ color: st.color, background: st.bg }}>
                              {st.label}
                            </span>
                          </div>
                          <div className="mc-timeline-body">
                            <span className="mc-timeline-girl">{h.girlName}</span>
                            <span className="mc-timeline-dur">{h.durationMinutes}m</span>
                            {h.price != null && <span className="mc-timeline-price">{fmtMoney(h.price)}</span>}
                          </div>
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
.mc-bread {
  margin: -24px -24px 0;
  padding: 10px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
  display: flex; align-items: center; gap: 8px;
  font-size: 13px;
}
.mc-bread-link { color: var(--muted); text-decoration: none; }
.mc-bread-link:hover { color: var(--coral); }
.mc-bread-sep { color: var(--dim); }
.mc-bread-current { color: var(--text); font-weight: 600; }

/* ─── Hero Header ─── */
.mc-hero {
  position: relative;
  margin: 0 -24px 20px;
  padding: 28px 24px 24px;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
}
.mc-hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(242,125,141,0.08) 0%, rgba(167,139,250,0.06) 50%, rgba(96,165,250,0.04) 100%);
  pointer-events: none;
}
.mc-hero.mc-hero-banned .mc-hero-bg {
  background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(185,28,28,0.06) 100%);
}
.mc-hero-content {
  position: relative;
  display: flex; align-items: center; gap: 20px;
  max-width: 1100px; margin: 0 auto;
}
.mc-avatar {
  width: 80px; height: 80px; border-radius: 20px;
  background: linear-gradient(135deg, var(--coral), #c9536a);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 32px -8px rgba(242,125,141,0.4);
  position: relative;
}
.mc-avatar.banned {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  box-shadow: 0 8px 32px -8px rgba(239,68,68,0.4);
}
.mc-avatar-letter {
  font-size: 32px; font-weight: 800; color: #fff;
  line-height: 1;
}
.mc-avatar-ban {
  position: absolute; bottom: -3px; right: -3px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #ef4444; border: 2.5px solid var(--bg-soft);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #fff;
}
.mc-hero-info { flex: 1; min-width: 0; }
.mc-hero-name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mc-hero-name {
  font-size: 24px; font-weight: 800; color: var(--text);
  margin: 0; line-height: 1.2;
}
.mc-hero-badge {
  display: inline-flex; align-items: center;
  padding: 4px 14px; border-radius: 999px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid;
  backdrop-filter: blur(8px);
}
.mc-hero-meta {
  display: flex; align-items: center; gap: 12px;
  margin-top: 6px; flex-wrap: wrap;
}
.mc-hero-code {
  font-size: 12px; color: var(--dim);
  font-family: ui-monospace, monospace;
  background: rgba(168,156,176,0.08);
  padding: 2px 8px; border-radius: 4px;
}
.mc-hero-source {
  font-size: 11px; color: var(--purple); font-weight: 600;
  background: rgba(167,139,250,0.1);
  padding: 2px 8px; border-radius: 4px;
}
.mc-hero-fav {
  font-size: 11px; color: var(--coral); font-weight: 600;
}
.mc-hero-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--coral), #c9536a);
  color: #fff; border: none; border-radius: 12px;
  font-size: 13px; font-weight: 700;
  text-decoration: none; white-space: nowrap;
  box-shadow: 0 4px 20px -4px rgba(242,125,141,0.5);
  transition: all 0.2s;
  flex-shrink: 0;
}
.mc-hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px -4px rgba(242,125,141,0.6);
}

/* ─── Stats Row ─── */
.mc-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto 20px;
}
.mc-stat-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 16px;
  transition: border-color 0.15s;
}
.mc-stat-card:hover { border-color: rgba(242,125,141,0.2); }
.mc-stat-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mc-stat-data { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.mc-stat-num { font-size: 18px; font-weight: 800; color: var(--text); line-height: 1.2; }
.mc-stat-label { font-size: 10px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

/* ─── Trust/Reliability Meters ─── */
.mc-meters-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto 20px;
}
.mc-meter-card {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
}
.mc-meter-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.mc-meter-title { font-size: 11px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
.mc-meter-value { font-size: 13px; font-weight: 800; }
.mc-meter-track {
  position: relative;
  height: 8px; border-radius: 4px;
  background: rgba(168,156,176,0.1);
  overflow: visible;
  margin-bottom: 8px;
}
.mc-meter-fill {
  position: absolute; top: 0; left: 0; height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}
.mc-meter-steps { position: absolute; inset: 0; }
.mc-meter-dot {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--bg-elev);
  border: 2.5px solid rgba(168,156,176,0.2);
  transition: all 0.3s;
}
.mc-meter-dot.active {
  border-color: currentColor;
  background: var(--bg-elev);
  box-shadow: 0 0 0 2px rgba(168,156,176,0.1);
}
.mc-meter-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: var(--dim); letter-spacing: 0.02em;
}
.mc-meter-sub {
  font-size: 11px; color: var(--dim);
  margin-top: 4px;
}

/* ─── Two-column layout ─── */
.mc-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

/* ─── Generic card ─── */
.mc-card {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}
.mc-card-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
}
.mc-card-title {
  font-size: 11px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.08em; font-weight: 700;
}
.mc-badge {
  font-size: 10px; font-weight: 700; color: var(--coral);
  background: rgba(242,125,141,0.12); padding: 2px 8px;
  border-radius: 999px;
}
.mc-badge-active {
  color: #4ade80; background: rgba(74,222,128,0.12);
}

/* ─── Contact ─── */
.mc-contact-list { display: flex; flex-direction: column; gap: 0; }
.mc-contact-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(42,34,48,0.3);
}
.mc-contact-row:last-child { border-bottom: none; }
.mc-contact-icon {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; flex-shrink: 0;
}
.mc-contact-content { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.mc-contact-label { font-size: 10px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; }
.mc-contact-value { font-size: 13px; color: var(--text); font-weight: 500; }
.mc-contact-empty { font-size: 13px; color: var(--dim); }
.mc-link-accent { color: var(--coral) !important; text-decoration: none; font-weight: 600; }
.mc-link-accent:hover { text-decoration: underline; }
.mc-encrypted {
  display: inline-block; font-size: 10px; padding: 2px 8px;
  background: rgba(167,139,250,0.12); color: var(--purple);
  border-radius: 4px; font-weight: 600;
}
.mc-primary-tag {
  display: inline-block; font-size: 8px; padding: 1px 5px;
  background: rgba(74,222,128,0.12); color: #4ade80;
  border-radius: 3px; font-weight: 700; margin-left: 6px;
  letter-spacing: 0.05em; vertical-align: middle;
}
.mc-tg-status {
  display: flex; gap: 8px; align-items: center; margin-top: 2px; flex-wrap: wrap;
}
.mc-tg-active {
  font-size: 10px; color: #4ade80; font-weight: 600;
  display: flex; align-items: center; gap: 3px;
}
.mc-tg-active::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80; display: inline-block;
}
.mc-tg-inactive { font-size: 10px; color: var(--dim); font-weight: 600; }
.mc-tg-last { font-size: 10px; color: var(--dim); }

/* ─── Girls list ─── */
.mc-girls-list { display: flex; flex-direction: column; gap: 0; }
.mc-girl-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px; border-radius: 8px;
  transition: background 0.1s;
}
.mc-girl-row:hover { background: rgba(242,125,141,0.04); }
.mc-girl-fav { background: rgba(242,125,141,0.06); }
.mc-girl-rank {
  width: 24px; height: 24px; border-radius: 8px;
  background: rgba(242,125,141,0.1); color: var(--coral);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; flex-shrink: 0;
}
.mc-girl-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--text); }
.mc-girl-count { font-size: 12px; font-weight: 700; color: var(--muted); font-family: ui-monospace, monospace; }
.mc-girl-star { color: var(--coral); font-size: 14px; }

/* ─── Meta rows ─── */
.mc-card-meta { padding: 12px 16px; }
.mc-meta-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(42,34,48,0.2);
}
.mc-meta-row:last-child { border-bottom: none; }
.mc-meta-label { font-size: 11px; color: var(--dim); }
.mc-meta-value { font-size: 12px; font-weight: 600; color: var(--text); }

/* ─── Active bookings highlight ─── */
.mc-card-active {
  border-color: rgba(74,222,128,0.2);
  background: linear-gradient(135deg, var(--bg-elev), rgba(74,222,128,0.02));
}
.mc-active-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(42,34,48,0.3);
  text-decoration: none;
  transition: background 0.1s;
  border-radius: 8px;
  padding-left: 4px;
}
.mc-active-item:last-child { border-bottom: none; }
.mc-active-item:hover { background: rgba(242,125,141,0.03); }
.mc-active-indicator {
  width: 4px; height: 32px; border-radius: 2px; flex-shrink: 0;
}
.mc-active-info { flex: 1; min-width: 0; }
.mc-active-girl { font-size: 13px; font-weight: 600; color: var(--coral); display: block; }
.mc-active-date { font-size: 11px; color: var(--dim); }
.mc-active-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.mc-active-price { font-size: 12px; font-weight: 600; color: var(--text); }

/* ─── Status pill ─── */
.mc-status-pill {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 10px; border-radius: 999px;
  font-size: 10px; font-weight: 700;
  white-space: nowrap;
}
.mc-status-icon { font-size: 9px; }

/* ─── History table (desktop) ─── */
.mc-table { width: 100%; font-size: 12px; border-collapse: collapse; }
.mc-table th {
  text-align: left; padding: 8px 6px; font-size: 10px; color: var(--dim);
  text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
  border-bottom: 1px solid var(--line);
}
.mc-table td {
  padding: 10px 6px;
  border-bottom: 1px solid rgba(42,34,48,0.3);
  vertical-align: middle;
}
.mc-table tr:hover { background: rgba(242,125,141,0.02); }
.mc-table-link { color: var(--text); text-decoration: none; font-weight: 500; }
.mc-table-link:hover { color: var(--coral); }
.mc-table-time { color: var(--muted); font-family: ui-monospace, monospace; font-size: 11px; }
.mc-table-girl { font-weight: 600; color: var(--coral); }
.mc-table-price { font-weight: 600; }
.mc-table-points { color: #fbbf24; font-weight: 700; }
.mc-channel-tag {
  display: inline-block; padding: 2px 7px; border-radius: 5px;
  background: rgba(168,156,176,0.08); color: var(--muted);
  font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
}

/* ─── Empty ─── */
.mc-empty {
  padding: 32px 16px; text-align: center;
  color: var(--dim); font-size: 13px;
}
.mc-empty-small {
  padding: 8px 0; font-size: 12px; color: var(--dim);
}

/* ─── Timeline (mobile history) ─── */
.mc-timeline { display: none; }
.mc-timeline-item {
  display: flex; gap: 12px;
  text-decoration: none;
  padding: 4px 0;
  position: relative;
}
.mc-timeline-item::before {
  content: '';
  position: absolute; left: 5px; top: 16px; bottom: -4px;
  width: 1px; background: rgba(42,34,48,0.4);
}
.mc-timeline-item:last-child::before { display: none; }
.mc-timeline-dot {
  width: 11px; height: 11px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
  border: 2px solid var(--bg-elev);
  box-shadow: 0 0 0 1px rgba(42,34,48,0.4);
}
.mc-timeline-card { flex: 1; min-width: 0; padding-bottom: 12px; }
.mc-timeline-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px;
}
.mc-timeline-date { font-size: 12px; font-weight: 600; color: var(--text); }
.mc-timeline-body {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: var(--muted);
}
.mc-timeline-girl { font-weight: 600; color: var(--coral); }
.mc-timeline-dur { color: var(--dim); }
.mc-timeline-price { margin-left: auto; font-weight: 600; color: var(--text); }

/* ─── Responsive ─── */
@media (max-width: 900px) {
  .mc-hero-content { flex-wrap: wrap; }
  .mc-hero-cta { width: 100%; text-align: center; justify-content: center; }

  .mc-stats-row { grid-template-columns: 1fr 1fr; }
  .mc-meters-row { grid-template-columns: 1fr; }

  .mc-layout { grid-template-columns: 1fr; }
  .mc-left { order: 0; }
  .mc-right { order: 1; }
}

@media (max-width: 600px) {
  .mc-hero { padding: 20px 16px; margin: 0 -16px 16px; }
  .mc-avatar { width: 56px; height: 56px; border-radius: 16px; }
  .mc-avatar-letter { font-size: 24px; }
  .mc-hero-name { font-size: 18px; }

  .mc-stats-row { grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .mc-stat-card { padding: 10px 12px; }
  .mc-stat-icon { width: 34px; height: 34px; border-radius: 10px; }
  .mc-stat-num { font-size: 15px; }

  .mc-table { display: none; }
  .mc-timeline { display: block; }
}
`;
