import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser, requireBooking } from '@/lib/auth';
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
  .sf-topbar-role.operator { background: rgba(96,165,250,0.2); color: var(--blue); }
  .sf-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }
  @media (max-width: 768px) {
    .sf-main-area { margin-left: 0; }
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
        <body>{children}</body>
      </html>
    );
  }

  // All other pages require auth
  const user = await requireBooking();

  const displayName = user.email.split('@')[0];
  const roleLabel = user.role === 'admin' ? 'Admin' : 'Operátorka';

  return (
    <html lang="cs">
      <body>
        <style dangerouslySetInnerHTML={{ __html: SHELL_STYLES }} />
        <div className="sf-shell">
          <BookingSidebar role={user.role} currentPath={pathname} />
          <div className="sf-main-area">
            <div className="sf-topbar">
              <div />
              <div className="sf-topbar-user">
                <span className="sf-topbar-name">{displayName}</span>
                <span className={`sf-topbar-role ${user.role}`}>{roleLabel}</span>
              </div>
            </div>
            <div className="sf-content">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
