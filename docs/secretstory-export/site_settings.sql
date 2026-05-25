-- Dump of site_settings (1 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:29.646Z

-- Original schema (for reference):
-- CREATE TABLE site_settings (
--             key TEXT PRIMARY KEY,
--             value TEXT NOT NULL,
--             updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
--           )

DROP TABLE IF EXISTS "site_settings";
CREATE TABLE site_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

INSERT INTO "site_settings" ("key", "value", "updated_at") VALUES
('whatsapp_blocked', 'false', '2026-01-10 19:32:30');
