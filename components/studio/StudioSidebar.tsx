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
  { href: '/cs/studio/kalendar',   label: 'Kalendář',      emoji: '🗓️' },
  { href: '/cs/studio/zprava',        label: 'Osobní zpráva',     emoji: '💬' },
  { href: '/cs/studio/hlas',          label: 'Hlasová zpráva',   emoji: '🎙️' },
  { href: '/cs/studio/program',       label: 'Doporučený program', emoji: '💎' },
  { href: '/cs/studio/sluzby',        label: 'Služby',           emoji: '💋' },
  { href: '/cs/studio/hashtagy',      label: 'Hashtagy',         emoji: '#️⃣' },
  { href: '/cs/studio/jazyky',       label: 'Jazyky',           emoji: '🌐' },
  { href: '/cs/studio/fotky',        label: 'Fotky',            emoji: '📷' },
  { href: '/cs/studio/videa',        label: 'Videa',            emoji: '🎬' },
  { href: '/cs/studio/stories',      label: 'Stories',           emoji: '📸' },
  { href: '/cs/studio/recenze',      label: 'Recenze',          emoji: '⭐' },
  { href: '/cs/studio/rezervace',    label: 'Rezervace',        emoji: '📅' },
  { href: '/cs/studio/statistiky',   label: 'Statistiky',       emoji: '📈' },
  { href: '/cs/studio/profil-status', label: 'Status profilu',  emoji: '🟢' },
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
