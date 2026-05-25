-- Dump of loyalty_tiers (0 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:27.992Z

-- Original schema (for reference):
-- CREATE TABLE loyalty_tiers (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     visits_required INTEGER NOT NULL,    -- Number of visits needed
--     discount_percentage INTEGER NOT NULL, -- Discount percentage
--     tier_level INTEGER NOT NULL,         -- 1=Bronze, 2=Silver, 3=Gold, 4=VIP
--     display_order INTEGER DEFAULT 0,
-- 
--     -- Multi-language fields
--     title_cs TEXT NOT NULL,
--     title_en TEXT NOT NULL,
--     title_de TEXT NOT NULL,
--     title_uk TEXT NOT NULL,
-- 
--     description_cs TEXT NOT NULL,
--     description_en TEXT NOT NULL,
--     description_de TEXT NOT NULL,
--     description_uk TEXT NOT NULL,
-- 
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- )

DROP TABLE IF EXISTS "loyalty_tiers";
CREATE TABLE loyalty_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visits_required INTEGER NOT NULL,    -- Number of visits needed
    discount_percentage INTEGER NOT NULL, -- Discount percentage
    tier_level INTEGER NOT NULL,         -- 1=Bronze, 2=Silver, 3=Gold, 4=VIP
    display_order INTEGER DEFAULT 0,

    -- Multi-language fields
    title_cs TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    title_uk TEXT NOT NULL,

    description_cs TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_de TEXT NOT NULL,
    description_uk TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

