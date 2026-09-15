/**
 * STUDIOFLOW — User Management (admin-only)
 * Manage booking system users: roles, Telegram links, active status.
 */

import { requireBookingAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UserRow {
  id: number;
  email: string;
  role: string;
  displayName: string | null;
  telegramChatId: string | null;
  isActive: boolean;
  createdAt: string;
}

async function getUsers(): Promise<UserRow[]> {
  const result = await db.execute(
    `SELECT id, email, role, display_name, telegram_chat_id, is_active, created_at
     FROM users
     WHERE role IN ('admin', 'manager', 'operator')
     ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'operator' THEN 3 END, email`
  );

  return result.rows.map((r) => ({
    id: Number(r.id),
    email: String(r.email),
    role: String(r.role),
    displayName: r.display_name ? String(r.display_name) : null,
    telegramChatId: r.telegram_chat_id ? String(r.telegram_chat_id) : null,
    isActive: Number(r.is_active) === 1,
    createdAt: String(r.created_at),
  }));
}

const ROLE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: 'var(--coral)', bg: 'rgba(242,125,141,0.15)' },
  manager: { label: 'Manazerka', color: 'var(--purple)', bg: 'rgba(167,139,250,0.15)' },
  operator: { label: 'Operatorka', color: 'var(--blue)', bg: 'rgba(96,165,250,0.15)' },
};

export default async function UsersPage() {
  await requireBookingAdmin();
  const users = await getUsers();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="usr-topbar">
        <span className="usr-topbar-title">Uzivatele</span>
        <span className="usr-topbar-count">{users.length} uzivatelu</span>
      </div>

      <div className="usr-info">
        Pro prijem eskalaci z TG bota nastavte <b>Telegram Chat ID</b> u operatorky/manazerky.
        Bot posle notifikaci kdyz si nevi rady s klientem.
      </div>

      <div className="usr-list">
        {users.length === 0 && (
          <div className="usr-empty">Zadni uzivatele.</div>
        )}
        {users.map((user) => {
          const badge = ROLE_BADGES[user.role] ?? ROLE_BADGES.operator;
          const initial = (user.displayName ?? user.email).charAt(0).toUpperCase();

          return (
            <div key={user.id} className={`usr-row${!user.isActive ? ' inactive' : ''}`}>
              <div className="usr-avatar" style={{ borderColor: badge.color }}>{initial}</div>
              <div className="usr-main">
                <div className="usr-name">
                  {user.displayName ?? user.email.split('@')[0]}
                  {!user.isActive && <span className="usr-inactive-badge">Neaktivni</span>}
                </div>
                <div className="usr-email">{user.email}</div>
              </div>
              <span
                className="usr-badge"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
              <div className="usr-tg">
                {user.telegramChatId ? (
                  <>
                    <span className="usr-tg-dot active" />
                    <span className="usr-tg-id">{user.telegramChatId}</span>
                  </>
                ) : (
                  <>
                    <span className="usr-tg-dot" />
                    <span className="usr-tg-none">Neni propojeno</span>
                  </>
                )}
              </div>
              <a href={`/booking/users/${user.id}`} className="usr-edit-btn">Upravit</a>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const STYLES = `
.usr-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: -24px -24px 0;
  padding: 12px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
}
.usr-topbar-title { font-size: 18px; font-weight: 700; }
.usr-topbar-count { font-size: 13px; color: var(--muted); }

.usr-info {
  margin: 16px 0;
  padding: 12px 16px;
  background: rgba(96,165,250,0.08);
  border: 1px solid rgba(96,165,250,0.2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.usr-info b { color: var(--text); }

.usr-list { margin: 0 -24px; }
.usr-empty {
  padding: 40px 20px; text-align: center;
  color: var(--dim); font-size: 14px;
}
.usr-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
}
.usr-row.inactive { opacity: 0.5; }
.usr-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--bg-elev); border: 2px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
  color: var(--text);
}
.usr-main { flex: 1; min-width: 0; }
.usr-name {
  font-weight: 600; font-size: 14px;
  display: flex; align-items: center; gap: 8px;
}
.usr-inactive-badge {
  padding: 2px 6px; border-radius: 4px;
  background: rgba(239,68,68,0.15); color: var(--red);
  font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.usr-email { font-size: 12px; color: var(--dim); }
.usr-badge {
  padding: 4px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  flex-shrink: 0;
}
.usr-tg {
  display: flex; align-items: center; gap: 6px;
  min-width: 140px;
}
.usr-tg-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--dim); flex-shrink: 0;
}
.usr-tg-dot.active { background: var(--green); }
.usr-tg-id { font-size: 12px; color: var(--muted); font-family: monospace; }
.usr-tg-none { font-size: 12px; color: var(--dim); }
.usr-edit-btn {
  padding: 6px 14px; border-radius: 6px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); text-decoration: none; font-size: 12px; font-weight: 600;
  flex-shrink: 0;
}
.usr-edit-btn:hover { border-color: var(--coral); color: var(--coral); }

@media (max-width: 768px) {
  .usr-row { flex-wrap: wrap; gap: 8px; }
  .usr-tg { min-width: auto; flex-basis: 100%; margin-left: 52px; }
  .usr-edit-btn { margin-left: auto; }
}
`;
