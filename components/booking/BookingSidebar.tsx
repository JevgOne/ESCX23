import { logoutBookingAction } from '@/lib/auth-actions';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Booking',
    items: [
      { label: 'Dashboard', href: '/booking/dashboard', icon: '\u{1F4CA}' },
      { label: 'Kalendář', href: '/booking/calendar', icon: '\u{1F4C5}' },
      { label: 'Klienti', href: '/booking/clients', icon: '\u{1F464}' },
      { label: 'Rozvrh směn', href: '/booking/schedule', icon: '\u{1F551}' },
    ],
  },
  {
    title: 'Správa',
    items: [
      { label: 'Dívky', href: '/booking/girls', icon: '\u{1F469}', adminOnly: true },
      { label: 'Pobočky', href: '/booking/locations', icon: '\u{1F3E0}', adminOnly: true },
      { label: 'Reporty', href: '/booking/reports', icon: '\u{1F4C8}', adminOnly: true },
    ],
  },
  {
    title: 'Systém',
    items: [
      { label: 'Nastavení', href: '/booking/settings', icon: '\u2699\uFE0F', adminOnly: true },
      { label: 'Audit log', href: '/booking/audit', icon: '\u{1F4DC}', adminOnly: true },
      { label: 'Uživatelé', href: '/booking/users', icon: '\u{1F465}', adminOnly: true },
      { label: 'TG Bot', href: '/booking/telegram', icon: '\u2708\uFE0F', adminOnly: true },
    ],
  },
];

const SIDEBAR_STYLES = `
.sf-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-w);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-y: auto;
}
.sf-sidebar-brand {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--line);
}
.sf-sidebar-logo {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.sf-sidebar-logo span { color: var(--coral); }
.sf-sidebar-sub {
  font-size: 10px;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 2px;
}

.sf-nav { flex: 1; padding: 12px 0; }
.sf-nav-section-label {
  padding: 8px 24px 4px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--dim);
  font-weight: 700;
}
.sf-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  margin: 1px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  transition: all 0.12s;
}
.sf-nav-item:hover {
  background: rgba(242, 125, 141, 0.06);
  color: var(--text);
}
.sf-nav-item.active {
  background: rgba(242, 125, 141, 0.12);
  color: var(--coral);
}
.sf-nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}
.sf-nav-sep {
  height: 1px;
  background: var(--line);
  margin: 8px 12px;
}
.sf-nav-locked {
  padding: 20px 24px;
  font-size: 11px;
  color: var(--dim);
  text-align: center;
  line-height: 1.6;
}
.sf-nav-locked-icon {
  font-size: 20px;
  margin-bottom: 8px;
  opacity: 0.3;
  display: block;
}

.sf-sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
}
.sf-logout-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: var(--dim);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  text-align: center;
}
.sf-logout-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.2);
}

@media (max-width: 768px) {
  .sf-sidebar { display: none; }
}
`;

export default function BookingSidebar({
  role,
  currentPath,
}: {
  role: string;
  currentPath: string;
}) {
  const isAdmin = role === 'admin';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_STYLES }} />
      <nav className="sf-sidebar">
        <div className="sf-sidebar-brand">
          <div className="sf-sidebar-logo">STUDIO<span>FLOW</span></div>
          <div className="sf-sidebar-sub">Booking system</div>
        </div>

        <div className="sf-nav">
          {NAV_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isAdmin,
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={si}>
                {si > 0 && <div className="sf-nav-sep" />}
                <div className="sf-nav-section-label">{section.title}</div>
                {visibleItems.map((item) => {
                  const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`sf-nav-item${isActive ? ' active' : ''}`}
                    >
                      <span className="sf-nav-icon">{item.icon}</span>
                      {item.label}
                    </a>
                  );
                })}
              </div>
            );
          })}

          {!isAdmin && (
            <>
              <div className="sf-nav-sep" />
              <div className="sf-nav-locked">
                <span className="sf-nav-locked-icon">{'\u{1F512}'}</span>
                Sekce Správa a Systém<br />nejsou dostupné pro operátorku
              </div>
            </>
          )}
        </div>

        <div className="sf-sidebar-footer">
          <form action={logoutBookingAction}>
            <button type="submit" className="sf-logout-btn">
              Odhlásit se
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
