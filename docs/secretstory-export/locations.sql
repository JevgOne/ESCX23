-- Dump of locations (1 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:21.945Z

-- Original schema (for reference):
-- CREATE TABLE locations (
--         id INTEGER PRIMARY KEY AUTOINCREMENT,
--         name TEXT NOT NULL UNIQUE,
--         display_name TEXT NOT NULL,
--         address TEXT,
--         postal_code TEXT,
--         city TEXT NOT NULL,
--         district TEXT,
--         coordinates TEXT,
--         phone TEXT,
--         email TEXT,
--         description TEXT,
--         is_active INTEGER DEFAULT 1,
--         is_primary INTEGER DEFAULT 0,
--         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
--         updated_at TEXT DEFAULT CURRENT_TIMESTAMP
--       )

DROP TABLE IF EXISTS "locations";
CREATE TABLE locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        address TEXT,
        postal_code TEXT,
        city TEXT NOT NULL,
        district TEXT,
        coordinates TEXT,
        phone TEXT,
        email TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        is_primary INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

INSERT INTO "locations" ("id", "name", "display_name", "address", "postal_code", "city", "district", "coordinates", "phone", "email", "description", "is_active", "is_primary", "created_at", "updated_at") VALUES
(1, 'praha-2', 'Praha 2', 'Vinohrady', '120 00', 'Praha', 'Praha 2', NULL, NULL, NULL, NULL, 1, 1, '2025-12-12 12:26:38', '2025-12-12 14:14:00');
