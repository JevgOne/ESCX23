-- Dump of discounts (6 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:25.350Z

-- Original schema (for reference):
-- CREATE TABLE discounts (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     icon TEXT DEFAULT '🎁',              -- Emoji icon
--     discount_type TEXT NOT NULL,         -- 'percentage' or 'fixed' or 'special'
--     discount_value INTEGER,              -- Percentage (15) or fixed amount (500) in CZK
--     display_order INTEGER DEFAULT 0,
--     is_active INTEGER DEFAULT 1,
--     is_featured INTEGER DEFAULT 0,       -- Featured discount at top
-- 
--     -- Multi-language fields
--     name_cs TEXT NOT NULL,
--     name_en TEXT NOT NULL,
--     name_de TEXT NOT NULL,
--     name_uk TEXT NOT NULL,
-- 
--     description_cs TEXT NOT NULL,
--     description_en TEXT NOT NULL,
--     description_de TEXT NOT NULL,
--     description_uk TEXT NOT NULL,
-- 
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- )

DROP TABLE IF EXISTS "discounts";
CREATE TABLE discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    icon TEXT DEFAULT '🎁',              -- Emoji icon
    discount_type TEXT NOT NULL,         -- 'percentage' or 'fixed' or 'special'
    discount_value INTEGER,              -- Percentage (15) or fixed amount (500) in CZK
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,       -- Featured discount at top

    -- Multi-language fields
    name_cs TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    name_uk TEXT NOT NULL,

    description_cs TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_de TEXT NOT NULL,
    description_uk TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "discounts" ("id", "icon", "discount_type", "discount_value", "display_order", "is_active", "is_featured", "name_cs", "name_en", "name_de", "name_uk", "description_cs", "description_en", "description_de", "description_uk", "created_at", "updated_at") VALUES
(1, '🌟', 'percentage', 15, 1, 0, 0, 'První návštěva', 'First Visit', 'Erster Besuch', 'Перший візит', 'Sleva 15% na první návštěvu našeho salonu', '15% off on your first visit to our salon', '15% Rabatt bei Ihrem ersten Besuch', 'Знижка 15% на перший візит', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(2, '👯', 'special', 0, 2, 0, 0, 'Duo sleva', 'Duo Discount', 'Duo-Rabatt', 'Дуо знижка', 'Speciální cena při návštěvě dvou masáží najednou', 'Special price when booking two massages at once', 'Sonderpreis bei Buchung von zwei Massagen', 'Спеціальна ціна при замовленні двох масажів', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(3, '💝', 'special', 0, 3, 0, 0, 'Narozeninová sleva', 'Birthday Discount', 'Geburtstagsrabatt', 'Знижка на день народження', 'Oslavte s námi! Speciální bonus v den Vašich narozenin', 'Celebrate with us! Special bonus on your birthday', 'Feiern Sie mit uns! Besonderer Bonus an Ihrem Geburtstag', 'Святкуйте з нами! Спеціальний бонус у день народження', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(4, '🔄', 'percentage', 10, 4, 0, 0, 'Zpět k nám', 'Come Back', 'Komm zurück', 'Повернення', 'Vrátíte-li se do 14 dnů, získáte slevu 10%', 'Return within 14 days and get 10% off', 'Kehren Sie innerhalb von 14 Tagen zurück und erhalten Sie 10% Rabatt', 'Поверніться протягом 14 днів і отримайте 10% знижки', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(5, '☀️', 'percentage', 20, 5, 0, 0, 'Ranní ptáče', 'Early Bird', 'Frühaufsteher', 'Рання пташка', 'Sleva 20% na návštěvy před 14:00', '20% off for visits before 2 PM', '20% Rabatt für Besuche vor 14 Uhr', '20% знижки на візити до 14:00', '2026-01-01 09:29:38', '2026-01-01 09:29:38'),
(6, '📅', 'percentage', 10, 6, 0, 0, 'Uprostřed týdne', 'Midweek Special', 'Wochenmitte-Special', 'Середина тижня', 'Sleva 10% v úterý, středu a čtvrtek', '10% off on Tuesday, Wednesday, and Thursday', '10% Rabatt am Dienstag, Mittwoch und Donnerstag', '10% знижки у вівторок, середу та четвер', '2026-01-01 09:29:38', '2026-01-01 09:29:38');
