-- Dump of photo_alt_texts (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:21.538Z

-- Original schema (for reference):
-- CREATE TABLE photo_alt_texts (
--         id INTEGER PRIMARY KEY AUTOINCREMENT,
--         photo_id TEXT NOT NULL,
--         girl_id INTEGER NOT NULL,
--         locale TEXT NOT NULL,
--         alt_text TEXT NOT NULL,
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
--         UNIQUE(photo_id, locale)
--       )

DROP TABLE IF EXISTS "photo_alt_texts";
CREATE TABLE photo_alt_texts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photo_id TEXT NOT NULL,
        girl_id INTEGER NOT NULL,
        locale TEXT NOT NULL,
        alt_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
        UNIQUE(photo_id, locale)
      );

