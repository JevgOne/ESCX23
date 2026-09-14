# FINÁLNÍ PLÁN: Interní Booking Systém + Klientské Karty + Telegram Bot

> Nahrazuje Google Calendar. Vlastní booking flow, klientská databáze, Telegram bot.
> Bezpečnost je absolutní priorita.

---

## KLÍČOVÝ KONTEXT: Operátorka = Centrální Hub

**Dívky inzerují na různých externích platformách** (ne jen na webu) a všude uvádí JEDNO telefonní číslo operátorky. Klienti přicházejí z těchto platforem — volají, píšou SMS, píšou přes chat platformy.

**Důsledky pro architekturu:**

| Fakt | Důsledek |
|------|----------|
| Klienti nepřichází přes web | Žádný online booking formulář na webu, žádný web chat widget |
| Operátorka = centrální hub | VŠECHNY rezervace jdou přes operátorku → ona zadává do admin panelu |
| Web = prezentace | Web slouží k prezentaci dívek, cen, recenzí — NE jako vstupní kanál pro booking |
| Jedno číslo | Operátorka přijímá hovory/SMS/WA z různých platforem → rozlišení source per booking |
| TG bot = jen stálí | Telegram bot je výhradně pro STÁLÉ klienty kteří už mají kontakt a dostanou link od operátorky |

**Flow nového klienta:**
```
Klient vidí inzerát na platformě
    → Zavolá/napíše na číslo operátorky
    → Operátorka domluví rezervaci po telefonu/SMS/WA
    → Operátorka zadá booking do admin panelu (source: phone/sms/whatsapp)
    → Systém vytvoří klientskou kartu (KLIENT1309)
    → Po 3+ návštěvách: operátorka nabídne TG bota pro rychlejší booking
```

**Flow stálého klienta (s TG botem):**
```
Stálý klient má link na TG bota (dostal od operátorky)
    → Pošle booking request přes bota
    → Admin panel: nový booking (source: telegram_bot, status: pending)
    → Operátorka schválí/odmítne v admin panelu
    → Bot pošle potvrzení + adresu
```

---

## 0. RESEARCH — Co dělají profesionální booking systémy

### Analyzované systémy

| Systém | Klíčové features pro nás | Co převzít |
|--------|--------------------------|------------|
| **Fresha** (4.8/5, leader beauty/wellness) | Multi-staff calendar grid, drag-to-reschedule, client cards s historií, automated reminders, no-show tracking | Calendar grid layout, client card UX, no-show counter |
| **Booksy** (35M+ users) | Per-staff calendar view, buffer times, recurring appointments, mobilní booking, client reminders | Buffer time koncept (15min mezi bookings), mobile-first UX |
| **SimplyBook.me** | Customizable booking widget, memberships, service packages, multi-payment gateway | Booking source tracking (web/phone/TG), service packages |
| **Calendly** | Collective scheduling (overlay calendars), real-time availability, auto timezone | Calendar overlay (všechny dívky v jednom view), availability detection |
| **Reservio** | Daily/weekly/monthly views, client database, SMS reminders, analytics | View switching, revenue analytics |

### Klíčové UX principy (z výzkumu)

1. **Unified calendar view** — admin vidí VŠECHNY dívky v jednom gridu (ne oddělené dashboardy)
2. **Day + Week toggle** — day view pro detailní scheduling, week view pro přehled vytížení
3. **Color-coded sources** — telefonická vs. Telegram vs. WhatsApp rezervace odlišené barvou/ikonou
4. **Drag-to-reschedule** — přesun bookingu přetažením (client JS, fáze 2)
5. **Collision detection** — systém BLOKUJE překrývající se bookings automaticky
6. **Client card popup** — při vytváření bookingu hned vidíš historii klienta
7. **Smart defaults** — předvyplnit pobočku dle rozvrhu dívky, cenu dle programu + denní/noční

### PWA pro mobilní přístup

Implementace přes Next.js PWA (manifest.json + service worker):
- `next.config.ts` + `public/manifest.json` + `public/sw.js`
- Installable na home screen (iOS 16.4+, Android)
- Push notifications přes Web Push API (VAPID keys) NEBO Telegram (jednodušší, fáze 1)
- Fáze 1: Telegram notifikace (0 infrastruktury navíc)
- Fáze 2: PWA + Web Push pro admin/manager (native-like experience)

---

## 1. MAPOVÁNÍ 23 POŽADAVKŮ → IMPLEMENTACE

| # | Požadavek | Řešení | Task |
|---|-----------|--------|------|
| 1 | Interní systém BEZ Google Calendar | Vlastní booking CRUD v admin panelu, GCal odebrat | C, J |
| 2 | Klientské karty — POUZE stálí, trust verification, prioritní systém | `clients` tabulka, type: new/regular/vip, NO blacklist ale "nedůvěryhodný" | B |
| 3 | KLIENT1309 pojmenování (datum prvního kontaktu) | `client_code` sloupec = `KLIENT` + datum (DDMM) prvního kontaktu, auto-generovaný | A, B |
| 4 | Nepřišel counter — po 3× nemá prioritu ale dostane šanci | `no_show_count` na clients, po 3× automaticky `requires_confirmation = 1` + warning badge, ALE neblokuje | B, E |
| 5 | Telegram bot — POUZE stálí klienti, jeden kanál | Bot aktivní jen pro `type = 'regular'` nebo `'vip'`, jeden @LovelyGirlsPrahaBot | F, I |
| 6 | Noví klienti → telefon, operátor zadá ručně | Admin panel formulář, `source = 'phone'/'sms'/'whatsapp'` | C |
| 7 | Potvrzovací zpráva: jméno slečny + datum + čas | TG bot message po confirmed: "Nika · 14.9. · 16:00" | G, H |
| 8 | Reminder 1h před automaticky přes bota | Cron job každých 10 min, check bookings 50-70 min ahead | H |
| 9 | Dvoustupňová adresa: městská část při booking → přesná po potvrzení | Krok 1: `district_sent` (Praha 2), Krok 2: `address_sent` (Legerova 42) až po confirmed | C |
| 10 | Každá dívka = vlastní kalendář | `girl_id` FK na bookings, filtr per girl v admin | C |
| 11 | Operátor/admin vidí VŠECHNY, dívka jen svůj | Auth matrix: admin/manager = vše, girl = jen své (anonymizované) | C, D |
| 12 | Google Calendar style view — overlay/grid | Multi-staff day grid: Y-osa = čas (10:00-22:30), X-osa = dívky | C |
| 13 | PWA pro mobilní přístup | manifest.json + service worker, installable na home screen | K |
| 14 | Push notifikace (přes TG) — POUZE dívkám se směnou | Check `girl_schedules` + `today_overrides` před odesláním TG zprávy | G |
| 15 | Provázané s rozvrhem — rezervace jen do směny | Validace: `booking.start_time` BETWEEN `schedule.start` AND `schedule.end` | C |
| 16 | Operátor vidí jen dostupné dívky pro daný čas | Formulář: po výběru data+času → filtruje dívky s aktivní směnou | C |
| 17 | Real-time: booking okamžitě vidět + pípnutí | SSR refresh (fáze 1), Server-Sent Events (fáze 2), audio ping | C |
| 18 | Rozlišení telefonická vs online (TG) — jiná barva/ikona | `source` sloupec na bookings + CSS třídy per source | C |
| 19 | Operátor schválí/odmítne/přesune jedním klikem | Quick action buttons na booking řádku | C |
| 20 | Přechodné období: telefon + TG paralelně | Oba kanály fungují od začátku, `source` tracking | C, I |
| 21 | Jednoduché pro operátora — minimální klikání | Max 4 kliky pro nový booking (klient→dívka→čas→program→uložit) | C |
| 22 | MAXIMÁLNÍ BEZPEČNOST | AES-256-GCM, audit log, auth matrix, security headers, rate limiting | S1-S5 |
| 23 | Pokoj se vybírá per rezervace (ne na kartě) | `room` sloupec na bookings (ne na clients), select v booking formuláři | A, C |
| 24 | Rejection flag — dívka odmítá klienta (interní, NIKDY viditelné klientovi) | `client_girl_rejections` tabulka, warning v booking formuláři, operátorka řekne "má plno" | B, C |
| 25 | Nebrat (ban) — kompletní zákaz obsluhy | `type = 'banned'` na klientské kartě, BLOCK při vytváření bookingu | B |
| 26 | 2 směny za den (ranní + odpolední) | `shift_1_*` + `shift_2_*` nebo 2 řádky v availability | A |
| 27 | Bodový systém rezervací | 30min=800b, 45min=900b, 60min=1000b. Body per dívka (týdně/měsíčně), body na klientské kartě, body v týdenním přehledu | C, D |
| 28 | Nový klient max 60 min | `type='new'` + `program.duration > 60` → BLOKOVAT. Operátorka vidí warning "Nový klient — max 60 min". 90/120 min jen pro regular/VIP | C |
| 29 | Denní bodový cíl 4 500b per dívka | Progress bar v day view (aktuální vs cíl), zelená/červená v week view per den per dívka, X/Y splněno v total sloupci | C, D |
| 30 | Buffer 15 min mezi rezervacemi | Povinný, systém BLOKUJE booking pokud `prev_booking.end_time + 15min > new_booking.start_time`. Validace server-side + vizuální indikátor v gridu | C |
| 31 | Telegram bot vícejazyčný (CS/EN/DE/UK) | Bot detekuje jazyk klienta (Telegram language_code) nebo se zeptá. Texty přes next-intl JSON soubory. Shodné locale jako web | F, I |
| 32 | Druhý admin účet (zástup operátorky) | Auth matrix: role `admin` + `manager` — oba plný přístup, audit log rozlišuje kdo. Min. 2 admin účty | S3 |
| 33 | Denní report automaticky přes TG | Cron 22:00 — shrnutí dne: počet bookingů, body per dívka, plnění cíle, no-shows. TG zpráva adminovi | H |

### Nízká priorita / Nice to have

| Co | Status |
|----|--------|
| Opakovaná rezervace (recurring booking) | Nízká priorita, implementovat po MVP |
| Storno pravidla (cancellation policy) | Dořešíme později — zatím jen manuální storno |

### Explicitně NEŘEŠÍME

| Co | Proč |
|----|------|
| Platba v systému | Klient platí hotově/kartou na místě, systém neřeší platební gateway |

### Explicitně OUT OF SCOPE

| Co | Proč |
|----|------|
| Online booking formulář na webu | Klienti přicházejí z externích platforem, ne z webu |
| Web chat widget / live chat | Operátorka komunikuje přes telefon/SMS/WA, ne přes web |
| Veřejné API pro external bookings | Vše jde přes operátorku |
| Klientský login / self-service portál | Klient nemá přístup do systému |
| Integrace s externími platformami | Operátorka je bridge — ručně zadává do admin panelu |

---

## 2. DB SCHEMA

### 2.1 `clients` — Klientské karty

```sql
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identita (šifrované AES-256-GCM)
  client_code TEXT NOT NULL UNIQUE,              -- "KLIENT1309" (datum prvního kontaktu)
  name TEXT NOT NULL,                             -- enc: zobrazované jméno
  phone TEXT,                                     -- enc: +420...
  phone_hash TEXT,                                -- HMAC SHA-256 pro vyhledávání
  email TEXT,                                     -- enc: volitelný
  
  -- Telegram (pouze stálí/VIP)
  telegram_chat_id TEXT,                          -- enc: z TG bota
  telegram_username TEXT,                         -- enc: @username
  
  -- Typ klienta
  type TEXT DEFAULT 'new' 
    CHECK(type IN ('new', 'regular', 'vip', 'untrusted', 'banned')),
  --   new         = první/druhá návštěva
  --   regular     = 3+ dokončených (auto-upgrade)
  --   vip         = admin rozhodne (ruční)
  --   untrusted   = problémy (ne blacklist — dostane šanci pokud nikdo nechce slot)
  --   banned      = kompletní zákaz ("nebrat") — BLOCK při vytváření bookingu
  
  -- Preference
  preferred_girl_ids TEXT,                        -- JSON: [25, 31]
  notes TEXT,                                     -- enc: interní poznámky admina
  
  -- Pravidla
  requires_confirmation INTEGER DEFAULT 1,        -- 1=ano, 0=ne
  
  -- Statistiky
  total_visits INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  avg_rating INTEGER DEFAULT 0,                   -- 1-5, 0=nehodnoceno
  last_visit_at TEXT,
  first_visit_at TEXT,
  no_show_count INTEGER DEFAULT 0,
  cancellation_count INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_phone_hash ON clients(phone_hash);
CREATE INDEX IF NOT EXISTS idx_clients_telegram ON clients(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
```

**KLIENT1309 generování:**
```typescript
function generateClientCode(firstContactDate: Date): string {
  const dd = String(firstContactDate.getDate()).padStart(2, '0');
  const mm = String(firstContactDate.getMonth() + 1).padStart(2, '0');
  return `KLIENT${dd}${mm}`;
}
// Kolize: pokud existuje KLIENT1309 → KLIENT1309B, KLIENT1309C...
```

### 2.2 `client_ratings` — Hodnocení klientů

```sql
CREATE TABLE IF NOT EXISTS client_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  girl_id INTEGER NOT NULL,
  booking_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  note TEXT,                                      -- enc: "Přišel pozdě"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (girl_id) REFERENCES girls(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

### 2.3 ALTER TABLE `bookings`

```sql
ALTER TABLE bookings ADD COLUMN client_id INTEGER REFERENCES clients(id);
ALTER TABLE bookings ADD COLUMN program_id INTEGER REFERENCES pricing_plans(id);
ALTER TABLE bookings ADD COLUMN location_id INTEGER REFERENCES locations(id);
ALTER TABLE bookings ADD COLUMN room TEXT;                     -- pokoj per rezervace (#23)

ALTER TABLE bookings ADD COLUMN confirmation_status TEXT DEFAULT 'not_required'
  CHECK(confirmation_status IN ('not_required','pending','confirmed','declined','no_response'));
ALTER TABLE bookings ADD COLUMN confirmation_sent_at DATETIME;
ALTER TABLE bookings ADD COLUMN confirmation_responded_at DATETIME;

ALTER TABLE bookings ADD COLUMN district_sent INTEGER DEFAULT 0;   -- Krok 1: městská část odeslána
ALTER TABLE bookings ADD COLUMN district_sent_at DATETIME;
ALTER TABLE bookings ADD COLUMN address_sent INTEGER DEFAULT 0;    -- Krok 2: přesná adresa odeslána
ALTER TABLE bookings ADD COLUMN address_sent_at DATETIME;
ALTER TABLE bookings ADD COLUMN address_sent_via TEXT;

ALTER TABLE bookings ADD COLUMN source TEXT DEFAULT 'admin'
  CHECK(source IN ('admin','telegram_bot','phone','sms','whatsapp'));
ALTER TABLE bookings ADD COLUMN cancelled_reason TEXT;
ALTER TABLE bookings ADD COLUMN admin_notes TEXT;              -- enc
ALTER TABLE bookings ADD COLUMN girl_rating INTEGER;

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_girl_date ON bookings(girl_id, date);
```

### 2.3.1 Bodový systém (#27)

Body se nepočítají ve sloupci — odvozují se z `program_id` (trvání programu).

**Mapování:**

| Program (min) | Body |
|---------------|------|
| 30 | 800 |
| 45 | 900 |
| 60 | 1 000 |

> Body nad 60 min (90, 120) — TBD, zatím se používá 1 000.

**Výpočet (SQL view nebo app-level):**

```sql
-- Příklad: body per dívka za týden
SELECT
  g.name AS girl_name,
  COUNT(b.id) AS booking_count,
  SUM(CASE
    WHEN pp.duration = 30 THEN 800
    WHEN pp.duration = 45 THEN 900
    ELSE 1000
  END) AS total_points
FROM bookings b
JOIN girls g ON g.id = b.girl_id
JOIN pricing_plans pp ON pp.id = b.program_id
WHERE b.status = 'completed'
  AND b.date BETWEEN :week_start AND :week_end
GROUP BY g.id;
```

**Kde se body zobrazují:**

| Místo | Co se ukazuje |
|-------|---------------|
| Týdenní kalendář (02-calendar-week) | Body na každém mini-bookingu + součet per dívka + denní součty + týdenní total |
| Klientská karta (04-client-card) | Celkové body klienta za všechny návštěvy (stat card + per řádek historie) |
| Dashboard (plánovaný) | Týdenní/měsíční body per dívka, ranking |

**Denní cíl (#29):**

Každá dívka musí udělat MIN **4 500 bodů za den** (= cca 5× 60min nebo 5× 45min + 1× 30min).

| View | Vizualizace |
|------|-------------|
| Day view (01) | Progress bar pod hlavičkou dívky: `[aktuální / 4 500]`, fill zelená (>=4500) nebo červená (<4500), žlutá značka na 100% |
| Week view (02) | Malý badge v levém dolním rohu day-cell: číslo bodů, zelená/červená podle splnění. V total sloupci: `X/Y cíl` (kolik dní splněno z pracovních) |
| Dashboard | Celkový přehled: % splnění per dívka za týden/měsíc |

```sql
-- Kontrola denního cíle
SELECT
  g.name,
  b.date,
  SUM(CASE WHEN pp.duration = 30 THEN 800 WHEN pp.duration = 45 THEN 900 ELSE 1000 END) AS day_points,
  CASE WHEN SUM(CASE WHEN pp.duration = 30 THEN 800 WHEN pp.duration = 45 THEN 900 ELSE 1000 END) >= 4500
    THEN 'MET' ELSE 'MISS' END AS goal_status
FROM bookings b
JOIN girls g ON g.id = b.girl_id
JOIN pricing_plans pp ON pp.id = b.program_id
WHERE b.status = 'completed'
GROUP BY g.id, b.date;
```

### 2.4 `telegram_links` — Propojení dívek s TG

```sql
CREATE TABLE IF NOT EXISTS telegram_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,                          -- enc
  username TEXT,                                   -- enc
  is_active INTEGER DEFAULT 1,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
);
```

### 2.5 `booking_log` — Audit trail

```sql
CREATE TABLE IF NOT EXISTS booking_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT,                                    -- enc JSON
  performed_by TEXT,                               -- 'admin:1', 'telegram_bot', 'cron'
  channel TEXT,                                    -- 'admin_panel', 'telegram', 'system'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

### 2.6 `security_audit_log` — Bezpečnostní audit

```sql
CREATE TABLE IF NOT EXISTS security_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  ip_hash TEXT,
  user_agent TEXT,
  details TEXT,                                    -- enc JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.7 `client_girl_rejections` — Rejection flag (#24)

```sql
CREATE TABLE IF NOT EXISTS client_girl_rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  girl_id INTEGER NOT NULL,
  reason TEXT,                                     -- enc: důvod odmítnutí (volitelný)
  created_by TEXT,                                 -- 'admin:1', 'girl:25'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
  UNIQUE(client_id, girl_id)
);
```

**UI pravidla:**
- Rejection je VÝHRADNĚ INTERNÍ — klient se to NIKDY nedozví
- Při vytváření bookingu: systém kontroluje rejections pro vybranou dívku
- Pokud existuje: WARNING banner "Emily tohoto klienta odmítá"
- Operátorka klientovi řekne "má plno" nebo jiný neutrální důvod
- Admin může rejection přidat/odebrat na klientské kartě
- Z analýzy kontaktů: 21 existujících girl-specific rejections k importu

---

## 3. ADMIN UI — CALENDAR GRID VIEW (#12)

### 3.1 Hlavní view: Multi-staff day grid

Inspirováno Fresha/Calendly overlay view:

```
┌──────────────────────────────────────────────────────────────────┐
│ Rezervace                    [Dnes ▼]  [Den | Týden]  [+ Nová]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pá 13.9.2026                                                    │
│                                                                  │
│  Čas    │ Nika      │ Luna      │ Sara      │ Emily     │ Katy  │
│  ───────┼───────────┼───────────┼───────────┼───────────┼───────│
│  10:00  │           │           │ ░░░░░░░░░ │           │       │
│  10:30  │           │           │ ░░░░░░░░░ │           │       │
│  11:00  │           │           │           │           │       │
│  11:30  │           │           │           │           │       │
│  12:00  │           │           │           │ ┌────────┐│       │
│  12:30  │           │           │           │ │VIP Jan ││       │
│  13:00  │           │           │           │ │120 min ││       │
│  13:30  │           │           │           │ │✅ Potvr.││       │
│  14:00  │ ┌────────┐│           │           │ └────────┘│       │
│  14:30  │ │Martin  ││           │           │           │       │
│  15:00  │ │60 min  ││           │           │           │       │
│  15:30  │ │📞 Tel. ││           │           │           │       │
│  16:00  │ └────────┘│ ┌────────┐│           │           │       │
│  16:30  │           │ │P.K.    ││           │           │       │
│  17:00  │           │ │90 min  ││           │           │       │
│  17:30  │           │ │✈️ TG   ││           │           │       │
│  18:00  │           │ │⏳ Čeká ││ ┌────────┐│           │       │
│  18:30  │           │ └────────┘│ │NOVÝ    ││           │       │
│  19:00  │           │           │ │60 min  ││           │       │
│  19:30  │           │           │ │📞 Tel. ││           │       │
│  20:00  │           │           │ │⏳ Čeká ││           │       │
│  20:30  │           │           │ └────────┘│           │       │
│  ───────┴───────────┴───────────┴───────────┴───────────┴───────│
│  ░░░ = mimo směnu (šedé)                                         │
│                                                                  │
│  Legenda: 📞 Telefon  ✈️ Telegram  💬 WhatsApp  📱 SMS          │
│           ✅ Potvrzena  ⏳ Čeká  ❌ Zrušena                      │
└──────────────────────────────────────────────────────────────────┘
```

**Klíčové UX prvky:**
- Y-osa = 30min sloty (10:00-22:30)
- X-osa = dívky které DNES pracují (z `girl_schedules` + `today_overrides`)
- Šedé ░░░ bloky = mimo směnu (dívka nepracuje)
- Barevné bloky = bookings (barva dle `source`: zelená=TG, modrá=telefon, fialová=WA)
- Klik na blok → detail booking (slide-out panel)
- Klik na prázdný slot → "Nová rezervace" s předvyplněnou dívkou + časem (#21)
- Dívky bez směny se NEZOBRAZUJÍ (#16)

### 3.2 Týdenní přehled

```
┌──────────────────────────────────────────────────────────────────┐
│  Týden 37 (9.9. — 15.9.)                                        │
│                                                                  │
│         │ Po    │ Út    │ St    │ Čt    │ Pá    │ So    │ Ne    │
│  ───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────│
│  Nika   │   2   │   1   │   3   │   —   │   1   │   2   │   —   │
│  Luna   │   1   │   2   │   —   │   1   │   1   │   —   │   —   │
│  Sara   │   —   │   1   │   2   │   2   │   2   │   1   │   —   │
│  Emily  │   1   │   —   │   1   │   1   │   1   │   —   │   —   │
│  ───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────│
│  Celkem:   4       4       6       4       5       3       0     │
│  Tržby: 10k     10k     15k     10k     12.5k    7.5k    0     │
└──────────────────────────────────────────────────────────────────┘
```

- Číslo = počet bookings
- Barva čísla: zelená=completed, žlutá=pending, šedá=cancelled
- Klik na buňku → přepne na day view daného dne+dívky

### 3.3 Nová rezervace — formulář (#21: max 4-5 kliků)

```
┌────────────────────────────────────────────┐
│ Nová rezervace                             │
├────────────────────────────────────────────┤
│                                            │
│  1. Klient                                 │
│  [Hledat dle telefonu / jména...]  🔍     │
│  → Autocomplete: najde existujícího        │
│  → Nebo: [+ Nový klient] inline form       │
│  → Zobrazí: typ, návštěvy, no-show, badge  │
│                                            │
│  2. Dívka + Čas                            │
│  Datum: [13.9.2026 ▼]                      │
│  → Zobrazí jen dívky s dnešní směnou (#16) │
│  Dívka: [Nika ▼] (10:00-22:00)            │
│  Čas:   [16:00 ▼] (15min intervaly)        │
│  → Validace: v rámci směny (#15)           │
│  → Validace: žádná kolize                  │
│                                            │
│  3. Program + Pokoj                        │
│  Program: [60 min — 2 500 Kč ▼]           │
│  → Auto: end_time = 17:00                  │
│  → Auto: cena denní/noční dle času         │
│  → Validace: nový klient max 60 min (#28)  │
│  → 90/120 min disabled + warning banner    │
│  Pokoj:   [Pokoj 1 ▼] (#23)               │
│                                            │
│  4. Zdroj + Poznámky                       │
│  Zdroj: [📞 Telefon ▼] (#18)              │
│  Poznámka: [________________]              │
│                                            │
│  [Uložit] [Uložit + Potvrdit]             │
│                                            │
└────────────────────────────────────────────┘
```

### 3.4 Quick actions na booking (#19: jedno kliknutí)

Na každém booking bloku v gridu:
- **[✅]** = Potvrdit (pending → confirmed)
- **[❌]** = Zrušit (modal s důvodem)
- **[📍]** = Poslat městskou část (district_sent=0 → pošle "Praha 2")
- **[🏠]** = Poslat přesnou adresu (jen pokud confirmed + address_sent=0 → pošle šifrovanou adresu)
- **[✓]** = Dokončeno (confirmed → completed, trigger client stats update)

Implementace: Server Actions s `<form action>`, žádný client JS pro základní akce.

---

## 4. KLIENTSKÉ KARTY (#2, #3, #4)

### 4.1 `/admin/klienti` — Seznam

```
┌─────────────────────────────────────────────────────────────┐
│ Klienti                                    [+ Nový klient]  │
├─────────────────────────────────────────────────────────────┤
│  Search: [________________] 🔍                              │
│  Filtr: [Všichni ▼] [VIP] [Stálí] [Noví] [Nedůvěryhodní]  │
│                                                             │
│  ┌──────┬────────────┬────────┬─────────┬──────┬──────────┐│
│  │ Typ  │ Kód        │ Tel.   │Návštěvy │No-sh.│ Poslední ││
│  ├──────┼────────────┼────────┼─────────┼──────┼──────────┤│
│  │ ⭐   │ KLIENT1008 │ *8421  │ 12      │ 0    │ 9.9.     ││
│  │ 🟢   │ KLIENT0508 │ *3355  │ 5       │ 0    │ 7.9.     ││
│  │ 🔵   │ KLIENT1309 │ *9012  │ 1       │ 0    │ 13.9.    ││
│  │ ⚠️   │ KLIENT0107 │ *1234  │ 2       │ 3    │ 1.8.     ││
│  └──────┴────────────┴────────┴─────────┴──────┴──────────┘│
│                                                             │
│  ⭐ VIP  🟢 Stálý  🔵 Nový  ⚠️ Nedůvěryhodný              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 No-show logika (#4: po 3× nemá prioritu ale šanci dostane)

```
no_show_count = 1  → ⚠️ badge na kartě
no_show_count = 2  → auto: requires_confirmation = 1 (vždy potvrzovat)
no_show_count = 3  → auto: type = 'untrusted' + admin notifikace
                     → při vytváření bookingu: červený warning
                     → "Tento klient má 3× no-show. Pokračovat?"
                     → ALE NEBLOKUJE — operátor může potvrdit
                     → Pokud nikdo jiný nechce slot → klient dostane šanci
```

---

## 5. TELEGRAM BOT (#5, #7, #8, #14)

### 5.1 Architektura

```
TELEGRAM CLOUD
    │ POST + X-Telegram-Bot-Api-Secret-Token
    ▼
/api/telegram/webhook/route.ts
    │ Verify secret, rate limit, parse
    ▼
lib/telegram.ts → handleUpdate()
    │
    ├── /start link_{girl_id}_{hmac}  → propojí dívku (#14)
    ├── /start book                    → booking flow pro stálé (#5)
    ├── /status                        → dívka: dnešní bookings
    ├── /stop                          → odpojit notifikace
    └── Callback query (inline kbd)    → potvrzení/zrušení
```

### 5.2 Kdo má přístup k botu (#5)

| Uživatel | Přístup | Jak |
|----------|---------|-----|
| Dívky | Notifikace o bookings | Deep link propojení v Studio |
| Stálí klienti (`regular`/`vip`) | Konverzační booking | Admin pošle link, bot zkontroluje type |
| Noví klienti | ❌ ŽÁDNÝ | Telefon → operátor zadá ručně (#6) |
| Admin | Daily digest, nový booking alert | Propojení přes /start admin_{token} |

### 5.2.1 Vícejazyčný bot (#31)

Bot podporuje **4 jazyky** — shodné s webem (next-intl):

| Locale | Jazyk |
|--------|-------|
| `cs` | Čeština (default) |
| `en` | English |
| `de` | Deutsch |
| `uk` | Українська |

**Detekce jazyka:**
1. Telegram API posílá `from.language_code` (ISO 639-1) v každém message
2. Mapování: `cs`→cs, `en`→en, `de`→de, `uk`→uk, ostatní→en (fallback)
3. Klient může kdykoli změnit: `/lang` → inline keyboard s výběrem
4. Uloženo v `telegram_client_links.locale`

**Texty:**
- Sdílené JSON soubory s webem: `messages/{locale}/telegram.json`
- Přístup přes `getTranslation(locale, key)` — ne přes next-intl runtime (bot běží mimo Next.js)
- Minimální set: ~30 překladových klíčů (booking flow, reminders, confirmations, errors)

### 5.3 Notifikace jen dívkám se směnou (#14)

```typescript
async function notifyGirl(girlId: number, message: string) {
  // 1. Má dívka dnes směnu?
  const schedule = await getGirlScheduleForToday(girlId);
  if (!schedule.isWorking) return; // NEPOSLAT — nemá směnu
  
  // 2. Má propojený Telegram?
  const link = await getTelegramLink(girlId);
  if (!link?.is_active) return;
  
  // 3. Quiet hours? (23:00-08:00)
  const pragueHour = getPragueHour();
  if (pragueHour >= 23 || pragueHour < 8) {
    await queueMessage(link.chat_id, message); // pošle v 08:01
    return;
  }
  
  // 4. Odeslat
  await sendTelegramMessage(decrypt(link.chat_id), message);
}
```

### 5.4 Potvrzovací zpráva (#7) + Reminder (#8)

**Po potvrzení bookingu:**
```
✅ Potvrzená rezervace

Nika · 14.9. · 16:00-17:00
Program: Exclusive 60
Pobočka: Vinohrady

Adresu obdržíte před návštěvou.
```

**Reminder 1h předem (cron):**
```
⏰ Připomenutí — za 1 hodinu

16:00-17:00 · Exclusive 60
Pobočka: Vinohrady

Potvrzujete příchod?
[Potvrzuji ✅] [Ruším ❌]
```

### 5.5 Dvoustupňová adresa (#9) — BEZPEČNOSTNÍ PRAVIDLO

**Dvě úrovně informací o lokaci:**

| Údaj | Kdy se sdělí | Kdo vidí | Šifrování |
|------|-------------|----------|-----------|
| `location.district` (Praha 2) | Krok 1: při domluvení rezervace | Klient, dívka, web | NE (veřejné) |
| `location.address` (Legerova 42) | Krok 2: PO potvrzení klientem | Jen klient + admin + dívka | AES-256-GCM |

**Krok 1 — Při rezervaci (operátorka / TG bot):**
```
📅 Rezervace vytvořena

Natálie · 15.9. · 16:00-17:00
Program: Exclusive 60
Pobočka: Praha 2

Adresu obdržíte po potvrzení.
```

**Krok 2 — Po potvrzení klientem (operátorka klikne "Poslat adresu" / TG bot automaticky):**
```
📍 Adresa pro návštěvu 15.9. v 16:00

Legerova 42, Praha 2

Prosíme o diskrétní příchod.
```

**Implementace — dvě tlačítka v admin panelu:**
- **[📍 Městská část]** — pošle jen district (aktivní hned po vytvoření bookingu) → `district_sent = 1`
- **[🏠 Přesná adresa]** — pošle šifrovanou adresu (aktivní POUZE po `status = 'confirmed'`) → `address_sent = 1`

**Pravidla:**
1. `location.address` se NIKDY neposílá před potvrzením bookingu
2. `location.address` je šifrovaná v DB (AES-256-GCM)
3. `location.district` je veřejná informace (zobrazena i na webu)
4. TG bot: Krok 1 automaticky při vytvoření, Krok 2 JEN po admin akci "Poslat adresu"
5. Telefon/SMS/WA: operátorka sdělí ústně/textově, systém loguje `address_sent_via = 'manual'`

### 5.6 Denní report (#33)

Automatická TG zpráva adminovi v 22:00 Europe/Prague:

```
📊 Denní report — So 13.9.2026

Dívka      | Body  | Cíl    | Rez. | No-show
───────────┼───────┼────────┼──────┼────────
Emily      | 2 800 | ❌ 62% |    3 |    0
Nika       | 1 800 | ❌ 40% |    2 |    0
Luna       | 1 800 | ❌ 40% |    2 |    0
Caty       | 1 000 | ❌ 22% |    1 |    0
───────────┼───────┼────────┼──────┼────────
CELKEM     | 7 400 |  0/4   |    8 |    0

Nových klientů: 1 (NOVY1309)
```

Implementace: `/api/cron/daily-report/route.ts`, cron 22:00 přes vercel.json.

---

## 6. ROZVRH PROVÁZÁNÍ (#15, #16)

### Validace při vytváření bookingu

```typescript
async function validateBookingTime(
  girlId: number, 
  date: string, 
  startTime: string, 
  endTime: string
): Promise<{ valid: boolean; error?: string }> {
  
  // 1. Má dívka směnu v daný den?
  const schedule = await getGirlScheduleForDate(girlId, date);
  if (!schedule) {
    return { valid: false, error: 'Dívka nemá tento den směnu' };
  }
  
  // 2. Je čas v rámci směny? (#15)
  if (startTime < schedule.startTime || endTime > schedule.endTime) {
    return { valid: false, error: `Směna je ${schedule.startTime}-${schedule.endTime}` };
  }
  
  // 3. Kolize s jiným bookingem?
  const collision = await checkBookingCollision(girlId, date, startTime, endTime);
  if (collision) {
    return { valid: false, error: `Kolize s bookingem v ${collision.startTime}` };
  }
  
  // 4. Buffer 15 min (#30) — POVINNÝ, bez výjimky
  const tooClose = await checkBufferTime(girlId, date, startTime, endTime, 15);
  if (tooClose) {
    return { valid: false, error: `Příliš blízko k bookingu v ${tooClose.startTime} (min. 15 min mezera)` };
  }
  
  // 5. Nový klient max 60 min (#28)
  if (client.type === 'new' && program.duration > 60) {
    return { valid: false, error: 'Nový klient — max 60 min' };
  }
  
  return { valid: true };
}
```

### Filtr dostupných dívek (#16)

```typescript
async function getAvailableGirls(date: string, time: string): Promise<Girl[]> {
  // Vrátí POUZE dívky které:
  // 1. Mají směnu v daný den
  // 2. Pracují v daný čas
  // 3. Nemají kolizi s jiným bookingem v ±buffer
  // Seřazeno dle lokace (seskupit dívky na stejné pobočce)
}
```

---

## 7. REAL-TIME + ZDROJ ROZLIŠENÍ (#17, #18)

### Fáze 1: SSR refresh + audio
- Admin page `force-dynamic` + meta refresh (30s) NEBO `<RefreshButton>` client component
- Audio ping: `new Audio('/sounds/booking-ping.mp3').play()` při novém bookingu
- `last_seen` timestamp na admin → pokud nový booking > last_seen → zvuk

### Fáze 2: Server-Sent Events
- `/api/admin/booking-stream` SSE endpoint
- Client component listener → real-time update bez refresh

### Source rozlišení (#18)

| Source | Ikona | Barva bloku v gridu |
|--------|-------|---------------------|
| `phone` | 📞 | `var(--color-blue)` |
| `telegram_bot` | ✈️ | `var(--color-green)` |
| `whatsapp` | 💬 | `var(--color-purple)` |
| `sms` | 📱 | `var(--color-amber)` |
| `admin` | 👤 | `var(--color-gray)` |

---

## 8. BEZPEČNOST (#22)

Kompletní bezpečnostní architektura — viz předchozí plán `TASK-BOOKING-SYSTEM-plan.md` sekce 11.

Shrnutí klíčových prvků:

| Oblast | Řešení |
|--------|--------|
| Data at rest | AES-256-GCM (`lib/crypto.ts`) pro klientská data |
| Searchable fields | HMAC SHA-256 hash (`phone_hash`) |
| Auth matrix | Admin=vše, Manager=vše (zástup, #32), Girl=jen své anonymizované, Klient=nic. Min. 2 admin účty |
| Telegram | Webhook secret token, HMAC deep links, rate limiting |
| Adresa | Šifrovaná v DB, nikdy veřejně, jen po confirmed |
| Audit | `security_audit_log` pro všechny operace s PII |
| Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| API | Auth guards + rate limiting na všech routes |
| Zálohy | Denní šifrovaná záloha DB (BACKUP_ENCRYPTION_KEY) |
| Sessions | Concurrent limit, UA binding, re-auth pro citlivé operace |

### Env vars potřebné (7 tajných klíčů)

```env
ENCRYPTION_KEY=...           # AES-256-GCM pro klientská data
SEARCH_HASH_SALT=...         # HMAC pro phone_hash
BACKUP_ENCRYPTION_KEY=...    # zálohy DB
TELEGRAM_BOT_TOKEN=...       # z @BotFather
TELEGRAM_WEBHOOK_SECRET=...  # ověření příchozích webhooků
TELEGRAM_LINK_SECRET=...     # HMAC pro deep link propojení
CRON_SECRET=...              # existující, pro cron auth
```

---

## 9. IMPLEMENTAČNÍ TASKY — POŘADÍ A ZÁVISLOSTI

```
FÁZE 0 — BEZPEČNOST (prerequisite pro vše)
═══════════════════════════════════════════

  TASK-S1: lib/crypto.ts — AES-256-GCM encrypt/decrypt/hashForSearch
  TASK-S2: lib/audit.ts + CREATE TABLE security_audit_log  
  TASK-S3: lib/rate-limit.ts — API + TG rate limiter
  TASK-S4: Security headers v next.config.ts
  TASK-S5: Session rozšíření (concurrent limit, re-auth)


FÁZE 1 — DB + KLIENTI + BOOKING CRUD (funguje hned, bez TG)
════════════════════════════════════════════════════════════

  TASK-A: DB migrace (lib/db.ts → runMigrations)
  ├── CREATE TABLE clients, client_ratings, telegram_links, booking_log
  ├── ALTER TABLE bookings (+ client_id, program_id, location_id, room,
  │   confirmation_*, address_*, source, admin_notes, girl_rating)
  └── Závisí na: S1-S4

  TASK-B: Klientské karty — CRUD + admin UI
  ├── lib/client-actions.ts (create, update, search, getById, getHistory)
  ├── KLIENT1309 code generation
  ├── /admin/klienti (seznam + filtry + search)
  ├── /admin/klienti/[id] (detail + historie + hodnocení)
  ├── AdminSidebar.tsx → přidat "Klienti"
  └── Závisí na: A

  TASK-C: Booking CRUD + Calendar Grid — admin UI
  ├── lib/booking-actions.ts (create, update, cancel, complete, sendAddress)
  ├── /admin/rezervace PŘEPIS → multi-staff day grid + week view
  ├── /admin/rezervace/nova → formulář (4-5 kroků, max klikání)
  ├── Schedule validation (#15), collision detection, buffer time
  ├── Available girls filter (#16)
  ├── Quick actions: potvrdit/zrušit/adresa/dokončeno (#19)
  ├── Source tracking + ikony/barvy (#18)
  ├── Room selection per booking (#23)
  ├── Odebrat GCal z page.tsx
  └── Závisí na: A, B

  TASK-D: Studio — dívky vidí své bookings
  ├── /studio/rezervace (anonymizované, bez klientských dat)
  ├── Studio dashboard → "Dnešní rezervace" sekce
  └── Závisí na: C

  TASK-E: Auto-upgrade + no-show logika
  ├── Po completed: client stats++, auto type upgrade (3+ → regular)
  ├── No-show: counter++, auto requires_confirmation, untrusted warning (#4)
  └── Závisí na: C


FÁZE 2 — TELEGRAM BOT (notifikace)
══════════════════════════════════

  TASK-F: TG bot core
  ├── lib/telegram.ts (sendMessage, setWebhook, verify, handleUpdate)
  ├── /api/telegram/webhook/route.ts
  ├── /api/telegram/setup/route.ts (admin: register webhook)
  └── Závisí na: S1-S3

  TASK-G: TG propojení dívek + booking notifikace
  ├── Deep link HMAC propojení v Studio
  ├── Admin: TG link status per dívka
  ├── Notifikace: created/confirmed/cancelled (jen dívkám se směnou #14)
  ├── Potvrzovací zpráva klientovi (#7)
  └── Závisí na: F, C

  TASK-H: Cron — 1h reminder + daily report (#33)
  ├── /api/cron/booking-reminders/route.ts
  ├── Reminder s inline keyboard [Potvrzuji/Ruším] (#8)
  ├── Timeout handling (30 min no response)
  ├── /api/cron/daily-report/route.ts (#33)
  │   ├── Cron 22:00 Europe/Prague
  │   ├── TG zpráva adminovi: bookings count, body per dívka, % plnění cíle, no-shows
  │   └── Formát: tabulka per dívka + denní souhrn
  ├── vercel.json → přidat oba cron jobs
  └── Závisí na: F, C


FÁZE 3 — TG BOOKING PRO STÁLÉ KLIENTY
══════════════════════════════════════

  TASK-I: Konverzační booking flow
  ├── lib/telegram-booking.ts (state machine)
  ├── POUZE pro regular/vip klienty (#5)
  ├── Výběr dívky → datum → čas → program → potvrzení
  ├── Validace rozvrhu (#15)
  ├── source = 'telegram_bot'
  └── Závisí na: F, C


FÁZE 4 — CLEANUP + PWA
═══════════════════════

  TASK-J: Odebrat Google Calendar
  ├── Smazat lib/gcal.ts + /api/gcal/*
  └── Závisí na: C (nový systém musí fungovat PŘED)

  TASK-K: PWA manifest + service worker
  ├── public/manifest.json + public/sw.js
  ├── Install prompt na admin/studio
  ├── Offline fallback page
  └── Závisí na: C (základní systém hotový)

  TASK-L: Revenue dashboard (volitelně)
  ├── Admin widget: tržby, top klienti, conversion rate
  └── Závisí na: E
```

### Dependency graf

```
S1─S4 ──► A ──► B ──► C ──┬──► D
  │                        ├──► E ──► L
  │                        │
  └──► F ──► G ────────────┤
       │                   │
       └──► H ─────────────┤
       │                   │
       └──► I ─────────────┘
                           │
                C ──► J    │
                C ──► K    │
```

---

## 10. SOUBORY — KOMPLETNÍ INVENTÁŘ

### Nové soubory (18)

| Soubor | Účel |
|--------|------|
| `lib/crypto.ts` | AES-256-GCM encrypt/decrypt/hashForSearch |
| `lib/audit.ts` | Security audit logging |
| `lib/rate-limit.ts` | API + TG rate limiter |
| `lib/client-actions.ts` | CRUD klientské karty |
| `lib/booking-actions.ts` | CRUD bookings + status flow + validace |
| `lib/telegram.ts` | TG Bot API wrapper + handlers |
| `lib/telegram-i18n.ts` | Bot lokalizace — getTranslation(locale, key) (#31) |
| `lib/telegram-booking.ts` | Konverzační booking state machine |
| `messages/{cs,en,de,uk}/telegram.json` | Bot překladové klíče (#31) |
| `app/api/telegram/webhook/route.ts` | TG webhook endpoint |
| `app/api/telegram/setup/route.ts` | Admin: set webhook URL |
| `app/api/cron/booking-reminders/route.ts` | 1h reminder cron |
| `app/api/cron/daily-report/route.ts` | Denní report 22:00 (#33) |
| `app/[locale]/(admin)/admin/klienti/page.tsx` | Seznam klientů |
| `app/[locale]/(admin)/admin/klienti/[id]/page.tsx` | Detail klienta |
| `app/[locale]/(admin)/admin/klienti/novy/page.tsx` | Nový klient form |
| `app/[locale]/(admin)/admin/rezervace/nova/page.tsx` | Nová rezervace form |
| `app/[locale]/(admin)/admin/audit/page.tsx` | Security audit log |
| `app/[locale]/studio/rezervace/page.tsx` | Bookings pro dívku |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |

### Upravené soubory (10)

| Soubor | Změna |
|--------|-------|
| `lib/db.ts` | Migrace: 6 nových tabulek + ALTER bookings |
| `lib/queries.ts` | Nové query funkce pro klienty + bookings |
| `components/admin/AdminSidebar.tsx` | Nav: +Klienti, +Audit |
| `app/[locale]/(admin)/admin/rezervace/page.tsx` | KOMPLETNÍ PŘEPIS → calendar grid |
| `app/[locale]/studio/page.tsx` | +Dnešní rezervace, +TG propojení |
| `next.config.ts` | Security headers (CSP, HSTS, X-Frame-Options) |
| `vercel.json` | +cron: booking-reminders |
| `middleware.ts` | Route matching pro /admin/klienti, /admin/audit |
| `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` | +TG link status |
| `lib/auth.ts` | Concurrent session limit, re-auth |

### Smazané soubory (4, fáze 4)

| Soubor | Důvod |
|--------|-------|
| `lib/gcal.ts` | Nahrazeno vlastním systémem |
| `app/api/gcal/auth/` | GCal OAuth nepotřebný |
| `app/api/gcal/callback/` | GCal OAuth nepotřebný |
| `app/api/gcal/disconnect/` | GCal OAuth nepotřebný |

---

## 11. OPEN QUESTIONS

1. **Telegram bot name:** Uživatel musí vytvořit bota přes @BotFather. Doporučení: `@LovelyGirlsPrahaBot`. Token dodá.

2. **Pokoje:** Kolik pokojů je na každé pobočce? Potřeba pro room selection v bookingu (#23). Přidat do `locations` tabulky nebo `rooms` tabulka?

3. **Přechodné období (#20):** Jak dlouho poběží telefon + TG paralelně? Kdy odříznout telefon? (Doporučení: nikdy — telefon je vždy záloha)

4. **SMS automatizace:** V první fázi pouze Telegram + manuální. Chce uživatel i automatické SMS (SMSBrana.cz ~0.5 Kč/SMS)?

5. **Adresy poboček:** Praha-2 má adresu. Praha-3 a Praha-5 NE. Potřeba doplnit.

6. **Daily digest admin:** Chce uživatel ranní přehled přes TG v 07:00?

7. **Revenue dashboard (TASK-L):** Priorita? Tržby per dívka, top klienti, conversion rate.
