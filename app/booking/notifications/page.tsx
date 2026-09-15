/**
 * STUDIOFLOW — Booking Notifications
 * Shows bot booking notifications for operators/managers.
 */

import { requireBooking } from '@/lib/auth';
import { getNotifications, markAllRead } from '@/lib/booking-notifications';

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  bot_booking: { icon: '\u{1F916}', label: 'TG Bot' },
  booking_cancelled: { icon: '\u274C', label: 'Zruseno' },
  escalation: { icon: '\u26A0\uFE0F', label: 'Eskalace' },
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'prave ted';
  if (mins < 60) return `pred ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `pred ${hours}h`;
  const days = Math.floor(hours / 24);
  return `pred ${days}d`;
}

export default async function NotificationsPage() {
  await requireBooking();

  // Mark all as read on view
  await markAllRead();

  const notifications = await getNotifications(100);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="nf-topbar">
        <span className="nf-topbar-title">Notifikace</span>
        <span className="nf-topbar-count">{notifications.length} celkem</span>
      </div>

      <div className="nf-list">
        {notifications.length === 0 && (
          <div className="nf-empty">Zadne notifikace.</div>
        )}
        {notifications.map((n) => {
          const typeInfo = TYPE_LABELS[n.type] ?? { icon: '\u{1F4E8}', label: n.type };

          return (
            <div key={n.id} className={`nf-row${!n.isRead ? ' unread' : ''}`}>
              <span className="nf-icon">{typeInfo.icon}</span>
              <div className="nf-main">
                <div className="nf-title">
                  <span className="nf-type-badge">{typeInfo.label}</span>
                  {n.title}
                </div>
                <div className="nf-msg">{n.message}</div>
              </div>
              <div className="nf-meta">
                <span className="nf-time">{timeAgo(n.createdAt)}</span>
                {n.link && (
                  <a href={n.link} className="nf-link">Zobrazit</a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const STYLES = `
.nf-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: -24px -24px 0;
  padding: 12px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
}
.nf-topbar-title { font-size: 18px; font-weight: 700; }
.nf-topbar-count { font-size: 13px; color: var(--muted); }

.nf-list { margin: 0 -24px; }
.nf-empty {
  padding: 40px 20px; text-align: center;
  color: var(--dim); font-size: 14px;
}
.nf-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
}
.nf-row.unread { background: rgba(242,125,141,0.04); }
.nf-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
.nf-main { flex: 1; min-width: 0; }
.nf-title { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.nf-type-badge {
  padding: 2px 6px; border-radius: 4px;
  background: var(--bg-elev); border: 1px solid var(--line);
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  color: var(--muted); flex-shrink: 0;
}
.nf-msg { font-size: 13px; color: var(--muted); margin-top: 4px; }
.nf-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.nf-time { font-size: 11px; color: var(--dim); }
.nf-link {
  padding: 4px 10px; border-radius: 6px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); text-decoration: none;
  font-size: 11px; font-weight: 600;
}
.nf-link:hover { border-color: var(--coral); color: var(--coral); }
`;
