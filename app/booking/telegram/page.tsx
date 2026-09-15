/**
 * STUDIOFLOW — Telegram Bot Admin
 * Bot status, recent conversations, statistics, escalations.
 */

import { db } from '@/lib/db';
import { requireBookingAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getPragueNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekMonday(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return toISODate(mon);
}

function timeAgo(dateStr: string): string {
  const now = getPragueNow();
  const then = new Date(dateStr + 'Z');
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'prave ted';
  if (mins < 60) return `pred ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `pred ${hours}h`;
  const days = Math.floor(hours / 24);
  return `pred ${days}d`;
}

export default async function TelegramPage() {
  await requireBookingAdmin();

  const now = getPragueNow();
  const today = toISODate(now);
  const weekMonday = getWeekMonday(now);

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz'}/api/telegram`;
  const botConfigured = !!process.env.TELEGRAM_BOT_TOKEN;

  const [
    msgTodayResult,
    msgWeekResult,
    uniqueChatsResult,
    botBookingsResult,
    lastMessageResult,
    recentChatsResult,
    escalationsResult,
    tokenUsageResult,
  ] = await Promise.all([
    // Messages today
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM telegram_messages
            WHERE created_at >= ? AND role IN ('user', 'assistant')`,
      args: [today + ' 00:00:00'],
    }),
    // Messages this week
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM telegram_messages
            WHERE created_at >= ? AND role IN ('user', 'assistant')`,
      args: [weekMonday + ' 00:00:00'],
    }),
    // Unique chats this week
    db.execute({
      sql: `SELECT COUNT(DISTINCT chat_id) AS cnt FROM telegram_messages
            WHERE created_at >= ?`,
      args: [weekMonday + ' 00:00:00'],
    }),
    // Bookings created via bot this week
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM bookings_v2
            WHERE source IN ('booking_flow', 'ai_tool') AND created_at >= ?`,
      args: [weekMonday + ' 00:00:00'],
    }),
    // Last message timestamp
    db.execute({
      sql: `SELECT created_at FROM telegram_messages ORDER BY id DESC LIMIT 1`,
      args: [],
    }),
    // Recent conversations — last message per chat
    db.execute({
      sql: `SELECT tm.chat_id,
                   MAX(tm.created_at) AS last_msg,
                   COUNT(*) AS msg_count,
                   (SELECT content FROM telegram_messages t2
                    WHERE t2.chat_id = tm.chat_id AND t2.role = 'user'
                    ORDER BY t2.id DESC LIMIT 1) AS last_user_msg,
                   bc.nickname AS client_name
            FROM telegram_messages tm
            LEFT JOIN booking_clients bc ON bc.telegram_id = tm.chat_id
            WHERE tm.created_at >= date(?, '-7 days')
            GROUP BY tm.chat_id
            ORDER BY last_msg DESC
            LIMIT 15`,
      args: [today],
    }),
    // Recent escalations / notifications from bot
    db.execute({
      sql: `SELECT id, type, title, message, booking_id, created_at
            FROM booking_notifications
            WHERE type LIKE '%bot%' OR type LIKE '%escalat%' OR type = 'new_booking'
            ORDER BY created_at DESC
            LIMIT 10`,
      args: [],
    }),
    // Token usage this week
    db.execute({
      sql: `SELECT COALESCE(SUM(tokens_in), 0) AS total_in,
                   COALESCE(SUM(tokens_out), 0) AS total_out
            FROM telegram_messages
            WHERE created_at >= ?`,
      args: [weekMonday + ' 00:00:00'],
    }),
  ]);

  const msgToday = Number(msgTodayResult.rows[0]?.cnt ?? 0);
  const msgWeek = Number(msgWeekResult.rows[0]?.cnt ?? 0);
  const uniqueChats = Number(uniqueChatsResult.rows[0]?.cnt ?? 0);
  const botBookings = Number(botBookingsResult.rows[0]?.cnt ?? 0);
  const lastMsg = lastMessageResult.rows[0]?.created_at
    ? timeAgo(String(lastMessageResult.rows[0].created_at))
    : 'zadna';
  const recentChats = recentChatsResult.rows;
  const escalations = escalationsResult.rows;
  const tokensIn = Number(tokenUsageResult.rows[0]?.total_in ?? 0);
  const tokensOut = Number(tokenUsageResult.rows[0]?.total_out ?? 0);

  const formatNum = (n: number) => n.toLocaleString('cs-CZ');

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: TG_STYLES }} />

      <div className="tg-header">
        <h1 className="tg-title">Telegram Bot</h1>
        <span className={`tg-status-dot ${botConfigured ? 'online' : 'offline'}`} />
        <span className="tg-status-label">{botConfigured ? 'Online' : 'Nenastaveno'}</span>
      </div>

      {/* Status + Stats */}
      <div className="tg-grid-4">
        <div className="tg-card">
          <div className="tg-card-label">Zpravy dnes</div>
          <div className="tg-card-value">{msgToday}</div>
          <div className="tg-card-sub">Posledni: {lastMsg}</div>
        </div>
        <div className="tg-card">
          <div className="tg-card-label">Zpravy tento tyden</div>
          <div className="tg-card-value">{msgWeek}</div>
          <div className="tg-card-sub">{uniqueChats} unikatnich chatu</div>
        </div>
        <div className="tg-card">
          <div className="tg-card-label">Rezervace pres bota</div>
          <div className="tg-card-value">{botBookings}</div>
          <div className="tg-card-sub">Tento tyden</div>
        </div>
        <div className="tg-card">
          <div className="tg-card-label">Tokeny tento tyden</div>
          <div className="tg-card-value">{formatNum(tokensIn + tokensOut)}</div>
          <div className="tg-card-sub">{formatNum(tokensIn)} in / {formatNum(tokensOut)} out</div>
        </div>
      </div>

      {/* Webhook info */}
      <div className="tg-section tg-webhook">
        <div className="tg-section-header">
          <h2 className="tg-section-title">Webhook</h2>
        </div>
        <div className="tg-webhook-url">
          <span className="tg-label">URL:</span>
          <code className="tg-code">{webhookUrl}</code>
        </div>
        <div className="tg-webhook-url">
          <span className="tg-label">Secret:</span>
          <span style={{ color: process.env.TELEGRAM_WEBHOOK_SECRET ? 'var(--green)' : 'var(--red)' }}>
            {process.env.TELEGRAM_WEBHOOK_SECRET ? 'Nastaveno' : 'Nenastaveno'}
          </span>
        </div>
      </div>

      {/* Two column: Conversations + Escalations */}
      <div className="tg-grid-2">
        {/* Recent conversations */}
        <div className="tg-section">
          <div className="tg-section-header">
            <h2 className="tg-section-title">Posledni konverzace</h2>
            <span className="tg-badge">{recentChats.length}</span>
          </div>
          {recentChats.length === 0 ? (
            <div className="tg-empty">Zadne konverzace za poslednich 7 dni</div>
          ) : (
            <div className="tg-list">
              {recentChats.map((c) => {
                const chatId = String(c.chat_id);
                const name = c.client_name ? String(c.client_name) : chatId.slice(-6);
                const lastUserMsg = c.last_user_msg ? String(c.last_user_msg) : '';
                const preview = lastUserMsg.length > 60 ? lastUserMsg.slice(0, 57) + '...' : lastUserMsg;
                return (
                  <div key={chatId} className="tg-list-item">
                    <div className="tg-list-main">
                      <div className="tg-chat-av">{name.charAt(0).toUpperCase()}</div>
                      <div className="tg-chat-info">
                        <div className="tg-chat-name">{name}</div>
                        <div className="tg-chat-preview">{preview || '...'}</div>
                      </div>
                    </div>
                    <div className="tg-list-meta">
                      <span>{Number(c.msg_count)} zpr.</span>
                      <span>{timeAgo(String(c.last_msg))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Escalations */}
        <div className="tg-section">
          <div className="tg-section-header">
            <h2 className="tg-section-title">Notifikace z bota</h2>
            <span className="tg-badge">{escalations.length}</span>
          </div>
          {escalations.length === 0 ? (
            <div className="tg-empty">Zadne notifikace</div>
          ) : (
            <div className="tg-list">
              {escalations.map((e) => {
                const type = String(e.type);
                const typeColor = type === 'new_booking' ? 'var(--green)'
                  : type.includes('escalat') ? 'var(--yellow)'
                  : 'var(--blue)';
                return (
                  <div key={Number(e.id)} className="tg-list-item">
                    <div className="tg-list-main">
                      <span className="tg-dot" style={{ background: typeColor }} />
                      <div className="tg-chat-info">
                        <div className="tg-chat-name">{String(e.title)}</div>
                        <div className="tg-chat-preview">{String(e.message).slice(0, 80)}</div>
                      </div>
                    </div>
                    <div className="tg-list-meta">
                      {e.booking_id && <a href={`/booking/calendar?detail=${Number(e.booking_id)}`} className="tg-link">#{Number(e.booking_id)}</a>}
                      <span>{timeAgo(String(e.created_at))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Settings info */}
      <div className="tg-section">
        <div className="tg-section-header">
          <h2 className="tg-section-title">Nastaveni bota</h2>
        </div>
        <div className="tg-settings-grid">
          <div className="tg-setting">
            <span className="tg-label">Model:</span>
            <span>Claude (Anthropic API)</span>
          </div>
          <div className="tg-setting">
            <span className="tg-label">Rate limit:</span>
            <span>Sliding window per chat</span>
          </div>
          <div className="tg-setting">
            <span className="tg-label">Booking flow:</span>
            <span>Inline keyboard (bez AI volani)</span>
          </div>
          <div className="tg-setting">
            <span className="tg-label">Novy klient:</span>
            <span>Pending → klient potvrzuje sam</span>
          </div>
          <div className="tg-setting">
            <span className="tg-label">Staly klient:</span>
            <span>Auto-confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TG_STYLES = `
  .tg-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .tg-title {
    font-size: 20px;
    font-weight: 700;
  }
  .tg-status-dot {
    width: 8px; height: 8px; border-radius: 50%;
    flex-shrink: 0;
  }
  .tg-status-dot.online { background: var(--green); box-shadow: 0 0 6px rgba(74,222,128,0.5); }
  .tg-status-dot.offline { background: var(--red); }
  .tg-status-label {
    font-size: 13px; color: var(--muted);
  }

  .tg-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .tg-card {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
  }
  .tg-card-label {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px;
    color: var(--muted); margin-bottom: 6px;
  }
  .tg-card-value {
    font-size: 28px; font-weight: 700;
    line-height: 1.1; margin-bottom: 4px;
  }
  .tg-card-sub {
    font-size: 12px; color: var(--dim);
  }

  .tg-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .tg-section {
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .tg-section-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 12px;
  }
  .tg-section-title {
    font-size: 14px; font-weight: 600;
  }
  .tg-badge {
    font-size: 11px; font-weight: 700;
    padding: 2px 8px; border-radius: 10px;
    background: rgba(96,165,250,0.15); color: var(--blue);
  }

  .tg-webhook { margin-bottom: 16px; }
  .tg-webhook-url {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0; font-size: 13px;
  }
  .tg-label {
    font-weight: 600; color: var(--muted);
    min-width: 60px;
  }
  .tg-code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px; color: var(--blue);
    background: rgba(96,165,250,0.08);
    padding: 2px 8px; border-radius: 4px;
    word-break: break-all;
  }

  .tg-list {
    display: flex; flex-direction: column; gap: 2px;
  }
  .tg-list-item {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 8px 10px; border-radius: 6px;
    text-decoration: none; color: var(--text);
  }
  .tg-list-main {
    display: flex; align-items: center; gap: 10px;
    min-width: 0; flex: 1;
  }
  .tg-list-meta {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; color: var(--muted); flex-shrink: 0;
  }
  .tg-chat-av {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--bg); border: 1px solid var(--line);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: var(--blue); font-size: 13px;
    flex-shrink: 0;
  }
  .tg-chat-info {
    min-width: 0; flex: 1;
  }
  .tg-chat-name {
    font-weight: 600; font-size: 13px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .tg-chat-preview {
    font-size: 12px; color: var(--dim);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .tg-dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  }
  .tg-link {
    color: var(--coral); text-decoration: none; font-weight: 600;
  }
  .tg-link:hover { text-decoration: underline; }
  .tg-empty {
    font-size: 13px; color: var(--dim); padding: 12px 10px;
  }

  .tg-settings-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
  }
  .tg-setting {
    display: flex; gap: 8px; font-size: 13px;
    padding: 4px 0;
  }

  @media (max-width: 1024px) {
    .tg-grid-4 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .tg-grid-4 { grid-template-columns: 1fr; }
    .tg-grid-2 { grid-template-columns: 1fr; }
    .tg-settings-grid { grid-template-columns: 1fr; }
  }
`;
