-- Dump of girl_services (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:19.013Z

-- Original schema (for reference):
-- CREATE TABLE girl_services (
--           id INTEGER PRIMARY KEY AUTOINCREMENT,
--           girl_id INTEGER NOT NULL,
--           service_id INTEGER NOT NULL,
--           is_included BOOLEAN DEFAULT 1,
--           extra_price INTEGER,
--           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--           FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
--           FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
--           UNIQUE(girl_id, service_id)
--         )

DROP TABLE IF EXISTS "girl_services";
CREATE TABLE girl_services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          girl_id INTEGER NOT NULL,
          service_id INTEGER NOT NULL,
          is_included BOOLEAN DEFAULT 1,
          extra_price INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
          UNIQUE(girl_id, service_id)
        );

