-- Dump of stories (3 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:27.587Z

-- Original schema (for reference):
-- CREATE TABLE stories (
--       id INTEGER PRIMARY KEY AUTOINCREMENT,
--       girl_id INTEGER NOT NULL,
--       media_url TEXT NOT NULL,
--       media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
--       thumbnail_url TEXT,
--       duration INTEGER DEFAULT 5,
--       order_index INTEGER DEFAULT 0,
--       is_active INTEGER DEFAULT 1,
--       views_count INTEGER DEFAULT 0,
--       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--       expires_at DATETIME,
--       FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
--     )

DROP TABLE IF EXISTS "stories";
CREATE TABLE stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      girl_id INTEGER NOT NULL,
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
      thumbnail_url TEXT,
      duration INTEGER DEFAULT 5,
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
    );

INSERT INTO "stories" ("id", "girl_id", "media_url", "media_type", "thumbnail_url", "duration", "order_index", "is_active", "views_count", "created_at", "expires_at") VALUES
(5, 22, 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/22/stories/1768673682555.mov', 'video', NULL, 5, 0, 1, 0, '2026-01-17 18:14:43', '2026-01-19T18:14:42.913Z'),
(8, 27, 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/27/stories/1768769371702.mp4', 'video', NULL, 5, 0, 1, 0, '2026-01-18 20:49:32', '2026-01-19T20:49:32.136Z'),
(9, 20, 'https://qktyf1ozcve7804i.public.blob.vercel-storage.com/girls/20/stories/1768899589554.mp4', 'video', NULL, 5, 0, 1, 0, '2026-01-20 08:59:50', '2026-01-21T08:59:49.973Z');
