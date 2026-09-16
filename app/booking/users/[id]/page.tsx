/**
 * STUDIOFLOW — User Edit Page (admin-only)
 * Edit role, display name, Telegram chat ID, active status.
 */

import { redirect } from 'next/navigation';
import { requireBookingAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateUserFromForm } from '@/lib/user-actions';
import { generateUserLinkToken } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

async function getUser(id: number) {
  const result = await db.execute({
    sql: `SELECT id, email, role, display_name, telegram_chat_id, is_active, created_at
          FROM users WHERE id = ? LIMIT 1`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: Number(r.id),
    email: String(r.email),
    role: String(r.role),
    displayName: r.display_name ? String(r.display_name) : '',
    telegramChatId: r.telegram_chat_id ? String(r.telegram_chat_id) : '',
    isActive: Number(r.is_active) === 1,
    createdAt: String(r.created_at),
  };
}

export default async function UserEditPage({ params }: Props) {
  const currentUser = await requireBookingAdmin();
  const { id } = await params;
  const userId = parseInt(id, 10);
  const user = await getUser(userId);

  if (!user) {
    redirect('/booking/users');
  }

  const isSelf = currentUser.id === userId;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="ue-topbar">
        <a href="/booking/users" className="ue-back">&larr; Zpet</a>
        <span className="ue-topbar-title">Upravit uzivatele</span>
      </div>

      <div className="ue-card">
        <div className="ue-header">
          <div className="ue-avatar">
            {(user.displayName || user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="ue-email">{user.email}</div>
            <div className="ue-created">Vytvoren: {user.createdAt}</div>
          </div>
        </div>

        <form action={updateUserFromForm} className="ue-form">
          <input type="hidden" name="userId" value={userId} />
          <label className="ue-label">
            <span>Zobrazovane jmeno</span>
            <input
              type="text"
              name="displayName"
              defaultValue={user.displayName}
              placeholder="Napr. Nikola"
              className="ue-input"
            />
          </label>

          <label className="ue-label">
            <span>Role</span>
            <select name="role" defaultValue={user.role} className="ue-select" disabled={isSelf}>
              <option value="admin">Admin — plny pristup</option>
              <option value="manager">Manazerka — plny pristup k bookingum</option>
              <option value="operator">Operatorka — booking + eskalace z bota</option>
            </select>
            {isSelf && (
              <span className="ue-hint">Vlastni roli nelze zmenit.</span>
            )}
          </label>

          <div className="ue-label">
            <span>Telegram propojeni</span>
            {user.telegramChatId ? (
              <div className="ue-tg-status">
                <span className="ue-tg-linked">Propojeno</span>
                <span className="ue-hint">Chat ID: {user.telegramChatId}</span>
                <input type="hidden" name="telegramChatId" value={user.telegramChatId} />
              </div>
            ) : (
              <div className="ue-tg-status">
                <span className="ue-hint" style={{ marginBottom: '8px', display: 'block' }}>
                  Nepropojeno — poslete tento odkaz uzivateli:
                </span>
                <code className="ue-tg-link">
                  {`https://t.me/studioflow3_bot?start=USER_${generateUserLinkToken(userId)}`}
                </code>
                <span className="ue-hint" style={{ marginTop: '6px', display: 'block' }}>
                  Po kliknuti se ucet propoji automaticky.
                </span>
                <input type="hidden" name="telegramChatId" value="" />
              </div>
            )}
          </div>

          <label className="ue-label ue-checkbox-label">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={user.isActive}
              className="ue-checkbox"
              disabled={isSelf}
            />
            <span>Aktivni ucet</span>
            {isSelf && <span className="ue-hint">Vlastni ucet nelze deaktivovat.</span>}
          </label>


          <div className="ue-actions">
            <a href="/booking/users" className="ue-btn-cancel">Zrusit</a>
            <button type="submit" className="ue-btn-save">Ulozit zmeny</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
const STYLES = `
.ue-topbar {
  display: flex; align-items: center; gap: 12px;
  margin: -24px -24px 0;
  padding: 12px 20px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
}
.ue-back {
  color: var(--muted); text-decoration: none; font-size: 13px;
}
.ue-back:hover { color: var(--coral); }
.ue-topbar-title { font-size: 18px; font-weight: 700; }

.ue-card {
  max-width: 560px;
  margin: 24px auto;
  padding: 24px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.ue-header {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.ue-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--bg-elev); border: 2px solid var(--coral);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px; color: var(--coral);
  flex-shrink: 0;
}
.ue-email { font-weight: 600; font-size: 15px; }
.ue-created { font-size: 12px; color: var(--dim); }

.ue-form { display: flex; flex-direction: column; gap: 18px; }

.ue-label {
  display: flex; flex-direction: column; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--muted);
}
.ue-input, .ue-select {
  padding: 10px 14px;
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 8px; color: var(--text); font-size: 14px;
  outline: none; font-family: inherit;
}
.ue-input:focus, .ue-select:focus { border-color: var(--coral); }
.ue-select { appearance: auto; }
.ue-select:disabled { opacity: 0.5; cursor: not-allowed; }
.ue-hint { font-size: 11px; color: var(--dim); font-weight: 400; }

.ue-checkbox-label {
  flex-direction: row !important; align-items: center; gap: 10px !important;
}
.ue-checkbox {
  width: 18px; height: 18px; accent-color: var(--coral);
}
.ue-checkbox:disabled { opacity: 0.5; }

.ue-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.ue-btn-cancel {
  padding: 10px 20px; border-radius: 8px;
  background: var(--bg-elev); border: 1px solid var(--line);
  color: var(--muted); text-decoration: none;
  font-size: 13px; font-weight: 600; font-family: inherit;
  cursor: pointer;
}
.ue-btn-cancel:hover { color: var(--text); border-color: var(--text); }
.ue-btn-save {
  padding: 10px 24px; border-radius: 8px;
  background: var(--coral); border: none;
  color: #fff; font-size: 13px; font-weight: 700;
  font-family: inherit; cursor: pointer;
}
.ue-btn-save:hover { opacity: 0.9; }

.ue-tg-status { display: flex; flex-direction: column; }
.ue-tg-linked {
  color: #22c55e; font-weight: 600; font-size: 14px;
}
.ue-tg-link {
  font-size: 12px; word-break: break-all;
  background: var(--bg-elev); border: 1px solid var(--line);
  padding: 8px 12px; border-radius: 6px; display: block;
}
`;
