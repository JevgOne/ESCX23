-- =============================================================================
-- STUDIOFLOW Booking System — Migration
-- =============================================================================
-- Run against Turso/libSQL database.
-- All tables use IF NOT EXISTS — safe to run multiple times.
-- =============================================================================

-- ----- ALTER: USERS (extend existing table) -----
-- Add display_name and is_active to existing users table.
-- Role CHECK cannot be altered in SQLite — validate in application layer:
--   admin | manager | operator | girl
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;

-- ----- BOOKING CLIENTS (encrypted PII) -----
-- Renamed from `clients` to avoid collision with future `members` table.
-- phone_hmac = HMAC-SHA256(phone, BOOKING_HMAC_SECRET) — not plain SHA-256.
CREATE TABLE IF NOT EXISTS booking_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_number TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  phone_encrypted TEXT,
  phone_hmac TEXT,
  name_encrypted TEXT,
  surname_encrypted TEXT,
  email_encrypted TEXT,
  telegram_id TEXT,
  source TEXT NOT NULL DEFAULT 'phone'
    CHECK (source IN ('phone', 'telegram', 'whatsapp', 'walkin', 'web')),
  trust_level TEXT NOT NULL DEFAULT 'new'
    CHECK (trust_level IN ('new', 'verified', 'regular', 'vip')),
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  is_banned INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bc_phone_hmac ON booking_clients(phone_hmac);
CREATE INDEX IF NOT EXISTS idx_bc_telegram ON booking_clients(telegram_id);
CREATE INDEX IF NOT EXISTS idx_bc_trust ON booking_clients(trust_level);

-- ----- BOOKINGS V2 (main reservation table) -----
-- Named v2 to avoid collision with existing empty `bookings` table.
CREATE TABLE IF NOT EXISTS bookings_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  girl_id INTEGER NOT NULL,
  location_id INTEGER,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  program_id INTEGER,
  extras TEXT DEFAULT '[]',
  price INTEGER,
  points_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'confirmed', 'in_progress', 'completed',
                       'no_show', 'declined', 'expired',
                       'cancelled_client', 'cancelled_girl',
                       'rescheduled', 'reassigned')),
  channel TEXT NOT NULL DEFAULT 'phone'
    CHECK (channel IN ('phone', 'telegram', 'whatsapp', 'admin', 'sms')),
  source TEXT,
  notes TEXT,
  girl_notes TEXT,
  decline_reason TEXT,
  cancel_reason TEXT,
  no_show_level INTEGER,
  confirmed_at DATETIME,
  arrived_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  created_by INTEGER,
  updated_by INTEGER,
  slot_version INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES booking_clients(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_bv2_girl_date ON bookings_v2(girl_id, date);
CREATE INDEX IF NOT EXISTS idx_bv2_client ON bookings_v2(client_id);
CREATE INDEX IF NOT EXISTS idx_bv2_status ON bookings_v2(status);
CREATE INDEX IF NOT EXISTS idx_bv2_slot ON bookings_v2(girl_id, date, start_time, status);

-- ----- BOOKING DRAFTS (real-time bot → calendar sync) -----
CREATE TABLE IF NOT EXISTS booking_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  telegram_chat_id TEXT,
  girl_id INTEGER,
  date TEXT,
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER,
  channel TEXT NOT NULL DEFAULT 'telegram'
    CHECK (channel IN ('telegram', 'whatsapp')),
  session_id TEXT NOT NULL UNIQUE,
  step TEXT NOT NULL DEFAULT 'select_girl'
    CHECK (step IN ('select_girl', 'select_day', 'select_time', 'select_duration', 'confirm')),
  expires_at DATETIME NOT NULL,
  is_converted INTEGER NOT NULL DEFAULT 0,
  converted_to_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES booking_clients(id)
);
CREATE INDEX IF NOT EXISTS idx_bd_girl_slot ON booking_drafts(girl_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_bd_expires ON booking_drafts(expires_at);
CREATE INDEX IF NOT EXISTS idx_bd_chat ON booking_drafts(telegram_chat_id);

-- ----- TELEGRAM USERS (bot deep-link activation) -----
CREATE TABLE IF NOT EXISTS telegram_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id TEXT NOT NULL UNIQUE,
  telegram_name TEXT,
  client_id INTEGER NOT NULL UNIQUE,
  chat_id TEXT,
  activation_token TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  activated_at DATETIME,
  last_interaction DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES booking_clients(id)
);

-- ----- BOOKING AUDIT LOG (immutable — INSERT only) -----
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER,
  user_id INTEGER,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'user'
    CHECK (actor_type IN ('user', 'bot', 'system', 'cron')),
  entity_type TEXT,
  entity_id INTEGER,
  details TEXT DEFAULT '{}',
  ip_hash TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warn', 'critical')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings_v2(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_bal_booking ON booking_audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_bal_user ON booking_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_bal_action ON booking_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_bal_created ON booking_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_bal_severity ON booking_audit_log(severity);

-- ----- SLOT LOCKS (race condition prevention) -----
CREATE TABLE IF NOT EXISTS slot_locks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  locked_by TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(girl_id, date, start_time, end_time)
);
CREATE INDEX IF NOT EXISTS idx_sl_expires ON slot_locks(expires_at);

-- ----- GIRL NOTIFICATIONS (Studio PWA notification feed) -----
CREATE TABLE IF NOT EXISTS girl_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'default'
    CHECK (type IN ('new_booking', 'cancelled', 'reminder', 'schedule_change', 'default')),
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gn_girl ON girl_notifications(girl_id);
CREATE INDEX IF NOT EXISTS idx_gn_created ON girl_notifications(girl_id, created_at);
