-- Dump of pricing_extras (8 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:24.937Z

-- Original schema (for reference):
-- CREATE TABLE pricing_extras (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     price INTEGER NOT NULL,              -- Price in CZK
--     display_order INTEGER DEFAULT 0,
--     is_active INTEGER DEFAULT 1,
-- 
--     -- Multi-language fields
--     name_cs TEXT NOT NULL,
--     name_en TEXT NOT NULL,
--     name_de TEXT NOT NULL,
--     name_uk TEXT NOT NULL,
-- 
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- )

DROP TABLE IF EXISTS "pricing_extras";
CREATE TABLE pricing_extras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    price INTEGER NOT NULL,              -- Price in CZK
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,

    -- Multi-language fields
    name_cs TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    name_uk TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "pricing_extras" ("id", "price", "display_order", "is_active", "name_cs", "name_en", "name_de", "name_uk", "created_at", "updated_at") VALUES
(1, 800, 1, 0, 'Nuru masáž', 'Nuru massage', 'Nuru-Massage', 'Nuru масаж', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(2, 800, 2, 0, 'Tantra masáž', 'Tantra massage', 'Tantra-Massage', 'Тантра масаж', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(3, 1500, 3, 0, 'Duo masáž (2 dívky)', 'Duo massage (2 girls)', 'Duo-Massage (2 Mädchen)', 'Дуо масаж (2 дівчини)', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(4, 800, 4, 0, 'Prodloužení +30 min', 'Extension +30 min', 'Verlängerung +30 Min', 'Подовження +30 хв', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(5, 500, 5, 0, 'Masáž prostaty', 'Prostate massage', 'Prostatamassage', 'Масаж простати', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(6, 500, 6, 0, 'Roleplay', 'Roleplay', 'Rollenspiel', 'Рольова гра', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(7, 700, 7, 0, 'Lehká dominance', 'Light domination', 'Leichte Dominanz', 'Легка домінація', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(8, 300, 8, 0, 'Foot fetish', 'Foot fetish', 'Fußfetisch', 'Фут фетиш', '2026-01-01 09:29:38', '2026-01-01 09:29:38');
