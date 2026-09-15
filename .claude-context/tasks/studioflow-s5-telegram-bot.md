# STUDIOFLOW S5: Telegram Bot

## Status: PLAN (ceka na schvaleni)

## Kontext

Telegram bot pro klienty — umoznuje rezervaci pres inline tlacitka. Bot komunikuje s operatorkou pres DRAFT stavy v kalendari (real-time sync).

- Bot: `@studioflow3_bot`
- Token: env `TELEGRAM_BOT_TOKEN`
- Webhook: `app/api/telegram/route.ts`

## Referencni mockup

`mockups/booking/06-telegram-bot.html` — 4 flows:
1. **Booking flow** — /booking → vyber divku → den → cas → delku → souhrn → auto-confirmed
2. **Reminder** — 1h pred terminem, adresa, potvrzeni ze klient prijde
3. **Notifikace divce** — oddeleny chat (nova rezervace, reminder, zruseni)
4. **Deep link aktivace** — /start {token} → propojeni TG uctu s klientem

## Architektura

```
Telegram API
    ↓ webhook POST
app/api/telegram/route.ts
    ↓
lib/telegram/handler.ts         — router (command → handler)
    ├── lib/telegram/commands/start.ts    — /start + deep link
    ├── lib/telegram/commands/booking.ts  — /booking flow (multi-step)
    ├── lib/telegram/commands/moje.ts     — /moje (moje rezervace)
    └── lib/telegram/commands/zrusit.ts   — /zrusit
    ↓
lib/telegram/api.ts             — sendMessage, editMessage, answerCallback
lib/telegram/keyboards.ts       — inline keyboard builders
```

## Soubory k vytvoreni

### 1. `app/api/telegram/route.ts` — Webhook handler

```typescript
// POST handler — prijima updates od Telegram
// Overeni: porovnat secret token z headeru (X-Telegram-Bot-Api-Secret-Token)
// Parse update → routovat na spravny handler
// Vzdy vratit 200 OK (i pri chybe — jinak TG retryuje)
```

### 2. `lib/telegram/api.ts` — Telegram API wrapper

```typescript
// Funkce:
// - sendMessage(chatId, text, options?)
// - editMessageText(chatId, messageId, text, options?)
// - answerCallbackQuery(callbackQueryId, text?)
// - setWebhook(url, secretToken)
// - deleteWebhook()

// Vsechny volaji fetch() na https://api.telegram.org/bot{TOKEN}/{method}
// parse_mode: 'HTML' (default)
```

### 3. `lib/telegram/handler.ts` — Command router

```typescript
// Typy updatu:
// 1. message.text startsWith('/') → command handler
// 2. callback_query → inline button handler (booking flow steps)
//
// Callback data format: "action:param1:param2"
// Priklady:
//   "girl:5"        → vyber divky ID=5
//   "day:2026-09-13" → vyber dne
//   "time:16:00"    → vyber casu
//   "dur:60"        → vyber delky
//   "confirm"       → potvrzeni
//   "cancel_draft"  → zruseni draftu
```

### 4. `lib/telegram/commands/start.ts`

```typescript
// /start (bez parametru) → "Vitej v STUDIOFLOW! Pouzij /booking pro rezervaci."
// /start {token} → deep link aktivace:
//   1. Najdi token v telegram_users.activation_token
//   2. Propoj telegram_user_id + chat_id
//   3. Nastav activated_at, vymaz token
//   4. Odpoved: "Tvuj ucet byl propojen: {nickname} ({client_number})"
```

### 5. `lib/telegram/commands/booking.ts` — Multi-step flow

```typescript
// Booking flow pouziva booking_drafts tabulku:
//
// KROK 1: /booking → vytvor draft (session_id = uuid, expires_at = +30min)
//         → zobraz inline keyboard s dostupnymi divkami
//         → step = 'select_girl'
//
// KROK 2: callback "girl:{id}" → uloz girl_id do draftu
//         → nacti dostupne dny (girl_schedules + schedule_exceptions)
//         → OMEZENI: jen aktualny tyden (Po 0:00 - Ne 23:59)
//         → pokud divka tento tyden nepracuje:
//           "Emily tento tyden nepracuje. Chces vedet az bude priste?"
//           tlacitka: [Sledovat Emily] [Jina divka] [Zrusit]
//         → pokud zadny volny den (konec tydne):
//           "Novy rozvrh bude dostupny v pondeli v 0:00"
//           tlacitka: [Sledovat Emily] [Jina divka]
//         → "Sledovat" → INSERT schedule_reminders (client_telegram_id, girl_id)
//           cron v Po 0:05 → posle notifikaci s novym rozvrhem
//         → zobraz inline keyboard s dny (jen aktualny tyden)
//         → step = 'select_day'
//         → vytvor slot_lock (girl_id, date=null — zatim jen reservace konverzace)
//
// KROK 3: callback "day:{date}" → uloz date do draftu
//         → nacti volne sloty (porovnat bookings_v2 + slot_locks + girl_schedules)
//         → zobraz inline keyboard s casy (po 30min)
//         → step = 'select_time'
//
// KROK 4: callback "time:{HH:MM}" → uloz start_time
//         → zobraz inline keyboard s delkami (30/45/60/90/120 min)
//         → step = 'select_duration'
//
// KROK 5: callback "dur:{minutes}" → uloz duration, vypocitej end_time + cenu
//         → vytvor slot_lock(girl_id, date, start_time, end_time)
//         → zobraz souhrn:
//           "{girl_name}\n{date} / {start}-{end}\n{duration} min / {price} Kc\nOblast: {location}"
//         → tlacitka: [Potvrdit] [Zrusit]
//         → step = 'confirm'
//
// KROK 6: callback "confirm"
//         → INSERT bookings_v2 (status='confirmed', channel='telegram')
//           Bot je POUZE pro stale klienty (3+ navstev) = AUTO-CONFIRM
//           Preskoci PENDING — operatorka nemusí potvrzovat
//         → UPDATE draft (is_converted=1, converted_to_id={booking_id})
//         → slot_lock.locked_by = "booking:{id}"
//         → odpoved: "✅ Rezervace potvrzena! Adresa 1h pred terminem."
//         → notifikace divce: "Nova rezervace: {date} {time} {duration}"
//         → operatorka vidi zeleny blok v kalendari (ne pending)
//
// KROK 7: callback "cancel_draft"
//         → DELETE draft + slot_lock
//         → odpoved: "Rezervace zrusena."
//
// TIMEOUT: cron kazde 5 min — drafty starsi 30min → DELETE + slot_lock cleanup
```

### 6. `lib/telegram/keyboards.ts` — Inline keyboard helpers

```typescript
// Funkce:
// - girlsKeyboard(girls[]) → InlineKeyboardMarkup
// - daysKeyboard(days[]) → InlineKeyboardMarkup (jen aktualny tyden Po-Ne)
// - timeSlotsKeyboard(slots[]) → InlineKeyboardMarkup
// - durationKeyboard() → fixed [30, 45, 60, 90, 120]
// - confirmKeyboard() → [Potvrdit, Zrusit]
// - reminderKeyboard() → [Potvrzuji, Nemuzzu prijit]
// - watchGirlKeyboard(girlName) → [Sledovat {girlName}, Jina divka]
// - girlNotWorkingKeyboard(girlName) → [Sledovat {girlName}, Jina divka, Zrusit]
```

### 7. `lib/telegram/notifications.ts` — Odchozi notifikace

```typescript
// Tyto funkce vola booking system (ne bot handler):
//
// - notifyClientConfirmed(booking) — "✅ Rezervace potvrzena! Adresa 1h pred." (ihned pri auto-confirm)
// - notifyClientReminder(booking) — 1h pred: adresa + [Potvrzuji/Nemuzzu]
// - notifyClientCancelled(booking, reason) — "Rezervace zrusena: {reason}"
//
// - notifyGirlNewBooking(booking) — "Nova rezervace: {date} {time} {duration}"
// - notifyGirlReminder(booking) — "Za 1 hodinu: {time}, Klient potvrdil"
// - notifyGirlCancelled(booking, reason) — "Zrusena rezervace: {reason}"
//
// - notifyScheduleAvailable(clientTgId, girl, weekSchedule)
//   → Po 0:05 cron: "Novy rozvrh Emily! Tento tyden pracuje: ..."
//   → tlacitko: [Objednat u Emily]
//   → pouziva tabulku schedule_reminders (uz existuje v DB)
//   → po odeslani: DELETE schedule_reminders WHERE client_telegram_id = ? AND girl_id = ?
//
// Divky maji ODDELENY chat (LG Admin bot vs LG Praha bot pro klienty)
// Pro MVP: jeden bot, ale zpravy divkam neobsahuji osobni udaje klienta
```

### 8. `scripts/setup-telegram-webhook.ts` — Jednorázový setup

```typescript
// CLI skript: npx tsx scripts/setup-telegram-webhook.ts
// Calls setWebhook() s URL: {NEXT_PUBLIC_BASE_URL}/api/telegram
// Nastavi secret_token pro overeni
```

## DB zavislosti

Vyzaduje tabulky z S1:
- `booking_clients` — lookup pres telegram_id
- `telegram_users` — deep link aktivace, chat_id pro notifikace
- `booking_drafts` — multi-step flow state
- `bookings_v2` — finalni rezervace
- `slot_locks` — race condition prevence
- `booking_audit_log` — logovani akci

## Env vars

```env
TELEGRAM_BOT_TOKEN=        # od @BotFather
TELEGRAM_WEBHOOK_SECRET=   # nahodny string pro overeni webhooku
NEXT_PUBLIC_BASE_URL=      # https://lovelygirls.cz (pro webhook URL)
```

## Implementacni kroky

1. **`lib/telegram/api.ts`** — Telegram API wrapper (fetch-based)
2. **`lib/telegram/keyboards.ts`** — inline keyboard builders
3. **`app/api/telegram/route.ts`** — webhook endpoint + secret verification
4. **`lib/telegram/handler.ts`** — command router
5. **`lib/telegram/commands/start.ts`** — /start + deep link
6. **`lib/telegram/commands/booking.ts`** — multi-step booking flow
7. **`lib/telegram/notifications.ts`** — outgoing messages
8. **`scripts/setup-telegram-webhook.ts`** — webhook registration

## MVP scope (co jde PRVNI)

1. `/start` — welcome message (bez deep link)
2. `/booking` — placeholder "Funkce brzy..."
3. Webhook handler s logovanim

## Plny scope (po S1-S4)

1. Deep link aktivace (`/start {token}`)
2. Plny booking flow (6 kroku, auto-confirm)
3. Tydenni omezeni rozvrhu (Po 0:00 - Ne 23:59)
4. "Sledovat oblibenkyne" — schedule_reminders tabulka
5. Cron Po 0:05 — notifikace sledovatelum s novym rozvrhem
6. Notifikace klientum + divkam
7. Reminder cron (1h pred)
8. Draft cleanup cron (expired drafty)
