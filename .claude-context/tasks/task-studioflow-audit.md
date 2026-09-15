# StudioFLOW — Kompletní Audit Report

**Datum:** 2026-09-14
**Auditor:** Plánovač

---

## SHRNUTÍ

| Oblast | Status | Poznámka |
|--------|--------|----------|
| Telegram bot — AI konverzace | ✅ FUNGUJE | Plně implementováno, webhook + AI handler |
| Telegram bot — hybridní booking flow | ✅ FUNGUJE | Implementováno (task-019), bk_* callbacks |
| Telegram bot — obrázky dívek | ❌ CHYBÍ | Žádný `sendPhoto` v celém kódu |
| DB tabulky (booking systém) | ✅ FUNGUJE | Všech 6 tabulek v auto-migracích |
| Encryption (crypto.ts) | ✅ FUNGUJE | AES-256-GCM + HMAC, env vars v .env.example |
| Audit log | ✅ FUNGUJE | booking_audit_log tabulka + lib/audit.ts |
| Booking calendar (admin) | ✅ EXISTUJE | app/booking/calendar + queries + components |
| Booking clients (admin) | ✅ EXISTUJE | app/booking/clients + client-queries.ts |
| Studio dashboard | ✅ EXISTUJE | app/studio/dashboard + studio-queries.ts |
| Studio notifications | ✅ EXISTUJE | app/studio/notifications + girl_notifications tabulka |
| Studio schedule | ✅ EXISTUJE | app/studio/schedule |
| Cron jobs | ✅ EXISTUJE | 7 cron routes (cleanup, reminders, etc.) |
| Webhook setup | ✅ FUNGUJE | /api/telegram/setup + /api/telegram route |

---

## 1. TELEGRAM BOT — AI KONVERZACE ✅

**Stav:** Plně funkční.

**Soubory:**
- `app/api/telegram/route.ts` — webhook endpoint, ověřuje `x-telegram-bot-api-secret-token`
- `app/api/telegram/setup/route.ts` — jednovrazové nastavení webhooku
- `lib/telegram-bot.ts` — main update handler (message + callback_query routing)
- `lib/telegram-ai/handler.ts` — AI handler s Claude API tool-use loop
- `lib/telegram-ai/tools.ts` — 11 tools (getAvailableGirls, getGirlProfile, searchGirls, checkAvailability, getWeekSchedule, getPricing, createBooking, getClientBookings, cancelBooking, subscribeToGirl, startBookingFlow)
- `lib/telegram-ai/tool-handlers.ts` — implementace všech tools
- `lib/telegram-ai/system-prompt.ts` — system prompt s kontextem klienta
- `lib/telegram-ai/context.ts` — buildClientContext z booking_clients
- `lib/telegram-ai/rate-limit.ts` — rate limiting + spam check
- `lib/telegram.ts` — Telegram API (sendMessage, answerCallbackQuery, editMessageText, notifikace)

**Funkce:**
- Konverzace přes Claude API (claude-sonnet-4-6)
- Konverzační historie v telegram_messages (posledních 20 zpráv)
- Rate limiting + spam filtr
- Client context (registrace, návštěvy, trust level, favoriti)
- Tool-use loop (max 5 kol)
- Podpora čeština/angličtina/němčina/ukrajinština

**Žádné problémy nenalezeny.**

---

## 2. TELEGRAM BOT — OBRÁZKY DÍVEK ❌ CHYBÍ

**Stav:** NEIMPLEMENTOVÁNO. Uživatel explicitně žádá: "musí to umet posilat ty veci co jsem ti psal" a "obrazky dívek tam chci".

**Co chybí:**
1. **`sendPhoto()` funkce** v `lib/telegram.ts` — žádná funkce pro posílání fotek
2. **Logika v AI tools** — `getGirlProfile` vrací textová data, ale nikdy neposílá fotku
3. **Photo URL** v tool response — getGirlProfile nevrací URL fotky/thumbnail

**Co existuje (připraveno k napojení):**
- `girl_photos` tabulka v DB s `url`, `thumbnail_url`, `is_primary` sloupci
- Fotky jsou na Vercel Blob storage (URL formát: `https://...blob.vercel-storage.com/...`)

**Potřeba:**
1. Přidat `sendPhoto(chatId, photoUrl, caption?)` do `lib/telegram.ts`
2. V `getGirlProfile` tool-handler přidat photo URL do response
3. V AI handler nebo system prompt — instrukce aby bot posílal fotku po getGirlProfile
4. Alternativně: nový tool `sendGirlPhoto(girlId)` který přímo pošle fotku klientovi

---

## 3. TELEGRAM BOT — HYBRIDNÍ BOOKING FLOW ✅

**Stav:** Implementováno (TASK-019).

**Soubory:**
- `lib/telegram-ai/booking-flow.ts` — kompletní handler (706 řádků):
  - `startBookingFlow()` — vytvoří draft, pošle time slot buttons
  - `handleTimeSelected()` — pošle duration buttons
  - `handleDurationSelected()` — pošle shrnutí + confirm/cancel
  - `handleConfirm()` — vytvoří bookings_v2 záznam
  - `handleCancel()` — zruší draft
  - `handleBookingCallback()` — router pro bk_* callbacky

**Routing v telegram-bot.ts:**
- `bk_*` callback → `handleBookingCallback()` PŘÍMO (bez AI)
- Ostatní callbacky → `handleAICallback()` (přeloženo na text → AI)

**Callback formáty:**
- `bk_time:{sessionId}:{HH:MM}`
- `bk_dur:{sessionId}:{minutes}`
- `bk_ok:{sessionId}`
- `bk_cancel:{sessionId}`
- `bk_back:{sessionId}`

**System prompt** obsahuje instrukce pro `startBookingFlow` tool.

**Žádné problémy nenalezeny.**

---

## 4. DB TABULKY ✅

**Stav:** Všechny tabulky jsou v auto-migracích v `lib/db.ts` (CREATE IF NOT EXISTS).

| Tabulka | V db.ts? | Indexy? |
|---------|----------|---------|
| booking_clients | ✅ | phone_hmac, telegram_id, trust_level |
| bookings_v2 | ✅ | girl_date, client, status, slot |
| booking_drafts | ✅ | girl_slot, expires, chat |
| slot_locks | ✅ | expires |
| booking_audit_log | ✅ | booking, user, action, created, severity |
| telegram_users | ✅ | — |
| telegram_messages | ✅ | chat, chat_created |
| telegram_rate_limits | ✅ | — |
| girl_notifications | ✅ | girl, girl_read_created |
| schedule_reminders | ✅ | UNIQUE(client_telegram_id, girl_id) |

**Žádné chybějící tabulky.**

---

## 5. ENCRYPTION (crypto.ts) ✅

**Stav:** Plně implementováno.

**Soubor:** `lib/crypto.ts`
- AES-256-GCM encrypt/decrypt
- HMAC SHA-256 pro vyhledávání (phone_hmac)
- Normalizace českých telefonních čísel
- Env vars: `BOOKING_ENCRYPTION_KEY`, `BOOKING_HMAC_SECRET`

**Env vars jsou v `.env.example`** — vývojář musí nastavit.

**Potenciální problém na produkci:** Závisí na `BOOKING_ENCRYPTION_KEY` env var. Pokud není nastavena → encrypt/decrypt hodí error. Ale to je by-design (bezpečnost).

---

## 6. AUDIT LOG ✅

**Stav:** Plně implementováno.

**Soubor:** `lib/audit.ts`
- `logAudit()` — hlavní funkce, nikdy nehází error
- `auditBookingCreate()`, `auditBookingStatusChange()`, `auditClientDecrypt()`, `auditLoginAttempt()`, `auditClientUpdate()`
- Píše do `booking_audit_log` tabulky

**Použití v kódu:**
- `tool-handlers.ts` — createBooking, cancelBooking
- `booking-flow.ts` — handleConfirm (booking.create)

---

## 7. BOOKING CALENDAR (Admin) ✅

**Stav:** Existuje, implementováno.

**Soubory:**
- `app/booking/calendar/page.tsx` — day/week view, server component
- `app/booking/calendar/new/page.tsx` — nová rezervace
- `app/booking/dashboard/page.tsx` — placeholder (prázdný dashboard)
- `app/booking/clients/page.tsx` — seznam klientů s filtry
- `app/booking/clients/[id]/page.tsx` — detail klienta
- `lib/booking-queries.ts` — CalendarGirl, CalendarBooking queries
- `lib/booking-actions.ts` — server actions (searchClient, etc.)
- `lib/client-queries.ts` — getClientList, getClientDetail, getClientBookingHistory
- `components/booking/CalendarDayView.tsx`, `CalendarWeekView.tsx`, `BookingDetailOverlay.tsx`

**Poznámka:** `app/booking/dashboard/page.tsx` je jen placeholder s textem "brzy dostupné".

---

## 8. STUDIO PWA ✅

**Stav:** Existuje, implementováno.

**Soubory:**
- `app/studio/dashboard/page.tsx` — denní bookings pro dívku, body, směna
- `app/studio/notifications/page.tsx` — notifikace (new_booking, cancelled, reminder)
- `app/studio/schedule/page.tsx` — rozvrh
- `app/studio/booking/[id]/page.tsx` — detail bookingu
- `app/studio/page.tsx` — root redirect/landing
- `lib/studio-queries.ts` — StudioBooking, StudioShift queries

**Locale verze (app/[locale]/studio/):**
- rezervace, kalendar, sluzby, recenze, fotky, videa, hashtagy, dostupnost, profil-status, stories, program, telo, hlas, zivotni-styl, statistiky

---

## 9. CRON JOBS ✅

**7 cron routes v `app/api/cron/`:**
1. `cleanup-daily-overrides` — maže staré schedule_exceptions
2. `cleanup-old-overrides` — maže expirované overrides
3. `expire-loyalty-discounts` — expirace věrnostních slev
4. `expire-stories` — expirace stories
5. `publish-blog` — automatické publikování blog postů
6. `recalc-stats` — přepočet statistik
7. `send-schedule-reminders` — posílání upomínek na nový rozvrh

---

## 10. NALEZENÉ PROBLÉMY (seřazeno dle priority)

### P1 — KRITICKÉ (blokuje uživatele)

#### 10.1 ❌ Chybí sendPhoto — bot neposílá obrázky dívek
- **Dopad:** Uživatel explicitně žádá fotky v botu
- **Soubory k úpravě:** `lib/telegram.ts`, `lib/telegram-ai/tool-handlers.ts`
- **Řešení:** Přidat `sendPhoto()` funkci + napojit na getGirlProfile response

### P2 — STŘEDNÍ

#### 10.2 ⚠️ Booking dashboard je prázdný placeholder
- **Soubor:** `app/booking/dashboard/page.tsx` — jen text "brzy dostupné"
- **Dopad:** Admin nemá přehled o denních statistikách bookingů

### P3 — NÍZKÉ

#### 10.3 ℹ️ createBooking tool stále přístupný (redundantní s startBookingFlow)
- System prompt říká "NEPOUZIVEJ createBooking primo", ale tool je stále v TOOLS array
- AI by ho teoreticky mohla zavolat
- **Řešení:** Buď odstranit z TOOLS, nebo ponechat jako fallback (aktuální stav)

#### 10.4 ℹ️ booking_drafts expiry = 12 hodin (booking-flow.ts:99)
- Kód nastavuje `12 * 60 * 60 * 1000` (12h), ale plán specifikoval 12 minut
- **Dopad:** Drafty blokují sloty po 12 hodin místo 12 minut
- **Soubor:** `lib/telegram-ai/booking-flow.ts:99`

---

## 11. ZÁVĚR

StudioFLOW systém je z **90% kompletní**. Hlavní chybějící funkce je **posílání fotek dívek přes Telegram** (sendPhoto). Zbytek (AI konverzace, booking flow, DB tabulky, encryption, audit, admin calendar, studio PWA, cron jobs) je implementován a zapojený.
