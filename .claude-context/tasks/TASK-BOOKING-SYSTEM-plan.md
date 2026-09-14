# TASK-BOOKING-SYSTEM: Interní rezervační systém + Klientské karty + Telegram bot

> Kompletní plán implementace. Nahrazuje Google Calendar. Vlastní booking flow, klientská databáze, Telegram bot pro komunikaci s klienty.
> **BEZPEČNOST JE ABSOLUTNÍ PRIORITA** — viz sekce 11.

---

## 1. ANALÝZA STÁVAJÍCÍHO STAVU

### 1.1 Existující DB tabulky (v data/app.db)

**`bookings`** — existuje, 0 řádků, nikdy nebyla použita:
```
id, girl_id, created_by, client_name, client_phone, client_email,
date, start_time, end_time, duration, location, location_type,
services, price, status (pending/confirmed/completed/cancelled),
notes, discount_type, discount_percentage, discount_amount,
original_price, final_price, communication_type (sms/call/whatsapp/telegram)
```

**`girls`** — 12 aktivních dívek, schéma obsahuje phone, email (sdílený tel +420734332131). Sloupec `telegram` v kódu existuje (queries.ts), ale NE v DB.

**`locations`** — 3 pobočky: praha-2 (Vinohrady, má adresu), praha-3, praha-5 (nemají adresu). Sloupec `address` existuje.

**`pricing_plans`** — 5 aktivních programů: 30min/2000Kč, 45min/2200Kč, 60min/2500Kč(popular), 90min/4000Kč, 120min/4500Kč + noční ceny.

**`users`** — role: admin, manager, girl. Žádná role pro klienty.

**`admin_notifications`** — funguje, `lib/admin-notifications.ts` hotový.

**`loyalty_tiers`** — existuje (visits_required, discount_percentage, tier_level).

**`google_calendar_tokens`** — GCal integrace, BUDE NAHRAZENA.

### 1.2 Existující kód

| Soubor | Stav |
|--------|------|
| `/admin/rezervace/page.tsx` | Read-only seznam bookings + GCal integrace. Žádný CRUD. |
| `lib/queries.ts` → `getBookings()` | Čte z bookings table, anonymizuje kontakt. |
| `lib/admin-actions.ts` | 40+ server actions, ALE žádná pro bookings. |
| `lib/gcal.ts` | Google Calendar OAuth + events. Nahradíme. |
| `lib/admin-notifications.ts` | CRUD pro admin_notifications. Použijeme. |
| `lib/auth.ts` | Cookie session, bcrypt, rate limiting. Solid. |
| `.claude-context/tasks/TASK-telegram-research.md` | Detailní research TG Bot API, webhook architektura. |

### 1.3 Co CHYBÍ

- Žádná `clients` tabulka (klientské karty neexistují)
- Žádný booking CRUD (create/update/delete/status change)
- Žádný `lib/telegram.ts`
- Žádný `/api/telegram/webhook`
- Žádný cron pro remindery/potvrzení
- Žádný formulář pro novou rezervaci
- Dívky nevidí své rezervace v Studio

---

## 2. NÁVRH ARCHITEKTURY (BEST PRACTICES)

### 2.1 Klíčový princip: Hub & Spoke

```
                    ┌──────────────┐
                    │  ADMIN PANEL │  ← centrální řízení
                    │  /admin/     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐
   │   STUDIO    │ │  TELEGRAM   │ │   KLIENTSKÁ  │
   │   /studio/  │ │   BOT       │ │   DATABÁZE   │
   │   (dívky)   │ │   (klienti) │ │   /admin/    │
   └─────────────┘ └─────────────┘ └──────────────┘
```

**Admin je vždy centrum.** Telegram bot vytváří requesty, ale admin je schvaluje. Dívky vidí pouze své bookings (ne klienta). Klient nemá přímý přístup do systému — komunikuje přes TG bota nebo SMS a admin vytváří/potvrzuje.

### 2.2 Proč NE Google Calendar

| | Google Calendar | Vlastní systém |
|---|---|---|
| Klientské karty | Nelze | Plná kontrola |
| Auto-potvrzení | Nelze | TG bot / cron |
| Historie klienta | Nelze | Vše v DB |
| VIP režim | Nelze | Pravidla per klient |
| Offline | Závisí na Google | SQLite local |
| Cena | Free (ale limity) | Free (vlastní) |

### 2.3 Bezpečnostní princip: Minimální PII přes Telegram

- Telegram zprávy jsou na serverech Telegramu (cloud)
- **NIKDY neposílat:** klientovo příjmení, adresu klienta, platební údaje
- **Posílat dívce:** datum, čas, program, pobočka (to potřebuje)
- **Posílat klientovi:** potvrzení času, adresa pobočky (po potvrzení), připomenutí
- Admin vidí vše v panelu

---

## 3. DB SCHEMA — NOVÉ A UPRAVENÉ TABULKY

### 3.1 `clients` — Klientské karty

```sql
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identita
  name TEXT NOT NULL,                              -- zobrazované jméno ("Martin", "P.K.")
  phone TEXT,                                      -- primární kontakt, formát +420...
  phone_hash TEXT,                                 -- SHA256 hash pro vyhledávání bez plaintext
  email TEXT,
  
  -- Telegram
  telegram_chat_id TEXT UNIQUE,                    -- z TG bota (pro posílání zpráv)
  telegram_username TEXT,                           -- @username (informativní)
  
  -- Typ klienta
  type TEXT DEFAULT 'new' 
    CHECK(type IN ('new', 'regular', 'vip', 'blacklisted')),
  --   new         = první nebo druhá návštěva
  --   regular     = 3+ dokončených návštěv (auto)
  --   vip         = admin rozhodne (ruční upgrade)
  --   blacklisted = zákaz (no-show, problémy)
  
  -- Preferencí (JSON)
  preferred_girl_ids TEXT,                         -- JSON: [25, 31]
  preferred_location_id INTEGER,                   -- FK → locations
  preferred_program_id INTEGER,                    -- FK → pricing_plans
  notes TEXT,                                      -- interní poznámky admina
  
  -- Pravidla
  requires_confirmation INTEGER DEFAULT 1,         -- 1=ano, 0=ne (stálí/VIP)
  -- Logika: new=vždy, regular=volitelně, vip=nikdy, blacklisted=vždy
  
  -- Statistiky (denormalizované, aktualizované při completed booking)
  total_visits INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,                   -- CZK celkem
  avg_rating INTEGER DEFAULT 0,                    -- průměrné hodnocení od dívek (1-5, 0=nehodnoceno)
  last_visit_at TEXT,
  first_visit_at TEXT,
  no_show_count INTEGER DEFAULT 0,                 -- nepřišel bez zrušení
  cancellation_count INTEGER DEFAULT 0,            -- zrušil < 2h před
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_phone_hash ON clients(phone_hash);
CREATE INDEX IF NOT EXISTS idx_clients_telegram ON clients(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
```

**Kreativní nápad: Klientské hodnocení od dívek**
Admin nebo dívka může po dokončené návštěvě ohodnotit klienta (1-5 hvězd + poznámka). Toto vidí POUZE admin a dívka (ne klient). Pomáhá identifikovat problémové klienty dřív než se stanou blacklisted.

### 3.2 `client_ratings` — Hodnocení klientů dívkami

```sql
CREATE TABLE IF NOT EXISTS client_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  girl_id INTEGER NOT NULL,
  booking_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  note TEXT,                                       -- "Byl v pohodě", "Přišel pozdě 20 min"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (girl_id) REFERENCES girls(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

### 3.3 Rozšíření `bookings` — ALTER TABLE migrace

```sql
-- Propojení s klientem (místo volného client_name/phone)
ALTER TABLE bookings ADD COLUMN client_id INTEGER REFERENCES clients(id);

-- Strukturované propojení (místo textových polí)
ALTER TABLE bookings ADD COLUMN program_id INTEGER REFERENCES pricing_plans(id);
ALTER TABLE bookings ADD COLUMN location_id INTEGER REFERENCES locations(id);

-- Potvrzovací mechanismus
ALTER TABLE bookings ADD COLUMN confirmation_status TEXT DEFAULT 'not_required'
  CHECK(confirmation_status IN ('not_required', 'pending', 'confirmed', 'declined', 'no_response'));
ALTER TABLE bookings ADD COLUMN confirmation_sent_at DATETIME;
ALTER TABLE bookings ADD COLUMN confirmation_responded_at DATETIME;

-- Adresa
ALTER TABLE bookings ADD COLUMN address_sent INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN address_sent_at DATETIME;
ALTER TABLE bookings ADD COLUMN address_sent_via TEXT;  -- 'telegram', 'sms', 'manual'

-- Zdroj a metadata
ALTER TABLE bookings ADD COLUMN source TEXT DEFAULT 'admin'
  CHECK(source IN ('admin', 'telegram_bot', 'phone', 'sms', 'whatsapp'));
ALTER TABLE bookings ADD COLUMN cancelled_reason TEXT;
ALTER TABLE bookings ADD COLUMN admin_notes TEXT;
ALTER TABLE bookings ADD COLUMN girl_rating INTEGER;    -- dívka hodnotí klienta po návštěvě

-- Indexy
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_girl_date ON bookings(girl_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation ON bookings(confirmation_status, date);
```

### 3.4 `telegram_links` — Propojení TG s dívkami (pro notifikace)

```sql
CREATE TABLE IF NOT EXISTS telegram_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  username TEXT,
  is_active INTEGER DEFAULT 1,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
);
```

### 3.5 `booking_log` — Audit trail komunikace

```sql
CREATE TABLE IF NOT EXISTS booking_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  -- Akce: 'created', 'status_changed', 'address_sent', 
  --       'confirmation_sent', 'confirmation_received',
  --       'reminder_sent', 'note_added', 'cancelled'
  details TEXT,                    -- JSON s kontextem {"from":"pending","to":"confirmed"}
  performed_by TEXT,               -- 'admin:1', 'girl:25', 'telegram_bot', 'cron'
  channel TEXT,                    -- 'admin_panel', 'telegram', 'sms', 'system'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

---

## 4. BOOKING FLOW — KOMPLETNÍ LOGIKA

### 4.1 Flow diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PŘÍJEM POŽADAVKU                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SMS/Telefon ───────► Admin ručně zadá do panelu            │
│                                                             │
│  WhatsApp ──────────► Admin ručně zadá do panelu            │
│                                                             │
│  Telegram bot ──────► Bot → vytvoří booking (source=        │
│                       telegram_bot, status=pending)         │
│                       → Admin obdrží notifikaci             │
│                       → Admin potvrdí/zamítne               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              VYTVOŘENÍ BOOKINGU V ADMIN PANELU              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Vybrat/vytvořit KLIENTA                                │
│     └─ Autocomplete: zadej telefon → najde existujícího    │
│     └─ Nebo: "Nový klient" → inline mini-form              │
│     └─ Zobrazí: typ (new/regular/vip), počet návštěv,      │
│                 no-show count, poznámky                     │
│                                                             │
│  2. Vybrat DÍVKU                                           │
│     └─ Select z aktivních (s dnešním rozvrhem)             │
│     └─ Zobrazí: dnes online? časy? lokace?                 │
│                                                             │
│  3. DATUM + ČAS                                            │
│     └─ Date picker + time select (15min intervaly)         │
│     └─ Validace: dívka v tu dobu pracuje?                  │
│     └─ Validace: nemá kolizi s jiným bookingem?            │
│                                                             │
│  4. PROGRAM (select z pricing_plans)                       │
│     └─ 30/45/60/90/120 min, auto-výpočet end_time         │
│     └─ Cena: denní vs noční (auto dle času)                │
│                                                             │
│  5. POBOČKA (select z locations)                           │
│     └─ Default: dívčina dnešní lokace                      │
│                                                             │
│  6. ZDROJ + POZNÁMKY                                       │
│     └─ Odkud přišel request (admin/phone/sms/whatsapp/tg)  │
│     └─ Admin poznámky                                      │
│                                                             │
│  → ULOŽIT                                                  │
│    └─ INSERT bookings + booking_log ('created')            │
│    └─ Pokud nový klient → INSERT clients                   │
│    └─ Admin notifikace ✓                                   │
│    └─ TG notifikace dívce (pokud propojená)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 POTVRZENÍ BOOKINGU                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Admin změní status: pending → confirmed                    │
│  → booking_log ('status_changed')                          │
│  → TG notifikace dívce: "Nová potvrzená rezervace"         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 ODESLÁNÍ ADRESY                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Admin klikne "Poslat adresu" na potvrzeném bookingu        │
│                                                             │
│  IF klient má telegram_chat_id:                            │
│    → TG bot pošle adresu pobočky                           │
│    → address_sent = 1, address_sent_via = 'telegram'       │
│                                                             │
│  ELSE:                                                     │
│    → Admin vidí adresu + tlačítko "Zkopírovat"             │
│    → Admin ručně pošle přes SMS/WA                         │
│    → Klikne "Odesláno ručně"                               │
│    → address_sent = 1, address_sent_via = 'manual'         │
│                                                             │
│  → booking_log ('address_sent')                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              POTVRZENÍ 1H PŘEDEM (CRON)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cron job: každých 10 minut                                │
│                                                             │
│  SELECT bookings WHERE:                                    │
│    date = dnes                                             │
│    status = 'confirmed'                                    │
│    start_time BETWEEN now()+50min AND now()+70min          │
│    confirmation_status = 'not_required'                    │
│                                                             │
│  Pro každý booking:                                        │
│                                                             │
│  IF client.requires_confirmation = 0:                      │
│    → Přeskočit (stálý/VIP klient, důvěra)                 │
│                                                             │
│  IF client.requires_confirmation = 1:                      │
│    IF klient má telegram_chat_id:                          │
│      → TG bot: "Potvrzujete návštěvu dnes v 14:00?"       │
│      → Inline keyboard: [Potvrzuji ✅] [Ruším ❌]          │
│      → confirmation_status = 'pending'                     │
│    ELSE:                                                   │
│      → Admin notifikace: "Zavolat klientovi Martin         │
│        pro potvrzení 14:00 bookingu"                       │
│      → confirmation_status = 'pending'                     │
│                                                             │
│  Klient odpovídá (TG inline keyboard):                     │
│    ✅ → confirmation_status = 'confirmed'                  │
│       → booking_log + notifikace dívce                     │
│    ❌ → confirmation_status = 'declined'                   │
│       → status = 'cancelled', reason = 'client_declined'   │
│       → booking_log + notifikace admin + dívce             │
│                                                             │
│  Timeout 30 min bez odpovědi:                              │
│    → confirmation_status = 'no_response'                   │
│    → Admin notifikace: "Klient neodpověděl"                │
│    → Admin rozhodne (zavolat / zrušit)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 DOKONČENÍ NÁVŠTĚVY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Admin nebo dívka označí booking jako completed             │
│                                                             │
│  → client.total_visits++                                   │
│  → client.total_spent += booking.final_price               │
│  → client.last_visit_at = NOW                              │
│                                                             │
│  Auto-upgrade:                                             │
│    IF total_visits >= 3 AND type = 'new':                  │
│      → type = 'regular'                                    │
│      → requires_confirmation = 0 (nebo admin rozhodne)     │
│                                                             │
│  Volitelně: Dívka ohodnotí klienta (1-5 + poznámka)       │
│                                                             │
│  No-show detekce:                                          │
│    IF booking čas prošel a nebyl completed:                │
│      → Admin může označit jako "no-show"                   │
│      → client.no_show_count++                              │
│      → IF no_show_count >= 3: auto-blacklist doporučení    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Pravidla potvrzení dle typu klienta

| Typ klienta | Potvrzení 1h předem | Adresa se posílá | Poznámka |
|-------------|---------------------|------------------|----------|
| `new` | VŽDY povinné | Po potvrzení bookingu | Neznámý klient, vyžaduje ověření |
| `regular` | NE (default, admin overridne) | Po potvrzení bookingu | Prověřený, důvěra |
| `vip` | NIKDY | Hned s potvrzením | Prémiový režim |
| `blacklisted` | VŽDY + admin review | Nikdy automaticky | Zakázaný klient |

---

## 5. TELEGRAM BOT — ARCHITEKTURA

### 5.1 Proč webhook (ne polling)

- Vercel = serverless → žádný persistent process pro polling
- Webhook = push model → Telegram posílá update na náš endpoint
- 0 infrastrukturní náklady
- Telegram Bot API je zdarma

### 5.2 Architektura

```
TELEGRAM CLOUD
    │
    │ POST (s secret token headerem)
    ▼
/api/telegram/webhook/route.ts
    │
    │ Verify X-Telegram-Bot-Api-Secret-Token
    │ Parse update JSON
    ▼
lib/telegram.ts → handleUpdate()
    │
    ├── /start link_{girl_id}_{hmac}  → propojí dívku
    ├── /start book                    → zahájí booking flow (fáze 2)  
    ├── /status                        → dívka: dnešní směna + bookings
    ├── /stop                          → odpojí notifikace
    ├── Callback query (inline kbd)    → potvrzení/zrušení bookingu
    └── Text message                   → booking conversation (fáze 2)
```

### 5.3 Dva typy uživatelů bota

**A) Dívky** — propojení přes deep link, dostávají notifikace:
- Booking created/confirmed/cancelled
- Reminder 1h předem
- Schedule changes

**B) Klienti** (fáze 2) — konverzační booking:
```
Klient: /start book
Bot:    Ahoj! Rád vám pomohu s rezervací.
        Jakou dívku preferujete?
        [Sara] [Luna] [Nika] [Emily] [...]

Klient: *klik na Nika*
Bot:    Nika je dnes k dispozici 10:00-22:00 v Praze 2.
        Jaký den a čas?
        [Dnes] [Zítra] [Jiný den...]

Klient: *klik na Dnes*
Bot:    Zvolte čas:
        [14:00] [15:00] [16:00] [17:00] [...]

Klient: *klik na 16:00*
Bot:    Na jak dlouho?
        [30 min — 2000 Kč] [60 min — 2500 Kč] [90 min — 4000 Kč]

Klient: *klik na 60 min*
Bot:    Shrnutí:
        Nika · dnes 16:00-17:00 · 60 min · Praha 2
        Cena: 2500 Kč
        
        [Potvrdit ✅] [Zrušit ❌]

Klient: *Potvrdit*
Bot:    Rezervace odeslána! Brzy vám potvrdíme.
        Adresu obdržíte po potvrzení.

→ bookings INSERT (status=pending, source=telegram_bot)
→ Admin notifikace: "Nový TG booking request: Nika, dnes 16:00"
→ Admin potvrdí → bot pošle klientovi adresu
```

### 5.4 Env vars potřebné

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...          # z @BotFather
TELEGRAM_WEBHOOK_SECRET=random-32-chars        # ověření příchozích webhooků
TELEGRAM_LINK_SECRET=another-random-secret     # HMAC pro dívčí deep linky
```

### 5.5 Quiet hours

- Neposílat zprávy 23:00-08:00 Prague time
- Queued zprávy odeslat v 08:01
- Implementace: check čas v `sendMessage()`, pokud quiet hours → INSERT do `pending_messages` tabulky → cron v 08:00 pošle

---

## 6. ADMIN UI — STRÁNKY A KOMPONENTY

### 6.1 `/admin/rezervace` — PŘEPRACOVAT (hlavní booking dashboard)

**Aktuální stav:** Read-only tabulka + GCal integrace.

**Nový design:**

```
┌─────────────────────────────────────────────────────────┐
│ Rezervace                           [+ Nová rezervace]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  DNES — Pá 13.9.2026                                   │
│  ┌───────┬────────┬──────────┬──────────┬────────────┐ │
│  │ 14:00 │ Nika   │ Martin   │ 60 min   │ ✅ Potvr.  │ │
│  │ 16:00 │ Luna   │ P.K.     │ 90 min   │ ⏳ Čeká    │ │
│  │ 18:00 │ Sara   │ NOVÝ     │ 60 min   │ ⏳ Čeká    │ │
│  └───────┴────────┴──────────┴──────────┴────────────┘ │
│                                                         │
│  ZÍTRA — So 14.9.2026                                  │
│  ┌───────┬────────┬──────────┬──────────┬────────────┐ │
│  │ 12:00 │ Emily  │ VIP Jan  │ 120 min  │ ✅ Potvr.  │ │
│  └───────┴────────┴──────────┴──────────┴────────────┘ │
│                                                         │
│  Filtry: [Všechny stavy ▼] [Všechny dívky ▼] [Datum]  │
│                                                         │
│  Historie (starší):                                     │
│  ... tabulka se stránkováním ...                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Akce na řádku:**
- Klik na řádek → detail bookingu (slide-out nebo modal)
- Quick actions: [Potvrdit] [Zrušit] [Poslat adresu] [Dokončeno]
- Badge pro nový/regular/vip klienta
- Warning ikona pro klienty s no-show historií

### 6.2 `/admin/rezervace/nova` — Formulář nové rezervace

Popsáno v sekci 4.1. Server Component s `<form action>`, bez client JS kde to jde.

### 6.3 `/admin/klienti` — Klientské karty

```
┌─────────────────────────────────────────────────────────┐
│ Klienti                                [+ Nový klient]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Search: [________________] 🔍                          │
│  Filtr: [Všichni ▼] [VIP] [Stálí] [Noví] [Blacklist]  │
│                                                         │
│  ┌─────┬──────────┬────────┬─────────┬───────┬───────┐ │
│  │ Typ │ Jméno    │ Tel.   │Návštěvy │Rating │Posl.  │ │
│  ├─────┼──────────┼────────┼─────────┼───────┼───────┤ │
│  │ VIP │ Jan M.   │ *8421  │ 12      │ ★4.8  │ 9.9.  │ │
│  │ REG │ Martin   │ *3355  │ 5       │ ★4.2  │ 7.9.  │ │
│  │ NEW │ P.K.     │ *9012  │ 1       │ —     │ 13.9. │ │
│  │ 🚫  │ Tomáš    │ *1234  │ 2       │ ★1.0  │ 1.8.  │ │
│  └─────┴──────────┴────────┴─────────┴───────┴───────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.4 `/admin/klienti/[id]` — Detail klienta

```
┌─────────────────────────────────────────────────────────┐
│ ← Klienti    Martin K.                        [Edit]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Typ: 🟢 Stálý klient      Návštěvy: 5                │
│  Telefon: +420 733 ***355   Utraceno: 14 500 Kč        │
│  Telegram: @martinK (propojeno ✅)                      │
│  Potvrzení: NE (stálý klient)                          │
│  No-show: 0                                             │
│                                                         │
│  ── Poznámky admina ──                                  │
│  "Preferuje Niku, vždy přijde včas."                   │
│  [Upravit poznámku]                                    │
│                                                         │
│  ── Historie návštěv ──                                 │
│  13.9.2026  Nika    60 min  Praha 2   Dokončena  ★4   │
│  7.9.2026   Luna    90 min  Praha 2   Dokončena  ★5   │
│  1.9.2026   Nika    60 min  Praha 5   Dokončena  ★4   │
│  20.8.2026  Sara    60 min  Praha 2   Dokončena  ★5   │
│  10.8.2026  Nika    60 min  Praha 2   Dokončena  ★4   │
│                                                         │
│  ── Hodnocení od dívek ──                               │
│  Nika: ★4.0 (3×) — "Přátelský, přijde včas"          │
│  Luna: ★5.0 (1×) — "Super klient"                     │
│  Sara: ★5.0 (1×)                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.5 Studio — Dívka vidí své rezervace

V `/studio` dashboard přidat sekci "Dnešní rezervace":
```
┌────────────────────────────────────┐
│ 📅 Dnešní rezervace                │
│                                    │
│ 14:00 — 15:00 · 60 min · Praha 2  │
│ Status: Potvrzena ✅               │
│                                    │
│ 18:00 — 19:30 · 90 min · Praha 2  │
│ Status: Čeká na potvrzení ⏳       │
│                                    │
│ [Zobrazit všechny →]               │
└────────────────────────────────────┘
```

V `/studio/rezervace` — kompletní seznam:
- NEZOBRAZOVAT klientské údaje (jméno, telefon) — pouze čas, program, pobočka, status
- Dívka může: [Dokončeno] na proběhlé bookings

---

## 7. KREATIVNÍ NÁVRHY (BEST PRACTICES)

### 7.1 Smart Client Matching

Když admin zadává nový booking a napíše telefon, systém:
1. Hledá v `clients` dle phone
2. Pokud najde → auto-fill jméno, typ, historie, preferované dívky
3. Pokud nenajde → "Nový klient" inline formulář (jen jméno + telefon)
4. **Fuzzy match:** pokud číslo liší o 1 číslici → nabídne "Mysleli jste Martin K. (+420 733 855 355)?"

### 7.2 Booking Collision Detection

Při vytváření bookingu systém kontroluje:
- Má dívka v tom čase jiný booking? → BLOKOVAT
- Má dívka v tom dni rozvrh? → WARNING pokud mimo pracovní dobu
- Má klient jiný booking u jiné dívky ve stejný čas? → WARNING (podezřelé)

### 7.3 Daily Digest pro admin

Cron job v 07:00: Telegram zpráva adminovi:
```
📋 Dnešní přehled — Pá 13.9.2026

3 potvrzené rezervace:
14:00 Nika (Martin, stálý)
16:00 Luna (P.K., nový — POTVRDIT!)
18:00 Sara (VIP Jan)

1 čeká na potvrzení ⚠️
0 nepotvrzených klientů

Dnes pracují: Nika, Luna, Sara, Emily, Katy
```

### 7.4 Quick Rebook

Na klientské kartě tlačítko "Opakovat poslední" → pre-fillne formulář s posledním bookingem (stejná dívka, stejný program, stejná lokace, nový datum).

### 7.5 No-Show Protection

- 1. no-show → warning na klientské kartě
- 2. no-show → automatic `requires_confirmation = 1`
- 3. no-show → admin notifikace "Doporučit blacklist?"
- Blacklisted klient → při vytváření bookingu červený warning "BLACKLISTED" + povinné admin potvrzení

### 7.6 Revenue Tracking (budoucí)

Klientské karty mají `total_spent` → admin dashboard může zobrazit:
- Top 10 klientů dle tržeb
- Měsíční tržby per dívka
- Průměrná hodnota bookingu
- Conversion rate (pending → completed)

---

## 8. IMPLEMENTAČNÍ TASKY (POŘADÍ A ZÁVISLOSTI)

```
FÁZE 1 — DB + Klienti (bez Telegramu, funguje hned)
═══════════════════════════════════════════════════

  TASK-A: DB migrace
  ├── CREATE TABLE clients
  ├── CREATE TABLE client_ratings  
  ├── CREATE TABLE telegram_links
  ├── CREATE TABLE booking_log
  ├── ALTER TABLE bookings (add client_id, program_id, location_id, confirmation_*, address_*, source)
  └── Soubor: lib/db.ts → runMigrations()
  
  TASK-B: Klientské karty — lib + admin UI
  ├── lib/client-actions.ts (CRUD: create, update, search, getById, getHistory)
  ├── lib/queries.ts (searchClientByPhone, getClientBookings, getClientStats)
  ├── app/[locale]/(admin)/admin/klienti/page.tsx (seznam + filtry + search)
  ├── app/[locale]/(admin)/admin/klienti/[id]/page.tsx (detail + historie + hodnocení)
  ├── app/[locale]/(admin)/admin/klienti/novy/page.tsx (formulář)
  ├── components/admin/AdminSidebar.tsx (přidat "Klienti" do nav)
  └── Závisí na: TASK-A

  TASK-C: Booking CRUD — admin panel
  ├── lib/booking-actions.ts (createBooking, updateStatus, sendAddress, cancelBooking)
  ├── app/[locale]/(admin)/admin/rezervace/page.tsx (PŘEPRACOVAT kompletně)
  │   └── Odebrat GCal, přidat denní přehled, akce, filtry
  ├── app/[locale]/(admin)/admin/rezervace/nova/page.tsx (nová rezervace form)
  │   └── Client autocomplete, girl select, date/time, program, location
  ├── lib/queries.ts (rozšířit getBookings s JOINy na clients, pricing_plans, locations)
  └── Závisí na: TASK-A, TASK-B

  TASK-D: Booking v Studio (dívky)
  ├── app/[locale]/studio/page.tsx (přidat sekci "Dnešní rezervace")
  ├── app/[locale]/studio/rezervace/page.tsx (NOVÝ — seznam pro dívku, BEZ klientských dat)
  ├── components/studio/StudioSidebar.tsx (nebo nav — přidat "Rezervace")
  └── Závisí na: TASK-C

  TASK-E: Auto-upgrade + statistiky
  ├── lib/booking-actions.ts → po completed: update client stats, auto-upgrade type
  ├── No-show detekce logika
  └── Závisí na: TASK-C


FÁZE 2 — Telegram notifikace (dívky + admin)
═══════════════════════════════════════════════

  TASK-F: Telegram bot core
  ├── lib/telegram.ts
  │   ├── sendMessage(), sendInlineKeyboard()
  │   ├── setWebhook(), verifyWebhook()
  │   ├── generateLinkToken(), verifyLinkToken()
  │   ├── handleUpdate() — router
  │   ├── handleGirlLink() — /start link_{id}_{token}
  │   └── handleCallbackQuery() — inline keyboard responses
  ├── app/api/telegram/webhook/route.ts (POST handler)
  ├── app/api/telegram/setup/route.ts (admin: set webhook URL)
  └── Závisí na: TASK-A

  TASK-G: TG propojení dívek + notifikace
  ├── app/[locale]/studio/page.tsx — "Propojit Telegram" button
  ├── app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx — TG link status
  ├── lib/booking-actions.ts — po createBooking/updateStatus → sendNotification()
  ├── Notifikace: booking created/confirmed/cancelled, schedule change
  └── Závisí na: TASK-F, TASK-C

  TASK-H: Cron — 1h potvrzení + remindery
  ├── app/api/cron/booking-reminders/route.ts
  │   ├── Najdi bookings 50-70 min před start_time
  │   ├── Pokud client.requires_confirmation → pošli TG/admin notif
  │   └── Timeout handling (30 min no response)
  ├── app/api/cron/booking-digest/route.ts (volitelně — ranní digest)
  ├── vercel.json — přidat cron schedule
  └── Závisí na: TASK-F, TASK-C


FÁZE 3 — Telegram bot pro klienty (konverzační booking)
════════════════════════════════════════════════════════

  TASK-I: Konverzační booking flow
  ├── lib/telegram-booking.ts (state machine, inline keyboards)
  │   ├── Step 1: Výběr dívky (inline keyboard)
  │   ├── Step 2: Výběr data (dnes/zítra/jiný)
  │   ├── Step 3: Výběr času (inline keyboard, filtrovaný dle rozvrhu)
  │   ├── Step 4: Výběr programu (inline keyboard s cenami)
  │   ├── Step 5: Potvrzení (summary + confirm/cancel)
  │   └── Výsledek: INSERT booking (status=pending, source=telegram_bot)
  ├── Conversation state: in-memory Map (chatId → step+data)
  │   └── Timeout: 15 min bez odpovědi → reset
  ├── Admin notifikace o novém TG bookingu
  └── Závisí na: TASK-F, TASK-C


FÁZE 4 — Cleanup + optimalizace
════════════════════════════════

  TASK-J: Odebrat Google Calendar integraci
  ├── Smazat lib/gcal.ts
  ├── Smazat app/api/gcal/ (auth, callback, disconnect)
  ├── Smazat GCal sekci z admin/rezervace (pokud zůstala)
  ├── Ponechat google_calendar_tokens tabulku (data migration — neumazávat)
  └── Závisí na: TASK-C (nový systém musí fungovat PŘED odebráním)

  TASK-K: Revenue dashboard (budoucí, volitelně)
  ├── Admin dashboard widget: tržby, top klienti, conversion
  └── Závisí na: TASK-E
```

### Závislostní graf

```
TASK-A ─────┬──► TASK-B ──► TASK-C ──┬──► TASK-D
            │                         │
            │                         ├──► TASK-E
            │                         │
            ├──► TASK-F ──► TASK-G    ├──► TASK-H
            │              │          │
            │              └──────────┘
            │
            └──► TASK-F ──► TASK-I
                            
                 TASK-C ──► TASK-J (po stabilizaci)
```

---

## 9. OTEVŘENÉ OTÁZKY PRO UŽIVATELE

1. **Klientské karty = čistě interní?** Klient se nikam nepřihlašuje, nemá account. Admin spravuje. Správně?

2. **Telegram bot jméno:** Uživatel musí vytvořit bota přes @BotFather. Navrhované: `@LovelyGirlsPrahaBot`. Uživatel dodá `TELEGRAM_BOT_TOKEN`.

3. **SMS gateway:** Pro automatické SMS (potvrzení) je potřeba placená služba (Twilio ~0.05€/SMS, SMSBrana.cz ~0.5 Kč/SMS). V první fázi stačí Telegram + manuální, nebo chce uživatel i SMS automatizaci?

4. **Adresy poboček:** Praha-2 (Vinohrady) má adresu v DB. Praha-3 a Praha-5 NE. Potřeba doplnit pro automatické odesílání.

5. **Pravidla potvrzení:** 
   - Noví klienti: VŽDY potvrzení 1h předem
   - Stálí (3+ návštěvy): BEZ potvrzení (ale admin může overridnout)
   - VIP: NIKDY potvrzení
   - Je tato logika správná?

6. **Google Calendar:** Odebrat kompletně, nebo ponechat jako zálohu/alternativu?

7. **Kdo může měnit booking status?**
   - Admin: vše
   - Manager: vše (má `managerCanSee` na rezervace)
   - Dívka: pouze "Dokončeno" na svých bookings
   - Správně?

8. **"Máme svoje kontakty které implementujeme"** — myslí uživatel kontaktní údaje (telefon, WhatsApp, Telegram handle), které se zobrazí na webu? Nebo seznam klientů k importu?

---

## 10. SOUBORY — KOMPLETNÍ PŘEHLED

### Nové soubory (14):
| Soubor | Účel |
|--------|------|
| `lib/client-actions.ts` | CRUD klientské karty |
| `lib/booking-actions.ts` | CRUD bookings + status flow |
| `lib/telegram.ts` | TG Bot API wrapper + handlers |
| `lib/telegram-booking.ts` | Konverzační booking state machine |
| `app/api/telegram/webhook/route.ts` | TG webhook endpoint |
| `app/api/telegram/setup/route.ts` | Admin: set webhook URL |
| `app/api/cron/booking-reminders/route.ts` | 1h potvrzení cron |
| `app/[locale]/(admin)/admin/klienti/page.tsx` | Seznam klientů |
| `app/[locale]/(admin)/admin/klienti/[id]/page.tsx` | Detail klienta |
| `app/[locale]/(admin)/admin/klienti/novy/page.tsx` | Nový klient form |
| `app/[locale]/(admin)/admin/rezervace/nova/page.tsx` | Nová rezervace form |
| `app/[locale]/studio/rezervace/page.tsx` | Bookings pro dívku |

### Upravené soubory (8):
| Soubor | Změna |
|--------|-------|
| `lib/db.ts` | Migrace: nové tabulky + ALTER bookings |
| `lib/queries.ts` | getBookings rozšíření, nové query funkce |
| `components/admin/AdminSidebar.tsx` | Nav: +Klienti |
| `app/[locale]/(admin)/admin/rezervace/page.tsx` | KOMPLETNÍ PŘEPIS (odebrat GCal, nový design) |
| `app/[locale]/studio/page.tsx` | +Dnešní rezervace sekce, +TG propojení |
| `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` | +TG link status |
| `vercel.json` | +cron: booking-reminders |
| `middleware.ts` | Případné route matching pro /admin/klienti |

### Smazané soubory (4, až ve fázi 4):
| Soubor | Důvod |
|--------|-------|
| `lib/gcal.ts` | Nahrazeno vlastním systémem |
| `app/api/gcal/auth/` | GCal OAuth nepotřebný |
| `app/api/gcal/callback/` | GCal OAuth nepotřebný |
| `app/api/gcal/disconnect/` | GCal OAuth nepotřebný |

---

## 11. BEZPEČNOST — ABSOLUTNÍ PRIORITA

> **"Potřebuju to udělat maximálně BEZPEČNÝ ABY SE DO TOHO NIKDO NEDOSTAL!"**
> Tato sekce je závazná pro VŠECHNY implementační tasky. Každý kód MUSÍ projít security checkem.

### 11.0 Audit stávající bezpečnosti

**Co je DOBRÉ (už existuje):**
- Session cookies: `httpOnly: true`, `secure: true` (prod), `sameSite: 'lax'` ✅
- Hesla: bcrypt cost 12 ✅
- Rate limiting auth: 5 pokusů / 15 min per IP ✅
- Session timeout: admin/manager 20 min, girl 72h ✅
- Sliding window session refresh pro admin ✅
- HMAC-signed session tokens (SHA-256) ✅
- Cron jobs: `Bearer ${CRON_SECRET}` auth ✅
- Admin/Studio X-Robots-Tag: noindex, nofollow ✅
- `requireAdmin()` / `requireGirl()` guards na stránkách ✅
- Server Actions (`'use server'`) — Next.js automaticky chrání proti CSRF ✅

**Co CHYBÍ (musíme přidat):**
- ❌ Žádné šifrování citlivých dat v DB (telefony, jména, adresy v plaintext)
- ❌ Žádné security headers (CSP, X-Frame-Options, HSTS, X-Content-Type)
- ❌ Žádný audit log kdo co viděl/změnil
- ❌ Žádné šifrování Telegram chat_id
- ❌ API routes (`/api/*`) nemají auth guards (pouze cron má `CRON_SECRET`)
- ❌ Žádný IP-based rate limit na API routes
- ❌ Žádné šifrované zálohy
- ❌ Middleware neblokuje přístup k `/admin` nebo `/studio` na route level

---

### 11.1 ŠIFROVÁNÍ DAT V DB (At-Rest Encryption)

**Princip:** Citlivá data v `clients` tabulce (jména, telefony, emaily, Telegram ID) se šifrují pomocí AES-256-GCM před zápisem do DB. Dešifrují se jen na serveru při čtení.

**Implementace — `lib/crypto.ts`:**

```typescript
// lib/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96 bits for GCM
const TAG_LENGTH = 16;  // 128 bits auth tag

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('[CRYPTO] ENCRYPTION_KEY must be set (min 32 chars). Generate: openssl rand -hex 32');
  }
  // Derive 256-bit key from env var via SHA-256
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();
  
  // Format: base64(iv + tag + ciphertext)
  // Prefixed with "enc:" so we know it's encrypted
  const combined = Buffer.concat([iv, tag, encrypted]);
  return 'enc:' + combined.toString('base64');
}

export function decrypt(data: string): string {
  if (!data.startsWith('enc:')) {
    // Not encrypted (legacy data) — return as-is
    return data;
  }
  
  const key = getKey();
  const combined = Buffer.from(data.slice(4), 'base64');
  
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// One-way hash for searchable fields (phone lookup without decryption)
export function hashForSearch(value: string): string {
  const salt = process.env.SEARCH_HASH_SALT ?? 'escx23-search-salt';
  return crypto.createHmac('sha256', salt).update(value.trim().toLowerCase()).digest('hex');
}
```

**Co se šifruje:**

| Tabulka | Sloupec | Šifrování | Poznámka |
|---------|---------|-----------|----------|
| `clients` | `name` | AES-256-GCM | Dešifruje se při zobrazení v admin |
| `clients` | `phone` | AES-256-GCM | + `phone_hash` (HMAC SHA-256) pro vyhledávání |
| `clients` | `email` | AES-256-GCM | Dešifruje se při zobrazení |
| `clients` | `telegram_chat_id` | AES-256-GCM | Dešifruje se jen při odesílání TG zprávy |
| `clients` | `telegram_username` | AES-256-GCM | |
| `clients` | `notes` | AES-256-GCM | Admin poznámky mohou být citlivé |
| `bookings` | `client_name` | AES-256-GCM | Legacy sloupec (nové bookings použijí client_id) |
| `bookings` | `client_phone` | AES-256-GCM | Legacy sloupec |
| `bookings` | `client_email` | AES-256-GCM | Legacy sloupec |
| `bookings` | `admin_notes` | AES-256-GCM | |
| `booking_log` | `details` | AES-256-GCM | Může obsahovat klientská data |
| `locations` | `address` | AES-256-GCM | Adresa se nesmí nikde leaknout |

**Co se NEŠIFRUJE** (potřeba pro SQL WHERE/JOIN/ORDER):
- `clients.id`, `clients.type`, `clients.total_visits`, `clients.requires_confirmation`
- `clients.phone_hash` — HMAC hash pro vyhledání dle telefonu (jednosměrný)
- `bookings.date`, `bookings.start_time`, `bookings.status`, `bookings.girl_id`, `bookings.client_id`

**Vyhledávání klienta dle telefonu (bez plaintext v DB):**
```typescript
// Admin zadá telefon → hashujeme → hledáme v phone_hash
const hash = hashForSearch('+420 733 855 355');
const result = await db.execute({
  sql: 'SELECT * FROM clients WHERE phone_hash = ?',
  args: [hash],
});
// Dešifrujeme při zobrazení:
const client = { ...row, name: decrypt(row.name), phone: decrypt(row.phone) };
```

**Env vars:**
```env
ENCRYPTION_KEY=a1b2c3d4e5f6...  # openssl rand -hex 32 → 64 hex chars
SEARCH_HASH_SALT=unique-random-salt-per-installation
```

**Key rotation:** Pokud se ENCRYPTION_KEY změní, existující data se nedešifrují. Proto:
1. Starý klíč ponechat jako `ENCRYPTION_KEY_OLD`
2. Migration script: decrypt s starým → encrypt s novým → UPDATE
3. Smazat `ENCRYPTION_KEY_OLD`

---

### 11.2 PŘÍSTUPOVÉ ÚROVNĚ (Authorization Matrix)

**Kdo vidí co — STRIKTNÍ PRAVIDLA:**

| Data | Admin | Manager | Dívka | TG Bot | Veřejný web |
|------|-------|---------|-------|--------|-------------|
| Klientská karta (jméno, telefon, email) | ✅ | ✅ | ❌ NIKDY | ❌ | ❌ |
| Klientova historie návštěv | ✅ | ✅ | ❌ | ❌ | ❌ |
| Klientovo hodnocení | ✅ | ✅ | Jen vlastní hodnocení | ❌ | ❌ |
| Booking detail (plný) | ✅ | ✅ | Jen své bookings | ❌ | ❌ |
| Booking detail (anonymizovaný) | — | — | ✅ (čas, program, lokace) | ❌ | ❌ |
| Adresa pobočky | ✅ | ✅ | ✅ (pracuje tam) | Jen po potvrzení | ❌ NIKDY |
| Audit log | ✅ | ❌ | ❌ | ❌ | ❌ |
| TG chat_id klienta | ✅ (hashed) | ❌ | ❌ | System only | ❌ |

**Implementace v kódu:**

```typescript
// lib/booking-actions.ts

export async function getBookingsForGirl(girlId: number) {
  // Dívka vidí POUZE své bookings, ANONYMIZOVANÉ
  const result = await db.execute({
    sql: `SELECT b.id, b.date, b.start_time, b.end_time, b.duration, 
            b.status, b.confirmation_status, b.location_id,
            pp.title_cs AS program_name, l.name AS location_name
          FROM bookings b
          LEFT JOIN pricing_plans pp ON pp.id = b.program_id
          LEFT JOIN locations l ON l.id = b.location_id
          WHERE b.girl_id = ? AND b.date >= date('now', '-30 days')
          ORDER BY b.date DESC, b.start_time DESC`,
    args: [girlId],
  });
  // POZOR: Žádné client_name, client_phone, client_id, notes!
  return result.rows.map(r => ({
    id: Number(r.id),
    date: String(r.date),
    startTime: String(r.start_time),
    endTime: String(r.end_time),
    duration: Number(r.duration),
    status: String(r.status),
    confirmationStatus: String(r.confirmation_status),
    programName: r.program_name ? String(r.program_name) : null,
    locationName: r.location_name ? String(r.location_name) : null,
  }));
}
```

**Každá stránka MUSÍ mít guard:**

```typescript
// /admin/klienti/page.tsx
export default async function AdminKlientiPage() {
  await requireAdmin();  // NIKDY requireGirl nebo bez auth
  // ...
}

// /studio/rezervace/page.tsx
export default async function StudioRezervacePage() {
  const user = await requireGirl();  // NIKDY requireAdmin
  const bookings = await getBookingsForGirl(user.girl_id!);
  // ↑ Dostane POUZE své bookings, ANONYMIZOVANÉ
}
```

---

### 11.3 TELEGRAM BOT SECURITY

**A) Webhook ověření:**

```typescript
// app/api/telegram/webhook/route.ts
export async function POST(request: Request) {
  // 1. Ověřit Telegram secret token
  const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Rate limit per chat_id (max 30 requests/min)
  const body = await request.json();
  const chatId = body?.message?.chat?.id ?? body?.callback_query?.message?.chat?.id;
  if (chatId && !checkTelegramRateLimit(String(chatId))) {
    return new Response('Too Many Requests', { status: 429 });
  }

  // 3. Validace payload structure
  if (!body || typeof body !== 'object') {
    return new Response('Bad Request', { status: 400 });
  }

  // 4. Process
  await handleUpdate(body);
  return new Response('OK', { status: 200 });
}
```

**B) Deep link token ověření (propojení dívek):**

```typescript
// lib/telegram.ts
export function generateLinkToken(girlId: number): string {
  const secret = process.env.TELEGRAM_LINK_SECRET;
  if (!secret) throw new Error('TELEGRAM_LINK_SECRET not set');
  // Token platí 24 hodin
  const expiry = Math.floor(Date.now() / 1000) + 86400;
  const payload = `${girlId}.${expiry}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
  return `${payload}.${hmac}`;
}

export function verifyLinkToken(girlId: number, token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [tokenGirlId, expiry, hmac] = parts;
  
  // Check girl_id match
  if (Number(tokenGirlId) !== girlId) return false;
  
  // Check expiry
  if (Number(expiry) < Math.floor(Date.now() / 1000)) return false;
  
  // Verify HMAC
  const secret = process.env.TELEGRAM_LINK_SECRET!;
  const expected = crypto.createHmac('sha256', secret)
    .update(`${tokenGirlId}.${expiry}`).digest('hex').slice(0, 16);
  
  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(expected, 'hex')
  );
}
```

**C) Co bot NIKDY neodešle:**
- Klientovo celé jméno (max křestní: "Martin")
- Telefonní číslo klienta
- Email klienta
- Adresu bydliště klienta
- Platební detaily
- Seznam služeb (jen název programu)
- Interní poznámky admina

**D) Co bot SMÍŽE odeslat:**
- Dívce: datum, čas, program, pobočka (potřebuje pro práci)
- Klientovi: potvrzení času, adresa pobočky (po potvrzení bookingu), reminder
- Adminovi: nový booking request, no-show alert

**E) Telegram rate limiting:**

```typescript
// In-memory rate limiter (per chat_id)
const telegramLimits = new Map<string, { count: number; resetAt: number }>();
const TG_RATE_LIMIT = 30;      // max requests
const TG_RATE_WINDOW = 60_000; // per minute

function checkTelegramRateLimit(chatId: string): boolean {
  const now = Date.now();
  const entry = telegramLimits.get(chatId);
  if (!entry || now > entry.resetAt) {
    telegramLimits.set(chatId, { count: 1, resetAt: now + TG_RATE_WINDOW });
    return true;
  }
  if (entry.count >= TG_RATE_LIMIT) return false;
  entry.count++;
  return true;
}
```

---

### 11.4 ADRESA — NIKDY VEŘEJNĚ

**Pravidla pro `locations.address`:**

1. **Adresa je ŠIFROVANÁ v DB** (AES-256-GCM)
2. **Veřejný web NIKDY neukazuje adresu** — pouze "Praha 2 · Vinohrady" (district)
3. **Profil dívky** — text "Adresu obdržíte po potvrzení termínu" (už v mockupu)
4. **Admin panel** — dešifruje a zobrazí adresu (za auth guardem)
5. **Studio** — dívka vidí adresu své pobočky (pracuje tam)
6. **Telegram bot** — pošle adresu POUZE:
   - Po `bookings.status = 'confirmed'`
   - Admin explicitně klikne "Poslat adresu"
   - NIKDY automaticky před potvrzením

**Implementace:**

```typescript
// lib/queries.ts — veřejná query NIKDY nevrací address
export async function getPublicLocations() {
  return db.execute(`
    SELECT id, name, display_name, district, description, 
           features_text, hours_text
    FROM locations WHERE is_active = 1
    ORDER BY display_order
  `);
  // ↑ POZOR: žádný address sloupec!
}

// lib/booking-actions.ts — admin-only
export async function getLocationAddress(locationId: number): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    throw new Error('Unauthorized');
  }
  const result = await db.execute({
    sql: 'SELECT address FROM locations WHERE id = ?',
    args: [locationId],
  });
  const raw = result.rows[0]?.address;
  return raw ? decrypt(String(raw)) : null;
}
```

---

### 11.5 API ROUTES OCHRANA

**A) Všechny `/api/*` booking/client routes za autentizací:**

```typescript
// Pattern pro všechny admin API routes:
export async function POST(request: Request) {
  // 1. Auth check
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 2. Rate limit per user
  if (!checkApiRateLimit(`user:${user.id}`, 60, 60_000)) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  // 3. Validate request body
  // ...
}
```

**B) Telegram webhook — speciální auth (viz 11.3).**

**C) Cron routes — existující `CRON_SECRET` pattern** (zachovat).

**D) Rate limiting pro API:**

```typescript
// lib/rate-limit.ts
const apiLimits = new Map<string, { count: number; resetAt: number }>();

export function checkApiRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = apiLimits.get(key);
  if (!entry || now > entry.resetAt) {
    apiLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
```

**E) CSRF ochrana:**
- Next.js Server Actions mají automatickou CSRF ochranu (origin check) ✅
- Pro API routes (POST /api/telegram/webhook) — CSRF není relevantní (Telegram webhook nemá origin)
- Pro případné REST API routes — přidat origin check:

```typescript
function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  const allowed = ['https://www.lovelygirls.cz', 'http://localhost:3000'];
  return allowed.some(a => origin.startsWith(a));
}
```

---

### 11.6 AUDIT LOG — KDO KDY CO

**Každá operace s klientskými daty se loguje:**

```sql
-- Rozšířit existující booking_log nebo vytvořit dedikovaný security audit
CREATE TABLE IF NOT EXISTS security_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_role TEXT,
  action TEXT NOT NULL,
  -- Akce: 'client_viewed', 'client_created', 'client_updated', 
  --       'client_deleted', 'booking_created', 'booking_updated',
  --       'address_viewed', 'address_sent', 'client_exported',
  --       'login_success', 'login_failed', 'session_expired'
  entity_type TEXT,           -- 'client', 'booking', 'location', 'session'
  entity_id INTEGER,
  ip_hash TEXT,               -- SHA-256 hash IP adresy (GDPR compliant)
  user_agent TEXT,
  details TEXT,               -- šifrované JSON s detaily změny
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON security_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON security_audit_log(created_at);
```

**Implementace — `lib/audit.ts`:**

```typescript
import { headers } from 'next/headers';
import { db } from './db';
import { encrypt } from './crypto';
import crypto from 'crypto';

export async function auditLog(
  userId: number | null,
  userRole: string | null,
  action: string,
  entityType: string,
  entityId: number | null,
  details?: Record<string, unknown>
) {
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
  const ua = hdrs.get('user-agent') ?? '';
  
  const encryptedDetails = details ? encrypt(JSON.stringify(details)) : null;
  
  await db.execute({
    sql: `INSERT INTO security_audit_log 
          (user_id, user_role, action, entity_type, entity_id, ip_hash, user_agent, details) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [userId, userRole, action, entityType, entityId, ipHash, ua, encryptedDetails],
  });
}
```

**Co se loguje:**

| Akce | Kdy | Detaily |
|------|-----|---------|
| `client_viewed` | Admin otevře detail klienta | `{ clientId }` |
| `client_created` | Nový klient vytvořen | `{ clientId, createdBy }` |
| `client_updated` | Změna klientských dat | `{ clientId, changedFields: [...] }` |
| `client_search` | Admin hledá klienta | `{ searchQuery: "hash of query" }` |
| `booking_created` | Nový booking | `{ bookingId, girlId, clientId }` |
| `booking_status_changed` | Změna statusu | `{ bookingId, from, to }` |
| `address_viewed` | Admin zobrazí adresu | `{ locationId }` |
| `address_sent` | Adresa odeslána klientovi | `{ bookingId, via: 'telegram'/'manual' }` |
| `login_success` | Úspěšný login | `{ email: "hash" }` |
| `login_failed` | Neúspěšný login | `{ email: "hash", reason }` |

**Admin UI — `/admin/audit`:**
- Searchable tabulka: datum, uživatel, akce, entita
- Filtry: uživatel, typ akce, datum rozsah
- Read-only (nikdo nesmí mazat audit log)
- Přístup: POUZE `requireFullAdmin()` (admin, NE manager)

---

### 11.7 ŽÁDNÉ CLIENT-SIDE LEAKY

**Pravidla:**

1. **Všechny booking/client stránky jsou Server Components** — žádný `'use client'`
2. **Citlivá data se NIKDY nepředávají do client komponent** jako props
3. **Žádné API routes vracející client data do browseru** — data se renderují server-side
4. **`searchParams` nemají citlivá data** — žádné `?phone=+420...` nebo `?clientId=5`
5. **Next.js RSC payload** — Server Components serializují data do HTML, ne do JS bundlu ✅

**Anti-pattern (ZAKÁZÁNO):**

```typescript
// ❌ NIKDY — client komponenta s citlivými daty
'use client';
export default function ClientCard({ phone, email }: { phone: string; email: string }) {
  // → phone a email se dostanou do JS bundlu!
}
```

**Správný pattern:**

```typescript
// ✅ Server Component — data zůstanou na serveru
export default async function ClientDetailPage() {
  await requireAdmin();
  const client = await getClient(id);
  const decrypted = { ...client, name: decrypt(client.name), phone: decrypt(client.phone) };
  
  return (
    <div>
      <p>{decrypted.name}</p>  {/* renderováno do HTML na serveru */}
      <p>{decrypted.phone}</p> {/* nikdy v JS bundlu */}
    </div>
  );
}
```

**Pokud je `'use client'` NEZBYTNÝ** (např. inline formulář pro editaci):
- Předat POUZE ID, nikdy citlivá data
- Client komponenta fetchne data přes Server Action (ne API route)
- Server Action ověří auth UVNITŘ

---

### 11.8 SESSION SECURITY — ROZŠÍŘENÍ

**Stávající stav je dobrý, doplníme:**

**A) Session invalidation při změně role:**
```typescript
// Pokud admin změní girl.status na 'archived' → invalidovat její session
// Implementace: přidat 'invalidated_at' do users tabulky
// Token verify: pokud user.invalidated_at > token.created_at → reject
```

**B) Concurrent session limit:**
- Admin/Manager: max 1 aktivní session (nový login zneplatní starý)
- Girl: max 2 (telefon + desktop)

**C) Session token binding:**
```typescript
// Přidat IP hash do session tokenu (volitelné, může breaknout při IP změně)
// Alternativa: user-agent binding (méně striktní)
function createToken(userId: number, role: string, maxAge: number, ua: string): string {
  const exp = Date.now() + maxAge * 1000;
  const uaHash = crypto.createHash('sha256').update(ua).digest('hex').slice(0, 8);
  const payload = `${userId}.${role}.${exp}.${uaHash}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}
```

**D) Forced re-auth pro citlivé operace:**
```typescript
// Při mazání klienta, exportu dat, změně ENCRYPTION_KEY:
// Požadovat zadání hesla znovu (i když je admin přihlášen)
export async function requireReAuth(userId: number, password: string): Promise<boolean> {
  const user = await db.execute({
    sql: 'SELECT password_hash FROM users WHERE id = ?',
    args: [userId],
  });
  if (!user.rows[0]) return false;
  return verifyPassword(password, String(user.rows[0].password_hash));
}
```

---

### 11.9 SECURITY HEADERS

**Přidat do `next.config.ts` → `headers()`:**

```typescript
async headers() {
  return [
    // Global security headers
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { 
          key: 'Strict-Transport-Security', 
          value: 'max-age=63072000; includeSubDomains; preload' 
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://analytics.ahrefs.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://images.unsplash.com",
            "connect-src 'self' https://www.google-analytics.com https://analytics.ahrefs.com",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
    // Admin/Studio — extra strict
    {
      source: '/:locale/admin/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      ],
    },
    {
      source: '/:locale/studio/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      ],
    },
    // API — no cache, no embed
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ];
},
```

---

### 11.10 BACKUP & RECOVERY

**A) Šifrovaná záloha DB:**

```typescript
// app/api/cron/backup-db/route.ts
// Cron: denně v 03:30 Prague time

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 1. Export DB dump
  // Turso: use Turso API to create a checkpoint/backup
  // Local SQLite: fs.copyFile

  // 2. Encrypt backup file with separate BACKUP_ENCRYPTION_KEY
  // (different from ENCRYPTION_KEY — defense in depth)

  // 3. Upload to Vercel Blob (or S3)
  // Path: backups/escx23-{YYYY-MM-DD-HHmm}.db.enc

  // 4. Delete backups older than 30 days

  // 5. Log to audit: 'backup_created'
}
```

**B) Key management:**
```env
ENCRYPTION_KEY=...           # pro data v DB (šifrování klientů)
SEARCH_HASH_SALT=...         # pro phone_hash (vyhledávání)
BACKUP_ENCRYPTION_KEY=...    # pro zálohy (jiný klíč!)
SESSION_SECRET=...           # pro session tokeny
TELEGRAM_WEBHOOK_SECRET=...  # pro TG webhook ověření
TELEGRAM_LINK_SECRET=...     # pro deep link HMAC
CRON_SECRET=...              # pro cron auth
```

**7 tajných klíčů** — VŠECHNY v Vercel env vars, ŽÁDNÝ v kódu nebo .env souboru na GitHubu.

**C) Disaster recovery:**
1. Nový deploy z Gitu
2. Nastavit env vars
3. Restore DB z poslední šifrované zálohy
4. Verify: admin login funguje

---

### 11.11 NOVÝ IMPLEMENTAČNÍ TASK: SECURITY (priorita 0)

```
TASK-SECURITY: Bezpečnostní základ (PŘED všemi ostatními tasky)
═══════════════════════════════════════════════════════════════

  TASK-S1: lib/crypto.ts — encrypt/decrypt/hashForSearch
  ├── AES-256-GCM šifrování
  ├── HMAC search hashing  
  ├── Unit testy (encrypt → decrypt roundtrip, tamper detection)
  └── Effort: Malý

  TASK-S2: lib/audit.ts — security audit logging
  ├── CREATE TABLE security_audit_log (v db.ts migracích)
  ├── auditLog() funkce
  ├── Admin UI: /admin/audit (read-only, requireFullAdmin)
  └── Effort: Malý

  TASK-S3: lib/rate-limit.ts — API rate limiter
  ├── checkApiRateLimit() 
  ├── checkTelegramRateLimit()
  └── Effort: Malý

  TASK-S4: Security headers
  ├── next.config.ts → headers()
  ├── CSP, HSTS, X-Frame-Options, X-Content-Type-Options
  ├── Cache-Control: no-store pro admin/studio/api
  └── Effort: Malý

  TASK-S5: Session rozšíření
  ├── Concurrent session limit
  ├── UA binding (volitelné)
  ├── Re-auth pro citlivé operace
  └── Effort: Střední

  → TASK-S1-S4 MUSÍ být hotové PŘED TASK-A (DB migrace pro booking)
  → TASK-S5 může být paralelně s TASK-B/C
```

**Aktualizovaný dependency graf:**

```
TASK-S1 ──┐
TASK-S2 ──┤
TASK-S3 ──┼──► TASK-A ──► TASK-B ──► TASK-C ──► ...
TASK-S4 ──┘                │
                           └──► TASK-F ──► ...
TASK-S5 ────────────────────────── (paralelně)
```

---

### 11.12 SECURITY CHECKLIST (pro code review)

Každý PR dotýkající se booking/client/telegram kódu MUSÍ projít tímto checklistem:

- [ ] Citlivá data (jméno, telefon, email, adresa, TG chat_id) jsou šifrovaná při zápisu do DB
- [ ] Žádná citlivá data v URL parametrech (?phone=, ?email=)
- [ ] Stránka má správný auth guard (requireAdmin/requireGirl/requireFullAdmin)
- [ ] Dívka NEVIDÍ klientská data (jméno, telefon, email, historii)
- [ ] Adresa se neobjevuje v žádném veřejném endpointu
- [ ] Server Component (ne 'use client') pro stránky s citlivými daty
- [ ] API route má auth check + rate limiting
- [ ] Operace je zalogována v audit logu
- [ ] Žádný console.log s citlivými daty (ani v dev mode)
- [ ] SQL queries používají parametrizované dotazy (žádný string concat)
- [ ] Telegram zprávy neobsahují klientské PII (viz 11.3.C)
- [ ] Error messages neodhalují interní strukturu (žádné stack traces v response)
