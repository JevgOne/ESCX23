import { logoutAction } from '@/lib/auth-actions';
import type { AuthUser } from '@/lib/auth';

interface AdminTopbarProps {
  title: string;
  user?: AuthUser | null;
}

export default function AdminTopbar({ title, user }: AdminTopbarProps) {
  return (
    <div className="admin-topbar">
      <label htmlFor="admin-sidebar-toggle" className="admin-sidebar-hamburger" aria-label="Otevřít menu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
        </svg>
      </label>
      <h1>{title}</h1>
      <div className="admin-topbar-user">
        <span className="admin-topbar-pill">
          {user ? `${user.role} · ${user.email}` : 'Admin'}
        </span>
        <form action={logoutAction}>
          <button type="submit" className="admin-topbar-logout">Odhlásit</button>
        </form>
      </div>
    </div>
  );
}
