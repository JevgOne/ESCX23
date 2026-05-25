-- Dump of pricing_plan_features (5 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:24.522Z

-- Original schema (for reference):
-- CREATE TABLE pricing_plan_features (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     plan_id INTEGER NOT NULL,
--     display_order INTEGER DEFAULT 0,
-- 
--     -- Multi-language fields
--     feature_cs TEXT NOT NULL,
--     feature_en TEXT NOT NULL,
--     feature_de TEXT NOT NULL,
--     feature_uk TEXT NOT NULL,
-- 
--     FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
-- )

DROP TABLE IF EXISTS "pricing_plan_features";
CREATE TABLE pricing_plan_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,

    -- Multi-language fields
    feature_cs TEXT NOT NULL,
    feature_en TEXT NOT NULL,
    feature_de TEXT NOT NULL,
    feature_uk TEXT NOT NULL,

    FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
);

INSERT INTO "pricing_plan_features" ("id", "plan_id", "display_order", "feature_cs", "feature_en", "feature_de", "feature_uk") VALUES
(9, 3, 1, 'Vše z Classic Experience', 'Everything from Classic', 'Alles aus Classic', 'Все з Classic'),
(10, 3, 2, 'Tantra elementy', 'Tantra elements', 'Tantra-Elemente', 'Тантра елементи'),
(11, 3, 3, 'Delší relaxace', 'Extended relaxation', 'Längere Entspannung', 'Подовжена релаксація'),
(12, 3, 4, 'Sklenka sektu', 'Glass of champagne', 'Glas Sekt', 'Келих шампанського'),
(13, 3, 5, 'VIP atmosféra', 'VIP atmosphere', 'VIP-Atmosphäre', 'VIP атмосфера');
