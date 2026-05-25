import { headers } from 'next/headers';
import { logoutAction } from '@/lib/auth-actions';

interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

const NAV: NavItem[] = [
  { href: '/cs/studio',             label: 'Dashboard',     emoji: '📊' },
  { href: '/cs/studio/zakladni',    label: 'Základní info', emoji: '👤' },
  { href: '/cs/studio/telo',        label: 'Tělo',          emoji: '📐' },
  { href: '/cs/studio/zivotni-styl',label: 'Životní styl',  emoji: '☕' },
  { href: '/cs/studio/dostupnost',  label: 'Dostupnost',    emoji: '📅' },
  { href: '/cs/studio/profil-status', label: 'Status profilu', emoji: '🟢' },
];

export default async function StudioSidebar() {
  const hdrs = await headers();
  const pathname = hdrs.get('x-invoke-path') ?? hdrs.get('next-url') ?? '';

  return (
    <aside className="studio-sidebar">
      <div className="studio-sidebar-logo">
        <span>LG</span>
        <span className="studio-sidebar-logo-text">Studio</span>
      </div>
      <nav className="studio-sidebar-nav">
        {NAV.map((item) => {
          const isActive = item.href === '/cs/studio'
            ? pathname === '/cs/studio' || pathname === '/studio'
            : pathname.startsWith(item.href.replace('/cs', '')) || pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={isActive ? 'active' : ''}
            >
              <span className="studio-nav-emoji">{item.emoji}</span>
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="studio-sidebar-footer">
        <form action={logoutAction}>
          <button type="submit" className="studio-logout-btn">
            ← Odhlásit
          </button>
        </form>
      </div>
    </aside>
  );
}
