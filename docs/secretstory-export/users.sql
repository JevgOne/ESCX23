-- Dump of users (3 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:29.232Z

-- Original schema (for reference):
-- CREATE TABLE users (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   email TEXT NOT NULL UNIQUE,
--   password_hash TEXT NOT NULL,
--   role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'girl')),
--   girl_id INTEGER,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- )

DROP TABLE IF EXISTS "users";
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'girl')),
  girl_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "users" ("id", "email", "password_hash", "role", "girl_id", "created_at", "updated_at") VALUES
(6, 'lunamanazer@gmail.com', '$2b$10$2zcUwjj3eeATrWwjDOrVke.XPBL1gjDfsDP3s4utgclnhkWhAojaS', 'girl', 16, '2025-12-16 15:41:49', '2025-12-16 15:41:49'),
(7, 'email@email.cz', '$2b$10$ccmjZ6c3UVBqxCwlzyYVz.qMEEdmdm5NdDVW2Bch.D95K5STXi2A.', 'girl', 17, '2025-12-16 17:15:57', '2025-12-16 17:15:57'),
(8, 'info@lovelygirls.cz', '$2b$10$TNqkDf86qpM1.0tp3FWMguFxilHpmOKKAk9Lsy.tybQEd1RiZ2dqi', 'admin', NULL, '2025-12-28 22:24:38', '2025-12-28 22:24:38');
