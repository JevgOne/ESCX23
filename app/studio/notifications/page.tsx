import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function getPragueDate(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }),
  );
}

function formatRelativeTime(dateStr: string, now: Date): string {
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'prave ted';
  if (diffMin < 60) return `pred ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `pred ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'vcera';
  if (diffDays < 7) return `pred ${diffDays} dny`;
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
}

function isToday(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

const STYLES = `
  .notif-section-label {
    padding: 12px 20px 6px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--dim);
    font-weight: 700;
  }
  .notif-item {
    display: flex;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--line);
  }
  .notif-item-unread { background: rgba(242,125,141,0.04); }
  .notif-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
  }
  .notif-dot-new-booking { background: var(--green); }
  .notif-dot-cancelled { background: var(--red); }
  .notif-dot-reminder { background: var(--yellow); }
  .notif-dot-schedule { background: var(--blue); }
  .notif-dot-default { background: var(--dim); }
  .notif-body { flex: 1; min-width: 0; }
  .notif-text { font-size: 13px; line-height: 1.4; }
  .notif-text b { font-weight: 700; }
  .notif-time { font-size: 10px; color: var(--dim); margin-top: 3px; }
  .notif-empty {
    padding: 40px 20px;
    text-align: center;
  }
  .notif-empty-icon { font-size: 32px; margin-bottom: 8px; }
  .notif-empty-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .notif-empty-sub { font-size: 12px; color: var(--dim); }
`;

function dotClass(type: string): string {
  switch (type) {
    case 'new_booking': return 'notif-dot notif-dot-new-booking';
    case 'cancelled': return 'notif-dot notif-dot-cancelled';
    case 'reminder': return 'notif-dot notif-dot-reminder';
    case 'schedule_change': return 'notif-dot notif-dot-schedule';
    default: return 'notif-dot notif-dot-default';
  }
}

export default async function StudioNotificationsPage() {
  const user = await requireGirl();
  if (!user.girl_id) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: 'var(--red)' }}>Ucet neni propojen s profilem.</p>
      </div>
    );
  }

  // Fetch notifications for this girl (last 50)
  const result = await db.execute({
    sql: `
      SELECT id, type, message, is_read, created_at
      FROM girl_notifications
      WHERE girl_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `,
    args: [user.girl_id],
  });

  const notifications: Notification[] = result.rows.map((r) => ({
    id: Number(r.id),
    type: String(r.type ?? 'default'),
    message: String(r.message ?? ''),
    isRead: Boolean(r.is_read),
    createdAt: String(r.created_at ?? ''),
  }));

  const now = getPragueDate();

  const todayNotifs = notifications.filter((n) => isToday(n.createdAt, now));
  const olderNotifs = notifications.filter((n) => !isToday(n.createdAt, now));

  // Mark unread as read
  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
  if (unreadIds.length > 0) {
    const placeholders = unreadIds.map(() => '?').join(',');
    db.execute({
      sql: `UPDATE girl_notifications SET is_read = 1 WHERE id IN (${placeholders})`,
      args: unreadIds,
    }).catch(() => { /* best-effort */ });
  }

  if (notifications.length === 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className="notif-empty">
          <div className="notif-empty-icon">&#128276;</div>
          <div className="notif-empty-title">Zadne notifikace</div>
          <div className="notif-empty-sub">Nemas zatim zadne zpravy.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {todayNotifs.length > 0 && (
        <>
          <div className="notif-section-label">Dnes</div>
          {todayNotifs.map((n) => (
            <div key={n.id} className={`notif-item ${!n.isRead ? 'notif-item-unread' : ''}`}>
              <div className={dotClass(n.type)} />
              <div className="notif-body">
                <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.message }} />
                <div className="notif-time">{formatRelativeTime(n.createdAt, now)}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {olderNotifs.length > 0 && (
        <>
          <div className="notif-section-label">Starsi</div>
          {olderNotifs.map((n) => (
            <div key={n.id} className={`notif-item ${!n.isRead ? 'notif-item-unread' : ''}`}>
              <div className={dotClass(n.type)} />
              <div className="notif-body">
                <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.message }} />
                <div className="notif-time">{formatRelativeTime(n.createdAt, now)}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
