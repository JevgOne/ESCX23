import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { getGirlName } from '@/lib/studio-queries';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Studio · STUDIOFLOW', template: '%s · Studio' },
  robots: { index: false, follow: false, nocache: true },
  manifest: '/studio-manifest.json',
  appleWebApp: {
    capable: true,
    title: 'STUDIOFLOW',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c0a0e',
};

const STUDIO_STYLES = `
  :root {
    --bg: #0c0a0e;
    --bg-soft: #15101a;
    --bg-elev: #1f1726;
    --line: #2a2230;
    --text: #f4eef4;
    --muted: #a89cb0;
    --dim: #6a5e72;
    --coral: #f27d8d;
    --green: #4ade80;
    --blue: #60a5fa;
    --yellow: #fbbf24;
    --red: #ef4444;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    min-height: 100dvh;
  }
  .studio-shell {
    max-width: 430px;
    margin: 0 auto;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg-soft);
    position: relative;
  }
  .studio-header {
    padding: 12px 20px;
    border-bottom: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .studio-logo {
    font-size: 16px;
    font-weight: 800;
    color: var(--coral);
    letter-spacing: -0.02em;
  }
  .studio-user {
    font-size: 12px;
    color: var(--muted);
  }
  .studio-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 72px;
    -webkit-overflow-scrolling: touch;
  }
  .studio-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    display: flex;
    border-top: 1px solid var(--line);
    background: var(--bg-soft);
    padding-bottom: env(safe-area-inset-bottom, 8px);
    z-index: 50;
  }
  .studio-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0 4px;
    gap: 3px;
    font-size: 10px;
    color: var(--dim);
    font-weight: 600;
    text-decoration: none;
    position: relative;
  }
  .studio-nav-item.active { color: var(--coral); }
  .studio-nav-icon { font-size: 20px; }
  .studio-nav-badge {
    position: absolute;
    top: 4px;
    right: calc(50% - 18px);
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--coral);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const NAV_ITEMS = [
  { label: 'Prehled', href: '/studio/dashboard', icon: '\u{2630}' },
  { label: 'Rozvrh', href: '/studio/schedule', icon: '\u{1F4C5}' },
  { label: 'Notifikace', href: '/studio/notifications', icon: '\u{1F514}', badgeKey: 'notifs' as const },
  { label: 'Nastaveni', href: '/studio/settings', icon: '\u{2699}' },
];

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/booking');
  }
  if (user.role !== 'girl') {
    redirect('/booking');
  }

  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';

  // Check if girl must change password — redirect to settings (but not if already there)
  if (!pathname.startsWith('/studio/settings')) {
    const pwCheck = await db.execute({
      sql: 'SELECT force_password_change FROM users WHERE id = ?',
      args: [user.id],
    }).catch(() => ({ rows: [{ force_password_change: 0 }] }));
    if (Number(pwCheck.rows[0]?.force_password_change) === 1) {
      redirect('/studio/settings?force=1');
    }
  }

  // Get girl name and unread notification count
  let girlName = user.email.split('@')[0];
  let unreadCount = 0;

  if (user.girl_id) {
    const [name, countResult] = await Promise.all([
      getGirlName(user.girl_id),
      db.execute({
        sql: 'SELECT COUNT(*) AS c FROM girl_notifications WHERE girl_id = ? AND is_read = 0',
        args: [user.girl_id],
      }).catch(() => ({ rows: [{ c: 0 }] })),
    ]);
    girlName = name;
    unreadCount = Number(countResult.rows[0]?.c ?? 0);
  }

  return (
    <html lang="cs">
      <body>
        <style dangerouslySetInnerHTML={{ __html: STUDIO_STYLES }} />
        <div className="studio-shell">
          <div className="studio-header">
            <div className="studio-logo">STUDIOFLOW</div>
            <div className="studio-user">{girlName}</div>
          </div>

          <div className="studio-content">
            {children}
          </div>

          <nav className="studio-bottom-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const badge = item.badgeKey === 'notifs' ? unreadCount : 0;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`studio-nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="studio-nav-icon">{item.icon}</span>
                  {badge > 0 && (
                    <span className="studio-nav-badge">{badge > 9 ? '9+' : badge}</span>
                  )}
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </body>
    </html>
  );
}
