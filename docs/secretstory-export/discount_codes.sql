-- Dump of discount_codes (3 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:25.783Z

-- Original schema (for reference):
-- CREATE TABLE discount_codes (
-- id INTEGER PRIMARY KEY AUTOINCREMENT,
-- code TEXT NOT NULL UNIQUE,
-- name TEXT NOT NULL,
-- type TEXT NOT NULL,
-- value INTEGER NOT NULL,
-- min_duration INTEGER DEFAULT NULL,
-- valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
-- valid_until DATETIME DEFAULT NULL,
-- max_uses INTEGER DEFAULT NULL,
-- current_uses INTEGER DEFAULT 0,
-- is_active INTEGER DEFAULT 1,
-- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
-- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- )

DROP TABLE IF EXISTS "discount_codes";
CREATE TABLE discount_codes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
code TEXT NOT NULL UNIQUE,
name TEXT NOT NULL,
type TEXT NOT NULL,
value INTEGER NOT NULL,
min_duration INTEGER DEFAULT NULL,
valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
valid_until DATETIME DEFAULT NULL,
max_uses INTEGER DEFAULT NULL,
current_uses INTEGER DEFAULT 0,
is_active INTEGER DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "discount_codes" ("id", "code", "name", "type", "value", "min_duration", "valid_from", "valid_until", "max_uses", "current_uses", "is_active", "created_at", "updated_at") VALUES
(1, 'FIRSTTIMER', 'First Timer Discount', 'percentage', 10, NULL, '2025-12-14 10:58:00', NULL, NULL, 0, 1, '2025-12-14 10:58:00', '2025-12-14 10:58:00'),
(2, 'WEEKEND20', 'Weekend Special', 'percentage', 20, NULL, '2025-12-14 10:58:00', NULL, NULL, 0, 1, '2025-12-14 10:58:00', '2025-12-14 10:58:00'),
(3, 'LOYALTY15', 'Loyalty Discount', 'percentage', 15, NULL, '2025-12-14 10:58:00', NULL, NULL, 0, 1, '2025-12-14 10:58:00', '2025-12-14 10:58:00');
