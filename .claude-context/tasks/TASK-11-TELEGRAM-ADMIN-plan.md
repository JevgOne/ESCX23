# TASK-11: TG Bot admin stranka — funkcni sprava bota

## Status: PLAN READY
## Datum: 2026-09-15

---

## ANALYZA AKTUALNIHO STAVU

### Aktualni stranka
`app/booking/telegram/page.tsx` — 12 radku, prazdny placeholder "Ve vyvoji — bude brzy dostupne."
Pouziva `requireBookingAdmin()` (admin/manager only). V sidebaru pod "Sprava" s `adminOnly: true`.

### Existujici infrastruktura

#### Telegram AI system (lib/telegram-ai/):
| Soubor | Ucel |
|--------|------|
| `handler.ts` | Hlavni AI handler — Claude API loop, message history, rate limit |
| `tools.ts` | 12 Claude tools (getAvailableGirls, startBookingFlow, ...) |
| `tool-handlers.ts` | Implementace vsech 12 toolu |
| `booking-flow.ts` | Strukturovany booking flow (inline keyboard, 4 kroky) |
| `system-prompt.ts` | System prompt pro AI operatorku "Nikola" |
| `context.ts` | Build client context z DB (telegram_users + booking_clients) |
| `rate-limit.ts` | Rate limiting (20/min, 100/hour) + spam detection |
| `types.ts` | ClientContext, ConversationMessage typy |

#### API routes:
| Route | Ucel |
|-------|------|
| `app/api/telegram/route.ts` | Webhook endpoint (POST, verifies secret) |
| `app/api/telegram/setup/route.ts` | Register webhook URL (GET, run once) |

#### DB tabulky (z lib/db.ts):
| Tabulka | Data |
|---------|------|
| `telegram_messages` | Vsechny zpravy (chat_id, role, content, tool_name, tool_use_id, tokens_in, tokens_out, model, created_at) |
| `telegram_rate_limits` | Rate limit sliding windows (chat_id, window_start, message_count) |
| `telegram_users` | Propojeni TG user → client (telegram_user_id, client_id, chat_id, is_active) |
| `telegram_links` | Propojeni TG → girl (girl_id, chat_id, for girl notifications) |
| `booking_clients` | Klienti s telegram_id |
| `booking_drafts` | Aktivni drafty z booking flow |
| `booking_notifications` | Bot/escalation notifikace |
| `booking_audit_log` | Audit vsech akci |

#### Dalsi:
| Soubor | Ucel |
|--------|------|
| `scripts/telegram-poll.ts` | Local polling pro development (npx tsx scripts/telegram-poll.ts) |
| `lib/telegram.ts` | Nízkoúrovňové TG API (sendMessage, sendPhoto, setWebhook) |
| `lib/telegram-bot.ts` | Update router (message → AI, callback_query → booking flow) |

#### Konfigurace (env vars):
- `TELEGRAM_BOT_TOKEN` — bot API token
- `TELEGRAM_WEBHOOK_SECRET` — webhook verification
- `ANTHROPIC_API_KEY` — pro Claude API
- `AI_OPERATOR_MODEL` — default: claude-sonnet-4-6
- `AI_OPERATOR_MAX_TOKENS` — default: 1024
- `AI_OPERATOR_CONTEXT_SIZE` — default: 20 (zprav v kontextu)

---

## IMPLEMENTACNI PLAN

### Soubor: `app/booking/telegram/page.tsx`

Zmenit na async Server Component s realnymi daty z DB.

### 5 sekcí dashboardu:

#### 1. Bot Status (horni panel)
- Webhook URL: `{NEXT_PUBLIC_SITE_URL}/api/telegram`
- Model: `AI_OPERATOR_MODEL` env var (nebo default)
- Posledni zprava: SELECT MAX(created_at) FROM telegram_messages
- Aktivni klienti: COUNT DISTINCT chat_id z telegram_messages za posledni 24h
- Zeleny/cerveny indikator — zeleny pokud posledni zprava < 1h, jinak cerveny

```sql
-- Posledni zprava
SELECT MAX(created_at) AS last_msg FROM telegram_messages

-- Aktivni klienti za 24h
SELECT COUNT(DISTINCT chat_id) AS active_chats
FROM telegram_messages
WHERE created_at >= datetime('now', '-24 hours')
```

#### 2. Statistiky (KPI karty, 4x)
- **Zpravy dnes**: COUNT z telegram_messages WHERE created_at >= today
- **Zpravy tento tyden**: COUNT za po-ne
- **Rezervace pres bota**: COUNT z bookings_v2 WHERE source = 'booking_flow' AND created_at this month
- **Token usage**: SUM(tokens_in + tokens_out) za dnes (pro monitoring nakladu)

```sql
-- Zpravy dnes
SELECT COUNT(*) AS cnt FROM telegram_messages WHERE created_at >= ?

-- Zpravy tento tyden
SELECT COUNT(*) AS cnt FROM telegram_messages WHERE created_at >= ?

-- Bot bookings tento mesic
SELECT COUNT(*) AS cnt FROM bookings_v2
WHERE source = 'booking_flow' AND date >= ? AND date <= ?

-- Tokeny dnes
SELECT COALESCE(SUM(tokens_in), 0) AS tin, COALESCE(SUM(tokens_out), 0) AS tout
FROM telegram_messages WHERE created_at >= ? AND model IS NOT NULL
```

#### 3. Posledni konverzace (hlavni sekce)
- Posledních 20 zprav seskupenych dle chat_id
- Pro kazdy chat: posledni zprava (user + assistant), cas, nickname klienta
- Kliknutelne → detail konverzace (budouci feature, zatim jen list)

```sql
-- Posledni konverzace (unikatni chaty, posledni zprava)
SELECT tm.chat_id,
  MAX(tm.created_at) AS last_msg_at,
  (SELECT content FROM telegram_messages WHERE chat_id = tm.chat_id AND role = 'user' ORDER BY created_at DESC LIMIT 1) AS last_user_msg,
  (SELECT content FROM telegram_messages WHERE chat_id = tm.chat_id AND role = 'assistant' ORDER BY created_at DESC LIMIT 1) AS last_bot_msg,
  bc.nickname AS client_nickname,
  bc.trust_level
FROM telegram_messages tm
LEFT JOIN booking_clients bc ON bc.telegram_id = tm.chat_id
GROUP BY tm.chat_id
ORDER BY last_msg_at DESC
LIMIT 20
```

Zobrazeni:
- Kazdý chat jako řádek: avatar (initial), nickname (nebo "Neznamy #chatId"), posledni user msg (truncated 80 char), posledni bot msg (truncated 80 char), cas (time ago), trust badge
- Barevne rozliseni roli: user zpravy seda, bot zpravy coral

#### 4. Eskalace / Notifikace
- Posledni booking_notifications s type='escalation' nebo 'bot_booking'
- Pouzit existujici `getNotifications()` z `lib/booking-notifications.ts`, filtr na bot-related

```sql
SELECT * FROM booking_notifications
WHERE type IN ('bot_booking', 'escalation')
ORDER BY created_at DESC
LIMIT 10
```

#### 5. Nastaveni / Config info (spodni panel, read-only)
- AI model: env var
- Max tokens: env var
- Context size: env var
- Rate limits: 20/min, 100/hour (z rate-limit.ts konstanty)
- System prompt preview: prvnich ~200 znaku z buildSystemPrompt (pro default context)
- Pocet registrovanych tools: 12 (TOOLS.length)
- Webhook setup link: `/api/telegram/setup`

**Toto je READ-ONLY — zadne editovani. Jen zobrazeni aktualniho nastaveni.**

---

### ARCHITEKTURA

```
app/booking/telegram/page.tsx  (async Server Component)
  |
  |- import { requireBookingAdmin } from '@/lib/auth'
  |- import { db } from '@/lib/db'
  |- import { TOOLS } from '@/lib/telegram-ai/tools' (pro pocet)
  |
  |- 6-7 SQL queries pres Promise.all()
  |- Inline <style> pro CSS (dark theme, vzor z ostatnich stranek)
  |- Ziadne client components — ciste server rendered
  |- export const dynamic = 'force-dynamic'
```

### DESIGN SPECIFIKACE

**Konzistence s ostatnimi strankami (girls.tsx, clients.tsx vzor):**

- **Topbar**: "TG Bot" + pocet aktivnich chatu dnes
- **Status panel**: bg-elev, border-left green/red, webhook URL, posledni aktivita
- **KPI karty**: grid 4 sloupce (responsive 2), jako v dashboard planu
- **Konverzace**: seznam radku jako clients page — avatar, nickname, posledni zprava, cas
- **Eskalace**: seznam jako notifications page — icon, typ, zprava, cas
- **Config**: key-value tabulka, bg-elev, muted text, monospace pro technické hodnoty

**Barvy:**
- Bot zpravy: var(--coral) tint
- User zpravy: var(--blue) tint
- Status zeleny: var(--green) (< 1h od posledni zpravy)
- Status cerveny: var(--red) (> 1h nebo zadna zprava)

### TIME AGO HELPER

```typescript
function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'prave ted';
  if (mins < 60) return `pred ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `pred ${hours}h`;
  const days = Math.floor(hours / 24);
  return `pred ${days}d`;
}
```

### DULEZITE POZNAMKY

1. **Admin only** — zachovat `requireBookingAdmin()` (jen admin/manager vidi tuto stranku)
2. **Zadne editace** — tato stranka je CISTE read-only monitoring. Zadne formulare, zadne buttony na zmenu. Jen zobrazeni stavu.
3. **Env vars** — cist primo z `process.env` (server component). Zobrazit nazev, ne hodnotu (bezpecnost — nezobrazovat tokeny!)
4. **Truncate zpravy** — zpravy v konverzacich truncnout na 80-100 znaku, aby se vesly do radku
5. **Token cost info** — zobrazit tokeny jako cislo, ne prevedene na dolary (nechceme hardcodovat ceny)
6. **Bez paginace** — prvni verze max 20 chatu, 10 notifikaci. Staci.

### ODHAD

- 1 soubor k editaci: `app/booking/telegram/page.tsx`
- Ziadne nove soubory
- Ziadne zmeny v lib/ — vsechny queries primo v page
- ~300-400 radku (JSX + SQL + CSS)

---

## CHECKLIST PRO IMPLEMENTATORA

- [ ] Zmenit na `async` Server Component
- [ ] Pridat `export const dynamic = 'force-dynamic'`
- [ ] Zachovat `requireBookingAdmin()`
- [ ] Import `db` z `@/lib/db`
- [ ] Bot status panel (webhook URL, posledni zprava, indikator)
- [ ] KPI karty (4x: zpravy dnes, tyden, bot bookings, tokeny)
- [ ] Posledni konverzace (20 chatu, seskupene)
- [ ] Eskalace/notifikace panel
- [ ] Config info (read-only, env var nazvy)
- [ ] Promise.all pro paralelni queries
- [ ] Inline CSS (dark theme, responsive)
- [ ] Truncate dlouhe zpravy
- [ ] Nezobrazovat API tokeny/secrets — jen nazvy env vars a zda jsou nastavene
