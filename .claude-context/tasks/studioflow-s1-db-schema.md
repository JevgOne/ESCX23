# STUDIOFLOW S1: DB Schema pro booking systém

## Status: PLÁN (čeká na schválení)

## Kontext

Existující DB (Turso/libSQL) obsahuje Secretstory tabulky: `users`, `girls`, `girl_photos`, `girl_schedules`, `schedule_exceptions`, `locations`, `pricing_plans`, `pricing_extras`, `services`, `bookings` (prázdná), `reviews`.

STUDIOFLOW přidává NOVÉ tabulky vedle existujících. Nemodifikujeme stávající schema.

## Existující soubory (již vytvořené)

- `prisma/schema.prisma` — Prisma schema (referenční, pro typovou bezpečnost)
- `scripts/migrate-studioflow-booking.sql` — raw SQL migrace

## Změny oproti již vytvořenému schema

Team-lead požaduje úpravy:

### 1. Přejmenovat `clients` → `booking_clients`
- Odlišit od budoucí `members` tabulky
- Přidat `trust_level` enum: `new | verified | regular | vip` (místo `tier`)

### 2. HMAC hash místo SHA-256 pro phone_hash
- `phone_hash` = HMAC-SHA256(phone, HMAC_SECRET) — ne prostý SHA-256
- Důvod: HMAC vyžaduje tajný klíč → brání rainbow table útokům
- Nový env: `BOOKING_HMAC_SECRET`

### 3. Přejmenovat `studio_users` → použít existující `users` tabulku
- Stávající `users` už má `admin | manager | girl` role
- Přidat sloupec `operator` do CHECK constraint: `admin | manager | operator | girl`
- Přidat sloupce: `display_name TEXT`, `is_active INTEGER DEFAULT 1`
- Netvořit duplicitní tabulku

## Finální tabulky (5 nových + 1 ALTER)

### ALTER: `users` (rozšíření)
```sql
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
-- Role CHECK rozšíříme v kódu (SQLite nemá ALTER CHECK)
-- Validace role v aplikační vrstvě: admin | manager | operator | girl
```

### NEW: `booking_clients`
```sql
CREATE TABLE booking_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_number TEXT NOT NULL UNIQUE,        -- "KLIENT0001" auto-gen
  nickname TEXT NOT NULL,                     -- zobrazuje se dívkám
  phone_encrypted TEXT,                       -- AES-256-GCM ciphertext
  phone_hmac TEXT,                            -- HMAC-SHA256 pro lookup
  name_encrypted TEXT,                        -- AES-256-GCM
  surname_encrypted TEXT,                     -- AES-256-GCM
  email_encrypted TEXT,                       -- AES-256-GCM
  telegram_id TEXT,                           -- TG user ID
  source TEXT NOT NULL DEFAULT 'phone'
    CHECK (source IN ('phone','telegram','whatsapp','walkin','web')),
  trust_level TEXT NOT NULL DEFAULT 'new'
    CHECK (trust_level IN ('new','verified','regular','vip')),
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  is_banned INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  notes TEXT,                                 -- interní (admin/operator)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bc_phone_hmac ON booking_clients(phone_hmac);
CREATE INDEX idx_bc_telegram ON booking_clients(telegram_id);
CREATE INDEX idx_bc_trust ON booking_clients(trust_level);
```

### NEW: `bookings_v2`
```sql
-- Pojmenováno v2 aby nenarazilo na existující prázdný `bookings`
CREATE TABLE bookings_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES booking_clients(id),
  girl_id INTEGER NOT NULL,                   -- FK → girls.id (existující)
  location_id INTEGER,                        -- FK → locations.id
  date TEXT NOT NULL,                         -- YYYY-MM-DD (Prague TZ)
  start_time TEXT NOT NULL,                   -- HH:MM
  end_time TEXT NOT NULL,                     -- HH:MM
  duration_minutes INTEGER NOT NULL,
  program_id INTEGER,                         -- FK → pricing_plans.id
  extras TEXT DEFAULT '[]',                   -- JSON
  price INTEGER,                              -- CZK (null = TBD)
  points_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft','pending','confirmed','in_progress',
      'completed','no_show','declined','expired',
      'cancelled_client','cancelled_girl','rescheduled','reassigned')),
  channel TEXT NOT NULL DEFAULT 'phone'
    CHECK (channel IN ('phone','telegram','whatsapp','admin','sms')),
  source TEXT,                                -- bot_flow | manual | deep_link
  notes TEXT,
  girl_notes TEXT,                            -- viditelné jen pro dívku
  decline_reason TEXT,
  cancel_reason TEXT,
  no_show_level INTEGER,                      -- 1,2,3 eskalace
  confirmed_at DATETIME,
  arrived_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  created_by INTEGER,                         -- users.id
  updated_by INTEGER,
  slot_version INTEGER NOT NULL DEFAULT 0,    -- optimistic locking
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Indexy pro výkon
CREATE INDEX idx_bv2_girl_date ON bookings_v2(girl_id, date);
CREATE INDEX idx_bv2_client ON bookings_v2(client_id);
CREATE INDEX idx_bv2_status ON bookings_v2(status);
CREATE INDEX idx_bv2_slot ON bookings_v2(girl_id, date, start_time, status);
```

### NEW: `booking_drafts`
```sql
CREATE TABLE booking_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES booking_clients(id),
  telegram_chat_id TEXT,                      -- TG chat ID pro odpovědi
  girl_id INTEGER,
  date TEXT,
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER,
  channel TEXT NOT NULL DEFAULT 'telegram',
  session_id TEXT NOT NULL UNIQUE,
  step TEXT NOT NULL DEFAULT 'select_girl'
    CHECK (step IN ('select_girl','select_day','select_time',
                     'select_duration','confirm')),
  expires_at DATETIME NOT NULL,               -- created_at + 30 min
  is_converted INTEGER NOT NULL DEFAULT 0,
  converted_to_id INTEGER,                    -- bookings_v2.id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bd_girl_slot ON booking_drafts(girl_id, date, start_time);
CREATE INDEX idx_bd_expires ON booking_drafts(expires_at);
CREATE INDEX idx_bd_chat ON booking_drafts(telegram_chat_id);
```

### NEW: `telegram_users`
```sql
CREATE TABLE telegram_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id TEXT NOT NULL UNIQUE,
  telegram_name TEXT,
  client_id INTEGER NOT NULL UNIQUE REFERENCES booking_clients(id),
  chat_id TEXT,                               -- pro posílání zpráv
  activation_token TEXT,                      -- deep link (jednorázový)
  is_active INTEGER NOT NULL DEFAULT 1,
  activated_at DATETIME,
  last_interaction DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### NEW: `booking_audit_log`
```sql
CREATE TABLE booking_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER,                         -- FK → bookings_v2.id (nullable)
  user_id INTEGER,                            -- users.id (null = system/bot)
  action TEXT NOT NULL,                       -- booking.create, client.decrypt, ...
  actor_type TEXT NOT NULL DEFAULT 'user'
    CHECK (actor_type IN ('user','bot','system','cron')),
  entity_type TEXT,                           -- booking | client | draft
  entity_id INTEGER,
  details TEXT DEFAULT '{}',                  -- JSON diff
  ip_hash TEXT,                               -- HMAC of IP
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warn','critical')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bal_booking ON booking_audit_log(booking_id);
CREATE INDEX idx_bal_user ON booking_audit_log(user_id);
CREATE INDEX idx_bal_action ON booking_audit_log(action);
CREATE INDEX idx_bal_created ON booking_audit_log(created_at);
CREATE INDEX idx_bal_severity ON booking_audit_log(severity);
```

### NEW: `slot_locks` (race condition prevence)
```sql
CREATE TABLE slot_locks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  locked_by TEXT NOT NULL,                    -- "draft:123" | "booking:456"
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(girl_id, date, start_time, end_time)
);
CREATE INDEX idx_sl_expires ON slot_locks(expires_at);
```

## Implementační kroky

1. **Aktualizovat `prisma/schema.prisma`** — přejmenovat modely dle nového návrhu
2. **Aktualizovat `scripts/migrate-studioflow-booking.sql`** — přepsat na finální schema
3. **Přidat migrace do `lib/db.ts`** — runMigrations() pro ALTER TABLE users
4. **Vytvořit `lib/booking-db.ts`** — typed query helpers pro nové tabulky
5. **Přidat env vars** do `.env.example`:
   - `BOOKING_ENCRYPTION_KEY` (32 bytes, hex)
   - `BOOKING_HMAC_SECRET` (32 bytes, hex)

## Env vars potřebné

```env
# STUDIOFLOW Booking
BOOKING_ENCRYPTION_KEY=   # 64 hex chars (32 bytes) pro AES-256-GCM
BOOKING_HMAC_SECRET=      # 64 hex chars (32 bytes) pro HMAC-SHA256
TELEGRAM_BOT_TOKEN=       # od @BotFather
```
