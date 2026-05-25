-- Dump of girl_seo_metadata (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:21.014Z

-- Original schema (for reference):
-- CREATE TABLE girl_seo_metadata (
--         id INTEGER PRIMARY KEY AUTOINCREMENT,
--         girl_id INTEGER NOT NULL,
--         locale TEXT NOT NULL,
--         meta_title TEXT NOT NULL,
--         meta_description TEXT NOT NULL,
--         og_title TEXT,
--         og_description TEXT,
--         og_image TEXT,
--         twitter_title TEXT,
--         twitter_description TEXT,
--         twitter_image TEXT,
--         structured_data TEXT,
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
--         UNIQUE(girl_id, locale)
--       )

DROP TABLE IF EXISTS "girl_seo_metadata";
CREATE TABLE girl_seo_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        girl_id INTEGER NOT NULL,
        locale TEXT NOT NULL,
        meta_title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        og_title TEXT,
        og_description TEXT,
        og_image TEXT,
        twitter_title TEXT,
        twitter_description TEXT,
        twitter_image TEXT,
        structured_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
        UNIQUE(girl_id, locale)
      );

