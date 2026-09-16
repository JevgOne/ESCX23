/**
 * STUDIOFLOW — Settings Page
 * Promo codes CRUD, notification settings, booking config, Telegram bot status.
 */

import { requireBookingAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  createDiscountCode,
  toggleDiscountCode,
  deleteDiscountCode,
  unlinkGirlTelegram,
} from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireBookingAdmin();

  // Parallel data fetching
  const [
    codesResult,
    operatorsResult,
    girlLinksResult,
    botBookingsWeek,
    msgCountToday,
  ] = await Promise.all([
    // All discount codes
    db.execute(
      `SELECT id, code, name, type, value, min_duration, valid_from, valid_until,
              max_uses, current_uses, is_active, created_at
       FROM discount_codes
       ORDER BY is_active DESC, created_at DESC`
    ),
    // Operators/managers with Telegram status
    db.execute(
      `SELECT u.id, u.display_name, u.email, u.role, u.telegram_chat_id, u.is_active
       FROM users u
       WHERE u.role IN ('admin', 'manager', 'operator')
       ORDER BY u.role, u.display_name`
    ),
    // Girls with Telegram link status
    db.execute(
      `SELECT g.id, g.name, g.status,
              tl.chat_id AS tl_chat_id, tl.username AS tl_username, tl.is_active AS tl_active
       FROM girls g
       LEFT JOIN telegram_links tl ON tl.girl_id = g.id AND tl.is_active = 1
       WHERE g.status IN ('active', 'inactive')
       ORDER BY g.status, g.name`
    ),
    // Bot bookings this week (for status card)
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM bookings_v2
            WHERE source IN ('booking_flow', 'ai_tool') AND created_at >= date('now', '-7 days')`,
      args: [],
    }),
    // Messages today
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM telegram_messages
            WHERE created_at >= date('now') AND role IN ('user', 'assistant')`,
      args: [],
    }),
  ]);

  const codes = codesResult.rows;
  const operators = operatorsResult.rows;
  const girlLinks = girlLinksResult.rows;
  const weekBookings = Number(botBookingsWeek.rows[0]?.cnt ?? 0);
  const todayMessages = Number(msgCountToday.rows[0]?.cnt ?? 0);
  const botConfigured = !!process.env.TELEGRAM_BOT_TOKEN;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="st-header">
        <h1 className="st-title">Nastaveni</h1>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: Promo codes */}
      {/* ============================================================ */}
      <div className="st-section">
        <div className="st-section-head">
          <h2 className="st-section-title">Promokody</h2>
          <span className="st-badge">{codes.length}</span>
        </div>

        {/* Add new code form */}
        <form action={createDiscountCode} className="st-promo-form">
          <div className="st-form-row">
            <div className="st-field">
              <label className="st-label">Kod</label>
              <input name="code" type="text" required placeholder="SUMMER200" className="st-input" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="st-field">
              <label className="st-label">Nazev</label>
              <input name="name" type="text" required placeholder="Letni akce" className="st-input" />
            </div>
            <div className="st-field" style={{ maxWidth: 120 }}>
              <label className="st-label">Typ</label>
              <select name="type" className="st-input">
                <option value="percentage">%</option>
                <option value="fixed">CZK</option>
              </select>
            </div>
            <div className="st-field" style={{ maxWidth: 100 }}>
              <label className="st-label">Hodnota</label>
              <input name="value" type="number" required min={1} placeholder="200" className="st-input" />
            </div>
            <div className="st-field" style={{ maxWidth: 110 }}>
              <label className="st-label">Min. min</label>
              <input name="min_duration" type="number" min={0} placeholder="--" className="st-input" />
            </div>
            <div className="st-field" style={{ maxWidth: 110 }}>
              <label className="st-label">Max pouziti</label>
              <input name="max_uses" type="number" min={1} placeholder="--" className="st-input" />
            </div>
            <div className="st-field" style={{ maxWidth: 160 }}>
              <label className="st-label">Platnost do</label>
              <input name="valid_until" type="date" className="st-input" />
            </div>
            <div className="st-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="st-btn st-btn-add">Pridat</button>
            </div>
          </div>
        </form>

        {/* Codes table */}
        {codes.length === 0 ? (
          <div className="st-empty">Zadne promokody</div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Nazev</th>
                  <th>Typ</th>
                  <th>Hodnota</th>
                  <th>Min. min</th>
                  <th>Pouziti</th>
                  <th>Platnost do</th>
                  <th>Stav</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const isActive = Number(c.is_active) === 1;
                  const maxUses = c.max_uses ? Number(c.max_uses) : null;
                  const currentUses = Number(c.current_uses ?? 0);
                  const validUntil = c.valid_until ? String(c.valid_until).split('T')[0] : null;
                  const isExpired = validUntil ? new Date(validUntil) < new Date() : false;

                  return (
                    <tr key={Number(c.id)} style={{ opacity: isActive ? 1 : 0.5 }}>
                      <td><code className="st-code-tag">{String(c.code)}</code></td>
                      <td>{String(c.name)}</td>
                      <td>{String(c.type) === 'percentage' ? '%' : 'CZK'}</td>
                      <td>{Number(c.value)}{String(c.type) === 'percentage' ? '%' : ' CZK'}</td>
                      <td>{c.min_duration ? `${Number(c.min_duration)} min` : '--'}</td>
                      <td>
                        {currentUses}{maxUses ? ` / ${maxUses}` : ''}
                        {maxUses && currentUses >= maxUses && (
                          <span className="st-tag st-tag-red" style={{ marginLeft: 4 }}>Vycerpano</span>
                        )}
                      </td>
                      <td>
                        {validUntil ?? 'Neomezeno'}
                        {isExpired && <span className="st-tag st-tag-red" style={{ marginLeft: 4 }}>Expired</span>}
                      </td>
                      <td>
                        <span className={`st-tag ${isActive ? 'st-tag-green' : 'st-tag-dim'}`}>
                          {isActive ? 'Aktivni' : 'Neaktivni'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <form action={toggleDiscountCode}>
                            <input type="hidden" name="id" value={Number(c.id)} />
                            <input type="hidden" name="new_active" value={isActive ? 0 : 1} />
                            <button type="submit" className="st-btn-sm">
                              {isActive ? 'Deaktivovat' : 'Aktivovat'}
                            </button>
                          </form>
                          {currentUses === 0 && (
                            <form action={deleteDiscountCode}>
                              <input type="hidden" name="id" value={Number(c.id)} />
                              <button type="submit" className="st-btn-sm st-btn-danger">Smazat</button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: Notification settings (Telegram links) */}
      {/* ============================================================ */}
      <div className="st-section">
        <div className="st-section-head">
          <h2 className="st-section-title">Telegram notifikace</h2>
        </div>

        {/* Operators/managers */}
        <div className="st-sub-title">Operatorky / Management</div>
        <div className="st-notif-list">
          {operators.map((u) => {
            const hasTg = !!u.telegram_chat_id;
            const name = u.display_name ? String(u.display_name) : String(u.email).split('@')[0];
            const roleLabel = String(u.role) === 'admin' ? 'Admin' : String(u.role) === 'manager' ? 'Manager' : 'Operator';
            return (
              <div key={Number(u.id)} className="st-notif-row">
                <div className="st-notif-info">
                  <span className="st-notif-name">{name}</span>
                  <span className="st-notif-role">{roleLabel}</span>
                </div>
                <div className="st-notif-status">
                  <span className={`st-dot ${hasTg ? 'green' : 'dim'}`} />
                  <span className="st-notif-label">
                    {hasTg ? 'Propojeno' : 'Nepropojeno'}
                  </span>
                </div>
              </div>
            );
          })}
          {operators.length === 0 && <div className="st-empty">Zadni uzivatele</div>}
        </div>

        {/* Girls */}
        <div className="st-sub-title" style={{ marginTop: 16 }}>Divky</div>
        <div className="st-notif-list">
          {girlLinks.map((g) => {
            const hasTg = !!g.tl_chat_id && Number(g.tl_active) === 1;
            const username = g.tl_username ? `@${String(g.tl_username)}` : null;
            return (
              <div key={Number(g.id)} className="st-notif-row">
                <div className="st-notif-info">
                  <span className="st-notif-name">{String(g.name)}</span>
                  <span className={`st-tag ${String(g.status) === 'active' ? 'st-tag-green' : 'st-tag-dim'}`} style={{ marginLeft: 6 }}>
                    {String(g.status) === 'active' ? 'Aktivni' : 'Neaktivni'}
                  </span>
                </div>
                <div className="st-notif-status">
                  <span className={`st-dot ${hasTg ? 'green' : 'dim'}`} />
                  <span className="st-notif-label">
                    {hasTg ? `Propojeno${username ? ` (${username})` : ''}` : 'Nepropojeno'}
                  </span>
                  {hasTg && (
                    <form action={unlinkGirlTelegram} style={{ marginLeft: 8 }}>
                      <input type="hidden" name="girl_id" value={Number(g.id)} />
                      <button type="submit" className="st-btn-sm st-btn-danger">Odpojit</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
          {girlLinks.length === 0 && <div className="st-empty">Zadne divky</div>}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: Booking settings */}
      {/* ============================================================ */}
      <div className="st-grid-2">
        <div className="st-section">
          <div className="st-section-head">
            <h2 className="st-section-title">Nastaveni rezervaci</h2>
          </div>
          <div className="st-settings-grid">
            <div className="st-setting">
              <span className="st-setting-label">Novy klient:</span>
              <span>Pending (musi potvrdit)</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">Staly klient:</span>
              <span>Auto-confirmed</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">Booking flow:</span>
              <span>Inline keyboard (Telegram)</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">Kanaly:</span>
              <span>Telegram, telefon, admin</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">Draft expirace:</span>
              <span>15 minut</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">Slot zamek:</span>
              <span>5 minut</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 4: Telegram bot status */}
        {/* ============================================================ */}
        <div className="st-section">
          <div className="st-section-head">
            <h2 className="st-section-title">Telegram bot</h2>
            <span className={`st-dot ${botConfigured ? 'green' : 'red'}`} style={{ marginLeft: 4 }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {botConfigured ? 'Online' : 'Nenastaveno'}
            </span>
          </div>
          <div className="st-settings-grid">
            <div className="st-setting">
              <span className="st-setting-label">Zpravy dnes:</span>
              <span>{todayMessages}</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">Rezervace (7d):</span>
              <span>{weekBookings}</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">AI model:</span>
              <span>Claude (Anthropic)</span>
            </div>
            <div className="st-setting">
              <span className="st-setting-label">Webhook:</span>
              <span style={{ color: process.env.TELEGRAM_WEBHOOK_SECRET ? 'var(--green)' : 'var(--red)' }}>
                {process.env.TELEGRAM_WEBHOOK_SECRET ? 'Nastaven' : 'Nenastaveno'}
              </span>
            </div>
          </div>
          <a href="/booking/telegram" className="st-link" style={{ marginTop: 12, display: 'inline-block' }}>
            Podrobny prehled bota →
          </a>
        </div>
      </div>
    </div>
  );
}

const STYLES = `
.st-header {
  margin-bottom: 20px;
}
.st-title {
  font-size: 20px; font-weight: 700;
}
.st-section {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.st-section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 14px;
}
.st-section-title {
  font-size: 14px; font-weight: 600;
}
.st-badge {
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px;
  background: rgba(96,165,250,0.15); color: var(--blue);
}
.st-sub-title {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--muted); margin-bottom: 8px;
}
.st-empty {
  font-size: 13px; color: var(--dim); padding: 8px 0;
}

/* Promo form */
.st-promo-form {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 14px;
}
.st-form-row {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end;
}
.st-field {
  display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px;
}
.st-label {
  font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase;
  letter-spacing: 0.3px;
}
.st-input {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--text);
  outline: none;
}
.st-input:focus { border-color: var(--coral); }
.st-btn { cursor: pointer; border: none; border-radius: 6px; font-weight: 600; font-size: 13px; }
.st-btn-add {
  background: var(--coral); color: #fff;
  padding: 7px 16px;
  cursor: pointer; border: none; border-radius: 6px; font-weight: 600; font-size: 13px;
}
.st-btn-add:hover { opacity: 0.9; }

/* Promo table */
.st-table-wrap { overflow-x: auto; }
.st-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.st-table th {
  text-align: left; padding: 8px 10px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  color: var(--muted); border-bottom: 1px solid var(--line);
}
.st-table td {
  padding: 8px 10px; border-bottom: 1px solid rgba(42,34,48,0.5);
}
.st-code-tag {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px; background: rgba(96,165,250,0.1);
  padding: 2px 6px; border-radius: 4px; color: var(--blue);
}
.st-tag {
  display: inline-block; padding: 2px 7px; border-radius: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.st-tag-green { background: rgba(74,222,128,0.15); color: var(--green); }
.st-tag-red { background: rgba(239,68,68,0.15); color: var(--red); }
.st-tag-dim { background: rgba(106,94,114,0.2); color: var(--dim); }
.st-btn-sm {
  background: var(--bg); border: 1px solid var(--line);
  border-radius: 4px; padding: 3px 8px; font-size: 11px;
  color: var(--muted); cursor: pointer;
}
.st-btn-sm:hover { border-color: var(--coral); color: var(--text); }
.st-btn-danger { color: var(--red); }
.st-btn-danger:hover { border-color: var(--red); background: rgba(239,68,68,0.08); }

/* Notification list */
.st-notif-list { display: flex; flex-direction: column; gap: 2px; }
.st-notif-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 6px;
}
.st-notif-row:hover { background: rgba(242,125,141,0.04); }
.st-notif-info { display: flex; align-items: center; gap: 6px; }
.st-notif-name { font-weight: 600; font-size: 13px; }
.st-notif-role { font-size: 11px; color: var(--dim); }
.st-notif-status { display: flex; align-items: center; gap: 6px; }
.st-notif-label { font-size: 12px; color: var(--muted); }
.st-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.st-dot.green { background: var(--green); box-shadow: 0 0 4px rgba(74,222,128,0.4); }
.st-dot.red { background: var(--red); }
.st-dot.dim { background: var(--dim); }

/* Grid */
.st-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.st-settings-grid {
  display: flex; flex-direction: column; gap: 4px;
}
.st-setting {
  display: flex; gap: 8px; font-size: 13px; padding: 4px 0;
}
.st-setting-label {
  font-weight: 600; color: var(--muted); min-width: 130px;
}
.st-link {
  color: var(--coral); text-decoration: none; font-size: 13px; font-weight: 600;
}
.st-link:hover { text-decoration: underline; }

@media (max-width: 1024px) {
  .st-form-row { flex-direction: column; }
  .st-field { min-width: auto; }
}
@media (max-width: 768px) {
  .st-grid-2 { grid-template-columns: 1fr; }
  .st-table { font-size: 12px; }
  .st-table th, .st-table td { padding: 6px 6px; }
}
`;
