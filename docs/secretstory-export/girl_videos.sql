-- Dump of girl_videos (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:18.596Z

-- Original schema (for reference):
-- CREATE TABLE girl_videos (
--         id INTEGER PRIMARY KEY AUTOINCREMENT,
--         girl_id INTEGER NOT NULL,
--         filename TEXT NOT NULL,
--         url TEXT NOT NULL,
--         thumbnail_url TEXT,
--         display_order INTEGER DEFAULT 0,
--         duration INTEGER,
--         width INTEGER,
--         height INTEGER,
--         file_size INTEGER,
--         mime_type TEXT,
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
--       )

DROP TABLE IF EXISTS "girl_videos";
CREATE TABLE girl_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        girl_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        display_order INTEGER DEFAULT 0,
        duration INTEGER,
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        mime_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
      );

