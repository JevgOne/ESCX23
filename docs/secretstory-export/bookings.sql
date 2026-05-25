-- Dump of bookings (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:28.830Z

-- Original schema (for reference):
-- CREATE TABLE bookings (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   girl_id INTEGER NOT NULL,
--   created_by INTEGER NOT NULL,
--   client_name TEXT,
--   client_phone TEXT,
--   client_email TEXT,
--   date TEXT NOT NULL,
--   start_time TEXT NOT NULL,
--   end_time TEXT NOT NULL,
--   duration INTEGER,
--   location TEXT,
--   location_type TEXT CHECK(location_type IN ('incall', 'outcall')),
--   services TEXT,
--   price INTEGER,
--   status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
--   notes TEXT,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, discount_type TEXT DEFAULT NULL, discount_percentage INTEGER DEFAULT 0, discount_amount INTEGER DEFAULT 0, original_price INTEGER DEFAULT NULL, final_price INTEGER DEFAULT NULL, communication_type TEXT CHECK(communication_type IN ('sms', 'call', 'whatsapp', 'telegram')),
--   FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
--   FOREIGN KEY (created_by) REFERENCES users(id)
-- )

DROP TABLE IF EXISTS "bookings";
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER,
  location TEXT,
  location_type TEXT CHECK(location_type IN ('incall', 'outcall')),
  services TEXT,
  price INTEGER,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, discount_type TEXT DEFAULT NULL, discount_percentage INTEGER DEFAULT 0, discount_amount INTEGER DEFAULT 0, original_price INTEGER DEFAULT NULL, final_price INTEGER DEFAULT NULL, communication_type TEXT CHECK(communication_type IN ('sms', 'call', 'whatsapp', 'telegram')),
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

