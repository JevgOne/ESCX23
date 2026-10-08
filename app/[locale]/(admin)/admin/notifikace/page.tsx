import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/admin-notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function NotifIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const TYPE_ICON: Record<string, { icon: ReactNode; color: string }> = {
  review_new: {
    icon: <NotifIcon d="M10 1.5l2.47 5.01L18 7.27l-4 3.9.94 5.49L10 14.27l-4.94 2.39L6 11.17l-4-3.9 5.53-.76L10 1.5z" />,
    color: '#f59e0b',
  },
  application_new: {
    icon: <NotifIcon d="M6 2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm1 4h6m-6 3h6m-6 3h3" />,
    color: '#8b5cf6',
  },
  booking_created: {
    icon: <NotifIcon d="M3 5a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 3h14M7 1v3m6-3v3" />,
    color: '#10b981',
  },
};

const BELL_ICON = (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-dim)' }}>
    <path d="M10 2a5 5 0 00-5 5c0 5-2 6-2 6h14s-2-1-2-6a5 5 0 00-5-5M8.5 17a1.5 1.5 0 003 0" />
  </svg>
);

const BELL_ICON_SM = (
  <NotifIcon d="M10 2a5 5 0 00-5 5c0 5-2 6-2 6h14s-2-1-2-6a5 5 0 00-5-5M8.5 17a1.5 1.5 0 003 0" />
);

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
          <div style={{ marginBottom: '12px' }}>{BELL_ICON}</div>
          <p>Žádné notifikace</p>
        </div>
      )}

      <div className="admin-notifications-list">
        {notifications.map((n) => {
          const typeInfo = TYPE_ICON[n.type] ?? { icon: BELL_ICON_SM, color: 'var(--color-text-muted)' };
          return (
            <div
              key={n.id}
              className={`admin-notification-item${n.read === 0 ? ' unread' : ''}`}
            >
              <div
                className="admin-notification-icon"
                style={{ color: typeInfo.color }}
              >
                {typeInfo.icon}
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
