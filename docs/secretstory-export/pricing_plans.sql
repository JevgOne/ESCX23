-- Dump of pricing_plans (10 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:24.100Z

-- Original schema (for reference):
-- CREATE TABLE pricing_plans (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     duration INTEGER NOT NULL,           -- Duration in minutes (30, 60, 90)
--     price INTEGER NOT NULL,              -- Price in CZK
--     is_popular INTEGER DEFAULT 0,        -- 0 = false, 1 = true
--     display_order INTEGER DEFAULT 0,     -- Order in which to display
--     is_active INTEGER DEFAULT 1,         -- 0 = inactive, 1 = active
-- 
--     -- Multi-language fields
--     title_cs TEXT NOT NULL,
--     title_en TEXT NOT NULL,
--     title_de TEXT NOT NULL,
--     title_uk TEXT NOT NULL,
-- 
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- )

DROP TABLE IF EXISTS "pricing_plans";
CREATE TABLE pricing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    duration INTEGER NOT NULL,           -- Duration in minutes (30, 60, 90)
    price INTEGER NOT NULL,              -- Price in CZK
    is_popular INTEGER DEFAULT 0,        -- 0 = false, 1 = true
    display_order INTEGER DEFAULT 0,     -- Order in which to display
    is_active INTEGER DEFAULT 1,         -- 0 = inactive, 1 = active

    -- Multi-language fields
    title_cs TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    title_uk TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "pricing_plans" ("id", "duration", "price", "is_popular", "display_order", "is_active", "title_cs", "title_en", "title_de", "title_uk", "created_at", "updated_at") VALUES
(1, 30, 2000, 0, 1, 1, 'Quick Relax', 'Quick Relax', 'Schnelle Entspannung', 'Швидкий релакс', '2026-01-01 09:29:38', '2026-01-01 12:44:09'),
(2, 60, 2500, 1, 3, 1, 'Plný vibe', 'Full Vibe', 'Voller Vibe', 'Повний вайб', '2026-01-01 09:29:38', '2026-01-01 09:55:53'),
(3, 90, 3500, 0, 3, 0, 'Premium Pleasure', 'Premium Pleasure', 'Premium Vergnügen', 'Преміум насолода', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(4, 60, 2500, 1, 3, 0, 'Plný vibe', 'Full Vibe', 'Voller Vibe', 'Повний вайб', '2026-01-01 09:30:16', '2026-01-01 09:30:16'),
(5, 60, 2500, 1, 3, 0, 'Plný vibe', 'Full Vibe', 'Voller Vibe', 'Повний вайб', '2026-01-01 09:30:51', '2026-01-01 09:30:51'),
(6, 30, 2000, 0, 1, 0, 'Rychlovka', 'Quickie', 'Quickie', 'Швидкий кайф', '2026-01-01 09:32:32', '2026-01-01 09:32:32'),
(7, 30, 2000, 0, 1, 0, 'Rychlovka', 'Quickie', 'Quickie', 'Швидкий кайф', '2026-01-01 09:32:42', '2026-01-01 09:32:42'),
(8, 45, 2200, 0, 2, 1, 'Ochutnávka', 'Teaser', 'Vorgeschmack', 'Тизер', '2026-01-01 09:47:57', '2026-01-01 09:47:57'),
(9, 90, 4000, 0, 4, 1, 'Extra vibe', 'Extra Vibe', 'Extra Vibe', 'Екстра вайб', '2026-01-01 09:48:59', '2026-01-01 09:48:59'),
(10, 120, 4500, 0, 5, 1, 'Dlouhá jízda', 'Long Play', 'Langes Spiel', 'Довга гра', '2026-01-01 09:52:25', '2026-01-01 09:52:25');
