# Telegram Bot for Booking Notifications — ESCX23 Research

## 1. Current State in ESCX23

### Telegram usage today
- **Deep links only:** Profile CTA buttons link to `https://t.me/{phone}` for clients to initiate conversation with the agency
- **`telegram` field on `girls` table:** Stores the girl's Telegram handle/phone — used for contact display, not for bot communication
- **`communication_type` on bookings:** Tracks booking channel (whatsapp / telegram / sms / call) — the client's preferred way to be contacted
- **No Telegram Bot API integration exists** anywhere in the codebase or in Secretstory

### Booking system status
- Booking table exists with fields: girl_id, date, start_time, end_time, duration, location, status, client_name, client_phone, services, price, notes
- Admin `/admin/rezervace` page shows bookings list with status filters
- **No booking creation/management actions yet** — placeholder says "Booking webhook integration coming in Sprint 4"
- Status flow: `pending → confirmed → completed / cancelled`

### Notification system
- `notifications` table exists (imported from Secretstory, 0 rows): user_id, type (booking_created/updated/cancelled, review_new/approved), title, message, link, read
- Currently unused — no notification delivery mechanism

---

## 2. Telegram Bot API Overview

### Creating a bot
1. Message `@BotFather` on Telegram → `/newbot` → get a **bot token** (`123456:ABC-DEF...`)
2. Bot token is stored as `TELEGRAM_BOT_TOKEN` env var
3. Bot can send messages to any user who has started a conversation with it (privacy: bot can't message unsolicited users)

### Key API methods
| Method | What it does |
|---|---|
| `sendMessage` | Send text to a chat_id (supports Markdown/HTML formatting) |
| `getUpdates` | Long-polling for incoming messages (commands, replies) |
| `setWebhook` | Register a URL for push delivery of updates |
| `getMe` | Verify bot token is valid |

### Bot → User messaging requirement
**Critical:** A Telegram bot can only send messages to users who have first sent a message to the bot (or pressed /start). This is a Telegram anti-spam policy. The girl must initiate the conversation.

### Rate limits
- 30 messages per second to different chats (plenty for 13 girls)
- 20 messages per minute to the same chat
- No API cost — Telegram Bot API is free

---

## 3. Linking Telegram Chat ID to Companion Profile

### The challenge
To send a notification to a girl, the bot needs her **chat_id** (a numeric ID, not the same as her Telegram username). The bot can only discover this when the girl messages it first.

### Recommended flow: Deep-link with start parameter

1. **Admin sets up the bot once** via @BotFather (one-time)
2. **Each girl gets a unique link** in Studio: `https://t.me/LovelyGirlsBot?start=link_{girl_id}_{token}`
3. **Girl clicks the link** → opens Telegram → bot receives `/start link_{girl_id}_{token}`
4. **Bot validates the token** (HMAC of girl_id + secret) → stores `chat_id` in DB
5. **Bot confirms:** "Ahoj Niko! Notifikace aktivovány. Budeš dostávat informace o nových rezervacích."

### DB changes needed
```sql
-- Add to girls table (or separate table)
ALTER TABLE girls ADD COLUMN telegram_chat_id TEXT;
ALTER TABLE girls ADD COLUMN telegram_linked_at DATETIME;
ALTER TABLE girls ADD COLUMN telegram_notifications INTEGER DEFAULT 1;
```

Alternative: Separate `telegram_links` table if more metadata needed:
```sql
CREATE TABLE telegram_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  username TEXT,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
);
```

### Studio UI for linking
In `/studio/nastaveni` or on the Studio dashboard:
```
Telegram notifikace: Nepropojeno
[Propojit Telegram] → opens t.me/LovelyGirlsBot?start=link_7_abc123
```

After linking:
```
Telegram notifikace: Propojeno (@nika_tg)
[Odpojit] [Poslat testovací zprávu]
```

### Admin UI
In `/admin/divky/{id}/edit`:
- Show Telegram link status (linked / not linked)
- Button to generate/copy the linking URL
- Toggle notifications on/off per girl

---

## 4. Notification Events & Triggers

### Which booking events should trigger notifications

| Event | When | Who gets notified | Priority |
|---|---|---|---|
| **New booking** | Admin creates/confirms a booking for girl | Girl | HIGH |
| **Booking confirmed** | Status changes pending → confirmed | Girl | HIGH |
| **Booking cancelled** | Client or admin cancels | Girl | HIGH |
| **Booking reminder** | 1 hour before start_time | Girl | MEDIUM |
| **Schedule change** | Admin changes girl's schedule for today | Girl | MEDIUM |
| **New review** | New review submitted for the girl | Girl | LOW |
| **Review approved** | Admin approves a review | Girl | LOW |

### When NOT to send (avoid spam)
- Don't notify for schedule changes more than 24h in the future
- Don't notify for bulk admin operations (e.g., "set all girls to location X")
- Respect girl's notification preferences (on/off toggle)
- Don't send between 23:00 - 08:00 Prague time (queue and send at 08:00)

---

## 5. Message Format

### New booking notification
```
📅 Nová rezervace

Datum: Čt 12.6.2026
Čas: 14:00 — 15:00 (60 min)
Program: Exclusive 60
Pobočka: Vinohrady
Poznámka od klienta: "Přijdu o 5 min dřív"

Status: Potvrzena ✅
```

### Booking cancelled
```
❌ Zrušená rezervace

Datum: Čt 12.6.2026
Čas: 14:00 — 15:00
Důvod: Klient zrušil
```

### Booking reminder (1h before)
```
⏰ Připomenutí — za 1 hodinu

14:00 — 15:00 · Exclusive 60
Pobočka: Vinohrady
```

### Schedule change
```
📋 Změna rozvrhu na dnes

Nový čas: 12:00 — 20:00
Pobočka: Karlín
(Změnil: Admin)
```

### Formatting
- Use Telegram's HTML mode (`parse_mode: 'HTML'`) for bold/italic
- Keep messages short (under 300 chars)
- No inline keyboards needed for v1 (just informational messages)
- Future: Add "Potvrdit" / "Odmítnout" buttons for booking requests (inline keyboard)

---

## 6. Privacy Considerations

### What to include in messages
- Date, time, duration
- Program name (e.g., "Exclusive 60")
- Location name (e.g., "Vinohrady") — girl needs to know where to go
- Admin notes relevant to the girl
- Status changes

### What NOT to include
- **Client's full name** — use initials or first name only ("Petr" not "Petr Novak")
- **Client's phone number / email** — never
- **Client's contact details** — never (admin handles communication)
- **Price / payment details** — girl doesn't need this in notification (she sees it in Studio)
- **Service details** — some services are sensitive; use program name only, not service list
- **Any data that could identify the client** beyond what's needed for the appointment

### Telegram-specific risks
- Telegram messages are stored on Telegram's servers (cloud-based)
- If girl's phone is compromised, chat history is visible
- Bot messages can be forwarded to others
- **Mitigation:** Keep messages minimal, use program names not service details, no client PII

### GDPR
- Girl consents to receive notifications by linking (explicit opt-in)
- Girl can unlink at any time (/stop command or Studio toggle)
- No client PII is transmitted through Telegram
- Document in privacy policy that operational notifications are sent via Telegram

---

## 7. Technical Architecture

### Variant A: Webhook (Recommended for Vercel)

```
Telegram → POST /api/telegram/webhook → Vercel serverless function
                                         ↓
                                    Process /start command
                                    Store chat_id in DB
                                    Reply to girl
```

```
Admin action (confirm booking) → lib/telegram.ts sendNotification()
                                   ↓
                              POST https://api.telegram.org/bot{TOKEN}/sendMessage
                                   ↓
                              Girl receives message on phone
```

**Pros:**
- No persistent process needed
- Fits Vercel serverless model perfectly
- Instant delivery (no polling delay)
- Zero infrastructure cost

**Cons:**
- Webhook URL must be HTTPS and publicly accessible (Vercel provides this)
- Need to verify incoming webhooks (Telegram sends a secret token)

**Implementation:**
1. `POST /api/telegram/webhook` — handles incoming messages from Telegram
2. `lib/telegram.ts` — `sendMessage()`, `setWebhook()`, `generateLinkToken()`
3. Trigger `sendNotification()` from booking actions (when they're built in Sprint 4)

### Variant B: Polling (simpler, but wasteful)

A background process calls `getUpdates` every few seconds to check for new messages from girls (/start commands).

**Pros:**
- No webhook setup needed
- Works locally in dev without tunneling

**Cons:**
- Needs a persistent process (not great for Vercel serverless)
- Wastes resources polling when there's nothing to do
- Slight delay in responding to /start commands

**Not recommended** for production on Vercel.

### Variant C: Hybrid (webhook in prod, polling in dev)

Use webhook on Vercel (production), polling via a dev script locally.

```typescript
// lib/telegram.ts
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(chatId: string, text: string, html = true) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: html ? 'HTML' : undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[telegram] sendMessage failed:', err);
    return false;
  }
  return true;
}

export async function setWebhook(url: string) {
  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    }),
  });
  return res.ok;
}
```

---

## 8. Implementation Plan

### Phase 1: Bot setup + linking (Sprint 3, alongside Studio)
- Create bot via @BotFather
- `lib/telegram.ts` — sendMessage, webhook handler
- `POST /api/telegram/webhook` — handle /start with deep link token
- DB: add `telegram_chat_id` column to girls
- Studio: "Propojit Telegram" button with deep link
- Admin: show link status on girl profile
- **Effort: 1 day**

### Phase 2: Booking notifications (Sprint 4, alongside booking system)
- When admin confirms/cancels a booking → call `sendBookingNotification()`
- Message formatting (date, time, program, location)
- Quiet hours (23:00-08:00 queue)
- **Effort: 0.5 day** (building on Phase 1 infrastructure)

### Phase 3: Reminders + advanced (Sprint 5+)
- Cron job for 1-hour-before reminders
- Schedule change notifications
- Review notifications
- /stop and /status commands
- Inline keyboard for booking confirmation (girl confirms directly in Telegram)
- **Effort: 1-2 days**

### Total estimated effort: 2.5-3.5 days across 3 sprints

---

## 9. Environment Variables Needed

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...         # From @BotFather
TELEGRAM_WEBHOOK_SECRET=random-secret-string  # For verifying incoming webhooks
TELEGRAM_LINK_SECRET=another-secret           # For HMAC-signing deep link tokens
```

---

## 10. Decision Summary

| Question | Answer |
|---|---|
| **Webhook vs polling?** | Webhook (fits Vercel serverless) |
| **Who gets notified?** | Girls (companions) only, not clients |
| **How to link?** | Deep link via @BotFather `/start` param with signed token |
| **What to send?** | Date, time, program, location. NO client PII. |
| **When to build?** | Phase 1 (linking) in Sprint 3, Phase 2 (notifications) in Sprint 4 |
| **Dependencies?** | Needs booking actions to exist (Sprint 4) for full value |
| **Cost?** | Free (Telegram Bot API has no charges) |
| **Existing code to reference?** | None in Secretstory — this is a new feature |
| **Complexity?** | LOW-MEDIUM (simple API, no OAuth, no token refresh) |
