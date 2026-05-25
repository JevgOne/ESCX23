-- Dump of notifications (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:28.408Z

-- Original schema (for reference):
-- CREATE TABLE notifications (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   user_id INTEGER NOT NULL,
--   type TEXT NOT NULL CHECK(type IN ('booking_created', 'booking_updated', 'booking_cancelled', 'review_new', 'review_approved')),
--   title TEXT NOT NULL,
--   message TEXT NOT NULL,
--   link TEXT,
--   read BOOLEAN DEFAULT 0,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- )

DROP TABLE IF EXISTS "notifications";
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('booking_created', 'booking_updated', 'booking_cancelled', 'review_new', 'review_approved')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

