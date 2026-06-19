import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/admin-notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TYPE_ICON: Record<string, { emoji: string; color: string }> = {
  review_new: { emoji: '★', color: '#f59e0b' },
  application_new: { emoji: '📋', color: '#8b5cf6' },
  booking_created: { emoji: '📅', color: '#10b981' },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + 'Z').getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'právě teď';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

export default async function AdminNotifikacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const notifications = await getAdminNotifications(100);
  const unreadCount = notifications.filter((n) => n.read === 0).length;

  async function handleMarkRead(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    await markNotificationRead(id);
  }

  async function handleMarkAllRead(formData: FormData) {
    'use server';
    void formData;
    await markAllNotificationsRead();
  }

  return (
    <>
      <AdminTopbar title="Notifikace" />

      {unreadCount > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <form action={handleMarkAllRead}>
            <button
              type="submit"
              className="admin-btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Označit vše jako přečtené ({unreadCount})
            </button>
          </form>
        </div>
      )}

      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--color-text-dim)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
          <p>Žádné notifikace</p>
        </div>
      )}

      <div className="admin-notifications-list">
        {notifications.map((n) => {
          const typeInfo = TYPE_ICON[n.type] ?? { emoji: '🔔', color: 'var(--color-text-muted)' };
          return (
            <div
              key={n.id}
              className={`admin-notification-item${n.read === 0 ? ' unread' : ''}`}
            >
              <div
                className="admin-notification-icon"
                style={{ color: typeInfo.color }}
              >
                {typeInfo.emoji}
              </div>
              <div className="admin-notification-content">
                <div className="admin-notification-title">
                  {n.link ? (
                    <a href={n.link} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {n.title}
                    </a>
                  ) : (
                    n.title
                  )}
                </div>
                <div className="admin-notification-message">{n.message}</div>
                <div className="admin-notification-time">{timeAgo(n.created_at)}</div>
              </div>
              {n.read === 0 && (
                <form action={handleMarkRead} className="admin-notification-action">
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" title="Označit jako přečtené" style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)',
                    fontSize: '14px', padding: '4px',
                  }}>
                    ✓
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
