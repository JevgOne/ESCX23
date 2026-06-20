import { headers } from 'next/headers';
import { getApplicationCounts } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { getUnreadNotificationCount } from '@/lib/admin-notifications';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  managerCanSee?: boolean;
}

// `managerCanSee: true` = visible to both admin and manager.
// Without flag = admin only.
const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', managerCanSee: true },
  { href: '/admin/notifikace', label: 'Notifikace', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', managerCanSee: true },
  { href: '/admin/divky', label: 'Dívky', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', managerCanSee: true },
  { href: '/admin/aplikace', label: 'Aplikace', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/admin/schedules', label: 'Rozvrhy', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', managerCanSee: true },
  { href: '/admin/verifikace', label: 'Verifikace fotek', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/admin/recenze', label: 'Recenze', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', managerCanSee: true },
  { href: '/admin/recenze-apartmanu', label: 'Recenze apartmanu', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', managerCanSee: true },
  { href: '/admin/clenove', label: 'Členové', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/admin/pobocky', label: 'Pobočky', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { href: '/admin/stories', label: 'Stories', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z', managerCanSee: true },
  { href: '/admin/cenik', label: 'Ceník', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/admin/slevy', label: 'Slevy', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '/admin/blog', label: 'Blog', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { href: '/admin/faq', label: 'FAQ', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/admin/rezervace', label: 'Rezervace', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', managerCanSee: true },
  { href: '/admin/og', label: 'OG Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/admin/seo', label: 'SEO', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
];

export default async function AdminSidebar() {
  const hdrs = await headers();
  const pathname = hdrs.get('x-invoke-path') ?? hdrs.get('next-url') ?? '';
  const localeMatch = pathname.match(/^\/(cs|en|de|uk)\//);
  const locale = localeMatch ? localeMatch[1] : 'cs';

  const user = await getCurrentUser().catch(() => null);
  const isManager = user?.role === 'manager';
  const visibleNav = isManager
    ? NAV.filter((item) => item.managerCanSee === true)
    : NAV;

  let pendingApplications = 0;
  let unreadNotifications = 0;
  let pendingReviews = 0;
  let pendingAptReviews = 0;
  try {
    const counts = await getApplicationCounts();
    pendingApplications = counts.pending;
  } catch {
    // ignore — sidebar shouldn't crash if DB is unavailable
  }
  try {
    unreadNotifications = await getUnreadNotificationCount();
  } catch {
    // ignore
  }
  try {
    const res = await (await import('@/lib/db')).db.execute(
      `SELECT COUNT(*) AS cnt FROM reviews WHERE status = 'pending'`
    );
    pendingReviews = Number(res.rows[0]?.cnt ?? 0);
  } catch {
    // ignore
  }
  try {
    const res = await (await import('@/lib/db')).db.execute(
      `SELECT COUNT(*) AS cnt FROM apartment_reviews WHERE status = 'pending'`
    );
    pendingAptReviews = Number(res.rows[0]?.cnt ?? 0);
  } catch {
    // ignore
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <span>LG</span>
        <span className="admin-sidebar-logo-text">{isManager ? 'Manažer' : 'Admin'}</span>
      </div>
      <nav className="admin-sidebar-nav">
        {visibleNav.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = item.href === '/admin'
            ? pathname === `/${locale}/admin` || pathname === '/admin'
            : pathname.startsWith(fullHref);
          const badge = item.href === '/admin/aplikace' && pendingApplications > 0
            ? pendingApplications
            : item.href === '/admin/notifikace' && unreadNotifications > 0
              ? unreadNotifications
              : item.href === '/admin/recenze' && pendingReviews > 0
                ? pendingReviews
                : item.href === '/admin/recenze-apartmanu' && pendingAptReviews > 0
                  ? pendingAptReviews
                  : null;
          return (
            <a
              key={item.href}
              href={fullHref}
              className={isActive ? 'active' : ''}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d={item.icon} />
              </svg>
              {item.label}
              {badge != null && (
                <span className="admin-sidebar-badge">{badge}</span>
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
