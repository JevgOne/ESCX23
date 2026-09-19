import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser, requireBooking } from '@/lib/auth';
import { getUnreadCount } from '@/lib/booking-notifications';
import BookingSidebar from '@/components/booking/BookingSidebar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'STUDIOFLOW', template: '%s · STUDIOFLOW' },
  robots: { index: false, follow: false, nocache: true },
};

const SHELL_STYLES = `
  :root {
    --bg: #0c0a0e;
    --bg-soft: #15101a;
    --bg-elev: #1f1726;
    --bg-sidebar: #110d15;
    --line: #2a2230;
    --text: #f4eef4;
    --muted: #a89cb0;
    --dim: #6a5e72;
    --coral: #f27d8d;
    --green: #4ade80;
    --blue: #60a5fa;
    --yellow: #fbbf24;
    --red: #ef4444;
    --purple: #a78bfa;
    --teal: #2dd4bf;
    --sidebar-w: 240px;
    --topbar-h: 56px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  .sf-shell {
    display: flex;
    min-height: 100vh;
  }
  .sf-main-area {
    flex: 1;
    margin-left: var(--sidebar-w);
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .sf-topbar {
    height: var(--topbar-h);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: var(--bg-soft);
    border-bottom: 1px solid var(--line);
  }
  .sf-topbar-user {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
  .sf-topbar-name { font-weight: 600; }
  .sf-topbar-role {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .sf-topbar-role.admin { background: rgba(242,125,141,0.2); color: var(--coral); }
  .sf-topbar-role.manager { background: rgba(167,139,250,0.2); color: var(--purple); }
  .sf-topbar-role.operator { background: rgba(96,165,250,0.2); color: var(--blue); }
  .sf-notif-link {
    position: relative;
    text-decoration: none;
    font-size: 18px;
    line-height: 1;
    padding: 4px;
  }
  .sf-notif-badge {
    position: absolute;
    top: -4px; right: -6px;
    min-width: 16px; height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--red);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .sf-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }
  @media (max-width: 768px) {
    .sf-main-area { margin-left: 0; max-width: 100vw; overflow-x: hidden; }
    .sf-content { overflow-x: hidden; }
  }

  /* Mobile hamburger + sidebar toggle */
  .sf-sidebar-toggle-input { display: none; }
  .sf-sidebar-overlay { display: none; }
  .sf-hamburger { display: none; }

  @media (max-width: 768px) {
    .sf-hamburger {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: var(--muted);
      padding: 4px;
    }
    .sf-sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 99;
    }
    .sf-sidebar-toggle-input:checked ~ .sf-shell .sf-sidebar-overlay {
      display: block;
    }
    .sf-sidebar-toggle-input:checked ~ .sf-shell .sf-sidebar {
      display: flex;
      left: 0;
    }
  }

  /* Bottom navigation bar */
  .sf-bottom-nav { display: none; }

  @media (max-width: 768px) {
    .sf-bottom-nav {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-sidebar);
      border-top: 1px solid var(--line);
      z-index: 90;
      padding: 6px 0;
      padding-bottom: max(6px, env(safe-area-inset-bottom));
    }
    .sf-bottom-nav a,
    .sf-bottom-nav .sf-bn-more {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      font-size: 10px;
      color: var(--dim);
      text-decoration: none;
      padding: 4px 0;
      cursor: pointer;
    }
    .sf-bottom-nav a.active {
      color: var(--coral);
    }
    .sf-bn-icon { font-size: 18px; line-height: 1; }

    .sf-content {
      padding-bottom: 72px;
    }
  }
`;

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';

  // Login page — no auth, no shell
  const isLoginPage = pathname === '/booking' || pathname === '/booking/';
  if (isLoginPage) {
    return (
      <html lang="cs">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  // All other pages require auth
  const user = await requireBooking();
  const unreadCount = await getUnreadCount().catch(() => 0);

  const displayName = user.email.split('@')[0];
  const roleLabels: Record<string, string> = { admin: 'Admin', manager: 'Manažerka', operator: 'Operátorka' };
  const roleLabel = roleLabels[user.role] ?? user.role;

  return (
    <html lang="cs">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <style dangerouslySetInnerHTML={{ __html: SHELL_STYLES }} />
        <input type="checkbox" id="sf-sidebar-toggle" className="sf-sidebar-toggle-input" />
        <div className="sf-shell">
          <label htmlFor="sf-sidebar-toggle" className="sf-sidebar-overlay" />
          <BookingSidebar role={user.role} currentPath={pathname} />
          <div className="sf-main-area">
            <div className="sf-topbar">
              <label htmlFor="sf-sidebar-toggle" className="sf-hamburger" aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </label>
              <div className="sf-topbar-user">
                <a href="/booking/notifications" className="sf-notif-link" title="Notifikace">
                  {'\u{1F514}'}
                  {unreadCount > 0 && (
                    <span className="sf-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </a>
                <span className="sf-topbar-name">{displayName}</span>
                <span className={`sf-topbar-role ${user.role}`}>{roleLabel}</span>
              </div>
            </div>
            <div className="sf-content">
              {children}
            </div>
            <nav className="sf-bottom-nav">
              <a href="/booking/quick" className={pathname === '/booking/quick' ? 'active' : ''}>
                <span className="sf-bn-icon">{'\u26A1'}</span>
                <span>Rychlá</span>
              </a>
              <a href="/booking/calendar" className={pathname.startsWith('/booking/calendar') ? 'active' : ''}>
                <span className="sf-bn-icon">{'\u{1F4C5}'}</span>
                <span>Kalendář</span>
              </a>
              <a href="/booking/clients" className={pathname.startsWith('/booking/clients') ? 'active' : ''}>
                <span className="sf-bn-icon">{'\u{1F464}'}</span>
                <span>Klienti</span>
              </a>
              <a href="/booking/schedule" className={pathname.startsWith('/booking/schedule') ? 'active' : ''}>
                <span className="sf-bn-icon">{'\u{1F551}'}</span>
                <span>Směny</span>
              </a>
              <label htmlFor="sf-sidebar-toggle" className="sf-bn-more">
                <span className="sf-bn-icon">{'\u2699\uFE0F'}</span>
                <span>Více</span>
              </label>
            </nav>
          </div>
        </div>
      </body>
    </html>
  );
}
