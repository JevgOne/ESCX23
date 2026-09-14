# TASK-024: Interní rezervační systém + Klientské karty + Telegram bot

## Shrnutí zadání

Uživatel chce kompletní interní booking systém nahrazující Google Calendar:
1. **Interní rezervační systém** — vlastní booking CRUD v admin/studio
2. **Klientské karty** — databáze stálých klientů s historií a informacemi  
3. **Telegram bot** — online rezervace, bot komunikuje s klientem
4. **Booking flow**: klient kontaktuje → rezervace → odeslání adresy → potvrzení 1h předem (jiný režim pro stálé vs nové klienty)

---

## Stav kódu (analýza 2026-09-13)

### Co existuje:
- **`bookings` tabulka** — existuje v DB, 0 řádků. Schema: girl_id, client_name, client_phone, client_email, date, start_time, end_time, duration, location, status (pending/confirmed/completed/cancelled), price, services, discount_*, communication_type (sms/call/whatsapp/telegram)
- **`/admin/rezervace` stránka** — read-only seznam bookings se status filtry + Google Calendar integrace (bude nahrazena)
- **`getBookings()` v queries.ts** — čte z bookings table
- **Žádné admin actions pro booking CRUD** — `admin-actions.ts` nemá createBooking/updateBooking
- **`admin_notifications` tabulka** + `lib/admin-notifications.ts` — funguje, ale jen pro admin
- **`notifications` tabulka** (legacy z Secretstory) — 0 řádků, nepoužívá se
- **`loyalty_tiers` tabulka** — existuje, schéma pro věrnostní program
- **`users` tabulka** — role: admin, manager, girl (žádná role pro klienty)
- **Auth systém** — cookie-based session, bcrypt, rate limiting, CSRF
- **Telegram bot research** — hotový v `.claude-context/tasks/TASK-telegram-research.md`, detailní plán webhook architektury
- **12 aktivních dívek** v DB, sdílí jedno telefonní číslo (+420734332131)
- **Google Calendar integrace** — gcal.ts + google_calendar_tokens tabulka (BUDE NAHRAZENA)

### Co chybí:
- Žádná `clients` / `client_cards` tabulka
- Žádný booking CRUD (create, update, status change)
- Žádný Telegram bot kód (`lib/telegram.ts` neexistuje)
- Žádný `/api/telegram/webhook` endpoint
- Žádný potvrzovací mechanismus (1h reminder)
- Žádná cron job pro remindery

---

## DB Schema — nové tabulky

### 1. `clients` (klientské karty)

```sql
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identita
  name TEXT NOT NULL,                    -- "Petr", "Martin K."
  phone TEXT,                            -- hlavní kontakt
  email TEXT,
  telegram_chat_id TEXT,                 -- z Telegram bota, NULL pokud nekomunikuje přes TG
  telegram_username TEXT,                -- @username pokud má
  
  -- Kategorizace
  type TEXT DEFAULT 'new' CHECK(type IN ('new', 'regular', 'vip', 'blacklisted')),
  -- new = první návštěva
  -- regular = stálý klient (3+ návštěvy)
  -- vip = VIP klient (admin decision)
  -- blacklisted = zakázaný klient
  
  -- Preferencí
  preferred_girls TEXT,                  -- JSON array girl_ids ["25","31"]
  preferred_location TEXT,               -- preferovaná pobočka
  preferred_program_id INTEGER,          -- preferovaný program
  notes TEXT,                            -- interní poznámky admina
  
  -- Statistiky (denormalized, recalc po booking completed)
  total_visits INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,         -- CZK celkem
  last_visit_at TEXT,                    -- datum poslední dokončené návštěvy
  first_visit_at TEXT,
  no_show_count INTEGER DEFAULT 0,       -- kolikrát nepřišel
  
  -- Potvrzení
  requires_confirmation INTEGER DEFAULT 1, -- 1 = vyžadovat potvrzení 1h předem, 0 = ne (stálí)
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_telegram ON clients(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
```

### 2. Úpravy `bookings` tabulky

```sql
-- Přidat sloupce do existující bookings tabulky (ALTER TABLE migrations)
ALTER TABLE bookings ADD COLUMN client_id INTEGER REFERENCES clients(id);
ALTER TABLE bookings ADD COLUMN program_id INTEGER;
ALTER TABLE bookings ADD COLUMN location_id INTEGER;
ALTER TABLE bookings ADD COLUMN confirmation_status TEXT DEFAULT 'not_required' 
  CHECK(confirmation_status IN ('not_required', 'pending', 'confirmed', 'no_response'));
ALTER TABLE bookings ADD COLUMN confirmation_sent_at DATETIME;
ALTER TABLE bookings ADD COLUMN confirmation_responded_at DATETIME;
ALTER TABLE bookings ADD COLUMN address_sent INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN address_sent_at DATETIME;
ALTER TABLE bookings ADD COLUMN source TEXT DEFAULT 'manual' 
  CHECK(source IN ('manual', 'telegram', 'whatsapp', 'sms', 'call'));
ALTER TABLE bookings ADD COLUMN cancelled_reason TEXT;
ALTER TABLE bookings ADD COLUMN admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_girl_date ON bookings(girl_id, date);
```

### 3. `telegram_links` (propojení Telegram s dívkami)

```sql
CREATE TABLE IF NOT EXISTS telegram_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  username TEXT,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
);
```

### 4. `booking_messages` (log komunikace)

```sql
CREATE TABLE IF NOT EXISTS booking_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('outgoing', 'incoming')),
  channel TEXT NOT NULL CHECK(channel IN ('telegram', 'sms', 'internal')),
  message_type TEXT NOT NULL CHECK(message_type IN (
    'booking_created', 'booking_confirmed', 'booking_cancelled',
    'address_sent', 'reminder_1h', 'confirmation_request',
    'confirmation_response', 'custom'
  )),
  content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered INTEGER DEFAULT 0,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

---

## Architektura

### Booking flow (kompletní)

```
1. KONTAKT (klient → agentura)
   ├── SMS/Volání → admin ručně vytvoří booking v admin panelu
   ├── WhatsApp → admin ručně vytvoří booking
   └── Telegram bot → automaticky nebo semi-auto (fáze 2)

2. VYTVOŘENÍ REZERVACE (admin panel)
   ├── Vybrat dívku
   ├── Vybrat/vytvořit klienta (autocomplete phone/name)
   ├── Datum + čas + trvání (program)
   ├── Pobočka
   └── Uložit → status: pending nebo confirmed

3. ODESLÁNÍ ADRESY
   ├── Admin klikne "Poslat adresu" u potvrzené rezervace
   ├── Systém pošle adresu pobočky klientovi (TG bot / manuálně)
   └── Zaznamená booking_messages + bookings.address_sent=1

4. POTVRZENÍ 1H PŘEDEM (cron job)
   ├── Cron běží každých 10 min
   ├── Najde bookings kde date=dnes AND start_time za 50-70 min
   ├── IF client.requires_confirmation = 1:
   │   ├── Telegram: pošle inline keyboard "Potvrzuji ✅ / Ruším ❌"
   │   └── SMS/jiné: admin dostane notifikaci "ověřit s klientem"
   ├── IF client.requires_confirmation = 0 (stálí):
   │   └── Přeskočit (důvěra)
   └── Výsledek: confirmation_status updated

5. DOKONČENÍ
   ├── Admin/dívka označí jako completed
   ├── client.total_visits++, total_spent += price
   ├── Auto-upgrade klienta (3+ = regular, admin = vip)
   └── Notifikace dívce přes Telegram (volitelně)
```

### Telegram bot architektura

```
                    ┌─────────────────┐
                    │  Telegram Cloud  │
                    └────────┬────────┘
                             │ webhook POST
                    ┌────────▼────────┐
                    │ /api/telegram/  │
                    │ webhook         │  ← Vercel serverless
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ lib/telegram.ts │
                    │                 │
                    │ handleUpdate()  │  ← routing příkazů
                    │ sendMessage()   │  ← odchozí zprávy
                    │ sendBooking..() │  ← booking notifikace
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   SQLite DB     │
                    │ telegram_links  │
                    │ clients         │
                    │ bookings        │
                    │ booking_messages│
                    └─────────────────┘
```

**Telegram bot příkazy:**

| Příkaz | Kdo | Co dělá |
|--------|-----|---------|
| `/start link_{girl_id}_{token}` | Dívka | Propojí TG s profilem dívky |
| `/start book` | Klient | Zahájí rezervační flow (fáze 2) |
| `/status` | Dívka | Zobrazí dnešní směnu + nadcházející bookings |
| `/stop` | Dívka | Odpojí notifikace |
| Inline keyboard odpověď | Klient | Potvrzení/zrušení 1h před |

---

## Implementační tasky (pořadí)

### TASK-024a: DB migrace — clients + booking rozšíření
**Soubory:**
- `lib/db.ts` — přidat migrace do `runMigrations()`
  - CREATE TABLE clients
  - CREATE TABLE telegram_links
  - CREATE TABLE booking_messages
  - ALTER TABLE bookings ADD COLUMN client_id, program_id, location_id, confirmation_status, etc.

**Závislosti:** Žádné
**Effort:** Malý

---

### TASK-024b: Klientské karty — CRUD + admin UI
**Soubory k vytvoření:**
- `lib/client-actions.ts` — server actions: createClient, updateClient, getClients, getClient, searchClientByPhone
- `app/[locale]/(admin)/admin/klienti/page.tsx` — seznam klientů s filtry (type: new/regular/vip/blacklisted), search
- `app/[locale]/(admin)/admin/klienti/[id]/page.tsx` — detail klienta: info + historie bookings + poznámky
- `app/[locale]/(admin)/admin/klienti/novy/page.tsx` — formulář nového klienta

**Soubory k úpravě:**
- `components/admin/AdminSidebar.tsx` — přidat "Klienti" do nav menu (s ikonou)
- `lib/queries.ts` — přidat getClientBookingHistory(), searchClients()

**Závislosti:** TASK-024a
**Effort:** Střední

---

### TASK-024c: Booking CRUD — admin panel
**Soubory k vytvoření:**
- `lib/booking-actions.ts` — server actions:
  - `createBooking(formData)` — vytvoří booking + propojí s klientem
  - `updateBookingStatus(formData)` — pending→confirmed→completed/cancelled
  - `sendAddress(formData)` — odešle adresu pobočky klientovi
  - `cancelBooking(formData)` — zruší + důvod
- `app/[locale]/(admin)/admin/rezervace/nova/page.tsx` — formulář nové rezervace:
  - Výběr dívky (select z aktivních)
  - Klient: autocomplete dle telefonu/jména, nebo "nový klient" inline
  - Datum + čas (date picker + time select)
  - Program (select z pricing_plans)
  - Pobočka (select z locations)
  - Zdroj (manual/telegram/whatsapp/sms/call)
  - Poznámky

**Soubory k přepracování:**
- `app/[locale]/(admin)/admin/rezervace/page.tsx` — **kompletně přepracovat**:
  - Odebrat Google Calendar integraci
  - Přidat tlačítko "Nová rezervace"
  - Rozšířit tabulku: klient, program, pobočka, akce (status change, poslat adresu)
  - Přidat denní/týdenní přehled (kalendářní view)
  - Filtry: dívka, datum, status, klient
- `lib/queries.ts` — rozšířit `getBookings()` o joins na clients, pricing_plans, locations

**Závislosti:** TASK-024a, TASK-024b
**Effort:** Velký

---

### TASK-024d: Booking v Studio (dívka vidí své rezervace)
**Soubory k úpravě:**
- `app/[locale]/studio/page.tsx` — dashboard: přidat sekci "Dnešní rezervace" + "Nadcházející"
- Vytvořit `app/[locale]/studio/rezervace/page.tsx` — seznam reservací pro danou dívku
  - Zobrazit: datum, čas, program, pobočka, status
  - NEZOBRAZOVAT: klientovo jméno, telefon (privacy — admin handles communication)
  - Akce: "Dokončena" button (status → completed)

**Závislosti:** TASK-024c
**Effort:** Malý–Střední

---

### TASK-024e: Telegram bot — základ (lib + webhook + linking dívek)
**Soubory k vytvoření:**
- `lib/telegram.ts` — core Telegram Bot API wrapper:
  - `sendMessage(chatId, text, parseMode)`
  - `setWebhook(url, secret)`
  - `generateLinkToken(girlId)` — HMAC token pro deep link
  - `verifyLinkToken(girlId, token)`
  - `handleUpdate(update)` — router pro incoming webhook updates
  - `sendBookingNotification(girlId, booking)` — formátovaná booking zpráva
  - `sendConfirmationRequest(clientChatId, booking)` — inline keyboard
- `app/api/telegram/webhook/route.ts` — POST endpoint:
  - Verify `X-Telegram-Bot-Api-Secret-Token` header
  - Parse update, route to handleUpdate()
- `app/api/telegram/setup/route.ts` — GET endpoint pro admin: nastaví webhook URL

**Soubory k úpravě:**
- `app/[locale]/studio/page.tsx` — přidat "Propojit Telegram" button na dashboard
- `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` — přidat Telegram link status

**Env vars:**
```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
TELEGRAM_LINK_SECRET=...
```

**Závislosti:** TASK-024a
**Effort:** Střední

---

### TASK-024f: Telegram bot — klientský booking flow
**Soubory k úpravě:**
- `lib/telegram.ts` — přidat:
  - `handleBookingStart(chatId)` — zahájí konverzaci, ptá se na dívku/datum/čas
  - `handleBookingStep(chatId, step, data)` — state machine pro booking conversation
  - Inline keyboards pro výběr dívky, data, času, programu
  - Po dokončení: vytvoří booking + notifikuje admina + notifikuje dívku
- `lib/telegram-state.ts` — conversation state management (in-memory nebo DB)

**Závislosti:** TASK-024e, TASK-024c
**Effort:** Velký

---

### TASK-024g: Potvrzení 1h předem — cron + notifikace
**Soubory k vytvoření:**
- `app/api/cron/booking-reminders/route.ts` — cron job (Vercel cron, interval 10 min):
  1. SELECT bookings WHERE date = today AND start_time mezi NOW+50min a NOW+70min
  2. JOIN clients, check requires_confirmation
  3. IF requires_confirmation AND confirmation_status = 'not_required':
     - Pokud klient má telegram_chat_id → pošli inline keyboard "Potvrzuji/Ruším"
     - Pokud ne → notifikuj admina "Zavolat klientovi pro potvrzení"
  4. UPDATE bookings SET confirmation_status = 'pending', confirmation_sent_at = NOW
  5. INSERT booking_messages

**Soubory k úpravě:**
- `vercel.json` — přidat cron schedule
- `lib/telegram.ts` — přidat handler pro inline keyboard callback (confirmation response)

**Závislosti:** TASK-024c, TASK-024e
**Effort:** Střední

---

### TASK-024h: Klientská auto-kategorizace + statistiky
**Soubory k úpravě:**
- `lib/booking-actions.ts` — po `updateBookingStatus` na completed:
  - Inkrementovat `clients.total_visits`, `total_spent`
  - Aktualizovat `last_visit_at`
  - Auto-upgrade: `total_visits >= 3` → type='regular', admin rozhoduje o vip
  - regular klienti: `requires_confirmation = 0`
- `app/api/cron/recalc-stats/route.ts` — přidat recalc klientských statistik

**Závislosti:** TASK-024b, TASK-024c
**Effort:** Malý

---

### TASK-024i: Cleanup — odebrat Google Calendar integraci
**Soubory k úpravě:**
- `app/[locale]/(admin)/admin/rezervace/page.tsx` — odebrat GCal sekci (hotovo v 024c)
- `lib/gcal.ts` — smazat (nebo ponechat jako legacy)
- `app/api/gcal/` — smazat auth/callback/disconnect routes
- `scripts/migrate-gcal.sql` — ponechat jako historii

**Závislosti:** TASK-024c (nový systém musí být funkční PŘED odebráním starého)
**Effort:** Malý

---

## Doporučené pořadí implementace

```
FÁZE 1 — Základ (bez Telegramu)
  024a → 024b → 024c → 024d → 024h
  
  Výsledek: Fungující interní booking systém s klientskými kartami,
  admin vytváří bookings ručně, dívky vidí své rezervace v Studio.

FÁZE 2 — Telegram notifikace
  024e → 024g
  
  Výsledek: Dívky propojí TG, dostávají notifikace o bookings.
  Klienti dostávají 1h potvrzení přes TG (pokud mají).

FÁZE 3 — Telegram bot pro klienty
  024f
  
  Výsledek: Klienti mohou vytvářet rezervace přes Telegram bota.

FÁZE 4 — Cleanup
  024i
  
  Výsledek: Google Calendar integrace odstraněna.
```

---

## Rizika a rozhodnutí k potvrzení s uživatelem

1. **Klient nemá account/login** — klientské karty jsou interní pro admin, klient se nikam nepřihlašuje. Správně?
2. **Telegram bot jméno** — uživatel musí vytvořit bota přes @BotFather a poskytnout token. Navrhované jméno: `@LovelyGirlsPrahaBot`
3. **SMS integrace** — uživatel zmiňuje SMS. Pro automatické SMS (potvrzení) je potřeba SMS gateway (Twilio, SMSBrana.cz). Je to potřeba v první fázi, nebo stačí Telegram + manuální?
4. **Adresa pobočky** — systém pošle adresu z `locations` tabulky. Momentálně `locations.address` není v DB. Potřeba přidat?
5. **Potvrzení stálých klientů** — zadání říká "ne u stálých klientů nebo vlastně u všech". Interpretace: stálí (regular/vip) BEZ potvrzení, noví s potvrzením. Admin může overridnout per klient.
6. **Google Calendar** — odebrat úplně, nebo ponechat jako alternativu?

---

## Soubory dotčené (celkový přehled)

### Nové soubory:
- `lib/telegram.ts`
- `lib/telegram-state.ts`
- `lib/client-actions.ts`
- `lib/booking-actions.ts`
- `app/api/telegram/webhook/route.ts`
- `app/api/telegram/setup/route.ts`
- `app/api/cron/booking-reminders/route.ts`
- `app/[locale]/(admin)/admin/klienti/page.tsx`
- `app/[locale]/(admin)/admin/klienti/[id]/page.tsx`
- `app/[locale]/(admin)/admin/klienti/novy/page.tsx`
- `app/[locale]/(admin)/admin/rezervace/nova/page.tsx`
- `app/[locale]/studio/rezervace/page.tsx`

### Upravené soubory:
- `lib/db.ts` — migrace
- `lib/queries.ts` — rozšíření getBookings, nové query funkce
- `components/admin/AdminSidebar.tsx` — nové nav položky
- `app/[locale]/(admin)/admin/rezervace/page.tsx` — přepracování
- `app/[locale]/studio/page.tsx` — TG linking + dnešní bookings
- `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` — TG status
- `vercel.json` — cron jobs
