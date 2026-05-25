-- Dump of girl_applications (13 rows)
-- Source: Secretstory Turso DB
-- Date: 2026-05-09T12:09:20.396Z

-- Original schema (for reference):
-- CREATE TABLE girl_applications (
--       id INTEGER PRIMARY KEY AUTOINCREMENT,
-- 
--       -- Personal Info
--       name TEXT NOT NULL,
--       age INTEGER NOT NULL,
--       height INTEGER,
--       weight INTEGER,
--       bust INTEGER,
--       waist INTEGER,
--       hips INTEGER,
-- 
--       -- Contact
--       email TEXT,
--       phone TEXT NOT NULL,
--       telegram TEXT,
-- 
--       -- Professional Info
--       experience TEXT,
--       languages TEXT,
--       availability TEXT,
-- 
--       -- Bio
--       bio_cs TEXT,
--       bio_en TEXT,
-- 
--       -- Photos
--       photo_main TEXT,
--       photo_gallery TEXT,
-- 
--       -- Services
--       services TEXT,
-- 
--       -- Status
--       status TEXT DEFAULT 'pending',
--       reviewed_by INTEGER,
--       reviewed_at TEXT,
--       rejection_reason TEXT,
-- 
--       -- Metadata
--       created_at TEXT DEFAULT CURRENT_TIMESTAMP,
--       notes TEXT, eyes TEXT, tattoo INTEGER DEFAULT 0, tattoo_description TEXT, piercing INTEGER DEFAULT 0, hair TEXT,
-- 
--       FOREIGN KEY (reviewed_by) REFERENCES users(id)
--     )

DROP TABLE IF EXISTS "girl_applications";
CREATE TABLE girl_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      -- Personal Info
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      height INTEGER,
      weight INTEGER,
      bust INTEGER,
      waist INTEGER,
      hips INTEGER,

      -- Contact
      email TEXT,
      phone TEXT NOT NULL,
      telegram TEXT,

      -- Professional Info
      experience TEXT,
      languages TEXT,
      availability TEXT,

      -- Bio
      bio_cs TEXT,
      bio_en TEXT,

      -- Photos
      photo_main TEXT,
      photo_gallery TEXT,

      -- Services
      services TEXT,

      -- Status
      status TEXT DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at TEXT,
      rejection_reason TEXT,

      -- Metadata
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT, eyes TEXT, tattoo INTEGER DEFAULT 0, tattoo_description TEXT, piercing INTEGER DEFAULT 0, hair TEXT,

      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

INSERT INTO "girl_applications" ("id", "name", "age", "height", "weight", "bust", "waist", "hips", "email", "phone", "telegram", "experience", "languages", "availability", "bio_cs", "bio_en", "photo_main", "photo_gallery", "services", "status", "reviewed_by", "reviewed_at", "rejection_reason", "created_at", "notes", "eyes", "tattoo", "tattoo_description", "piercing", "hair") VALUES
(14, 'Nikol', 30, 173, 60, 2, NULL, NULL, 'veronicaasistent@seznam.cz', '773622482', NULL, 'experienced', '["Čeština"]', '[]', 'Vítej na mém profilu - jsem Nikol atraktivní, smyslná černovláska s příjemným vystupováním,  dbám na eleganci, hygienu a respekt. Individuální přístup, naprostá diskrétnost a příjemná atmosféra samozřejmostí.
Udělám co ti na očích uvidím .
Těším se na vás .', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","light_sm","foot_fetish","role_play","threesome_fmf","deepthroat","blowjob_no_condom","kissing","cim","swallow","piss_active","facesitting"]', 'pending', NULL, NULL, NULL, '2026-01-07 18:52:19', NULL, 'blue', 1, 'oba kotniky jedno malé,druhé střední ,předloktí obě malé ,bok malé,klíčni kost střední .', 1, 'black'),
(15, 'Lara ', 25, NULL, NULL, 4, NULL, NULL, 'dianahorvathh@icloud.com', '774432011', NULL, 'experienced', '["Čeština","Slovenčina","English","Русский"]', '[]', 'Ahoj panové😇🥰 jsem normální slečna která čeká právě na tebe aby ti ukázala cestu kolem světa kterou určitě nebudeš litovat a budeš na ni vzpomínat hodně hodně dlouho s úsměvem na tváři😍 Tak přijď za mnou nestyd se a uvidíš ze, to stoji za to. Lara 😘', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","erotic_massage","hard_sex","light_sm","foot_fetish","lesbi_show","threesome_fmf","threesome_mfm","kissing","blowjob_no_condom","cim"]', 'pending', NULL, NULL, NULL, '2026-03-08 18:54:15', NULL, 'brown', 1, 'Na zadku ', 0, 'brown'),
(16, 'Lara', 25, 165, 55, 4, NULL, NULL, 'dianahorvathh@icloud.com', '774432011', NULL, 'experienced', '["Čeština","English","Slovenčina","Русский"]', '[]', 'Ahoj pánové 😘 az chcete zažít jízdu kolem světa tak čti dál 😇nejsem žádná stydlivka a začátečnice pojď si užít chvilku na kterou budeš vzpomínat ještě hodně dlouho s úsměvem na tváři. Tak se nestyd a napiš/zavolej a pojď jdeme do toho😘 tva Lara ', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","erotic_massage","hard_sex","light_sm","foot_fetish","bdsm","lesbi_show","threesome_fmf","threesome_mfm","kissing","blowjob_no_condom","cim"]', 'pending', NULL, NULL, NULL, '2026-03-08 19:44:02', NULL, 'brown', 1, 'Na zadku', 0, 'brown'),
(17, 'Christina', 21, 165, 54, 1, NULL, NULL, 'sarinkajindrova2@icloud.com', '728160698', NULL, 'beginner', '["Čeština","English","Slovenčina"]', '[]', 'Ahoj, jsem Christina je mi 21 let a jsem tu úplně nová. Budu ráda když zamnou dojedeš a užijeme si společné chvíle . 👄', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","erotic_massage","lesbi_show","blowjob_no_condom","kissing","threesome_mfm","threesome_fmf","facesitting","hard_sex","deepthroat","cim","swallow","cof","rimming_passive"]', 'pending', NULL, NULL, NULL, '2026-03-08 19:53:54', NULL, 'brown', 1, NULL, 0, 'black'),
(18, 'Sammy ', 27, 172, 70, 3, NULL, NULL, 'radasoshop@gmail.com', '+393501961272', NULL, 'intermediate', '["English"]', '[]', 'Sammy | VIP Masáže Praha 🇨🇿🇧🇷
Ahoj, jsem Sammy, 27letá brazilská profesionální masérka. Nabízím exkluzivní VIP zážitek pro vaši úplnou relaxaci.
VIP balíček obsahuje:
• Body to Body & Erotická Classic
• Tantra & Lingam masáž
• Společná sprcha (Shared Shower)
• Freedom of Touching and Kissing', 'Sammy | VIP Massage in Prague 🇨🇿🇧🇷
Hello, I’m Sammy, a 25-year-old Brazilian professional massage therapist. I offer a premium VIP experience tailored for your relaxation.

The VIP Service Includes:

• Body to Body
• Erótica Classic
• Tantra 
• Lingam Massage
• Shared Shower (Banho compartilhado)
• Freedom of Touching and Kissing', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","prostate_massage","erotic_massage","hard_sex","kissing","blowjob_no_condom","cof","anal_girl","anal_man","rimming_passive","rimming_active","piss_active"]', 'pending', NULL, NULL, NULL, '2026-03-13 16:27:06', NULL, 'brown', 1, 'Braço ', 0, 'black'),
(19, 'Sammy ', 27, 172, 70, 3, NULL, NULL, 'radasoshop@gmail.com', '+491772781017', NULL, 'intermediate', '["English"]', '[]', 'Objevte vrcholné potěšení stvořené pro ty, kteří vyžadují krásu i intenzitu. Jsem hrdá Latina, oslnivá mulatka s dokonalou rovnováhou mezi sofistikovaností silikonu a přirozenou krásou vytvarovaného těla s legendárním, velkým brazilským zadečkem.
Moje masáže jsou definovány vysokou teplotou a sexy magnetismem, který promění každý dotek v jedinečný zážitek. Pokud hledáte pohlcující masáž od někoho, kdo ovládá umění svádění a má bezchybné křivky, právě jste mě našli.', 'Experience the ultimate pleasure designed for those who demand beauty and intensity. I am a proud Latina, a stunning "mulata" with the perfect balance between the sophistication of silicone and the natural beauty of a sculpted body, featuring the legendary, large Brazilian curves.
My sessions are defined by high heat and a sexy magnetism that turns every touch into a unique experience. If you are looking for an immersive massage performed by someone who masters the art of seduction and possesses flawless curves, you have just found your match.', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","erotic_massage","prostate_massage","light_sm","foot_fetish","lesbi_show","facesitting","blowjob_no_condom","threesome_fmf","kissing","rimming_active","rimming_passive","anal_girl","anal_man","piss_active"]', 'pending', NULL, NULL, NULL, '2026-03-25 14:05:31', NULL, 'brown', 1, 'Braço ', 0, 'black'),
(20, 'Tamara', 35, 165, 65, 3, NULL, NULL, 'isaprince@seznam.cz', '775803019', NULL, 'beginner', '[]', '[]', 'Krásný den přeji, nabízím erotické masáže a příjemnou klasiku.', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","cim","anal_girl","anal_man","rimming_passive","rimming_active"]', 'pending', NULL, NULL, NULL, '2026-03-29 08:37:29', NULL, 'green', 0, NULL, 0, 'blonde'),
(21, 'Anetta', 19, 165, 53, 1, NULL, NULL, 'n92950811@gmail.com', '+420725718545', NULL, 'intermediate', '["Čeština","Русский","Slovenčina"]', '[]', 'Zdravím vás, pokud si chcete přijet odpočinout, napište a domluvíme se.', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","erotic_massage","prostate_massage","foot_fetish","facesitting","kissing","blowjob_no_condom"]', 'pending', NULL, NULL, NULL, '2026-04-02 13:04:11', NULL, 'brown', 0, NULL, 0, 'black'),
(22, 'Dana', 30, 160, 60, 3, NULL, NULL, 'nataliamelnik997@gmail.com', '+420722556075', NULL, 'beginner', '["Русский","Čeština","English","Українська"]', '[]', 'Miluji sex, erotické masáže) ', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","erotic_massage","prostate_massage","kissing","blowjob_no_condom","cof","cim"]', 'pending', NULL, NULL, NULL, '2026-04-04 08:17:41', NULL, 'blue', 0, NULL, 0, 'brown'),
(23, 'Lyra', 26, 169, 50, 1, NULL, NULL, 'lyradoomak@gmail.com', '735835240', NULL, 'beginner', '["English","Čeština"]', '[]', 'Jsem přirozená, otevřená a přátelská společnice, která si ráda užívá příjemné chvíle ve dvou. Se mnou tě čeká něžnost, vášeň a příjemný únik od každodenního života.', 'I’m a natural, open minded and friendly companion who enjoys pleasant moments together. With me, you can expect tenderness, passion and a pleasant escape from everyday life.', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","kissing","deepthroat","foot_fetish","erotic_massage","rimming_passive","piss_active","threesome_mfm","facesitting"]', 'pending', NULL, NULL, NULL, '2026-04-04 15:10:15', NULL, 'brown', 0, NULL, 0, 'black'),
(24, 'Viktoria', 27, 168, 67, 2, NULL, NULL, 'chomenko.ann@gmail.com', '737696768', NULL, 'experienced', '["Čeština","Русский","English"]', '[]', 'Ne všechno o mně se dozvíš hned.

Jsem Viktoria. Klidná na povrchu, ale s energií, která se nedá přehlédnout. Přitahuji pozornost bez snahy a nechávám prostor fantazii, aby pracovala za mě.

Někteří muži mě pochopí během pár minut. Jiní nikdy.

Otázka je… do které skupiny patříš ty.', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","deepthroat","role_play","threesome_mfm","light_sm","bondage","foot_fetish","erotic_massage"]', 'pending', NULL, NULL, NULL, '2026-04-17 17:51:27', NULL, 'green', 1, 'Nápis na lýtku
Zvířata na stehnech
Srdce na stehnu 
Ještěrka na lopatce 
Květiny od zápěstí po loket

', 0, 'blonde'),
(25, 'Jessica', 31, 158, 56, 3, NULL, NULL, 'jessicaa139.jess@gmail.com', '+421919461784', NULL, 'beginner', '["Čeština","English"]', '[]', 'Jsem žena, která si užívá pozornost, blízkost a chvíle, které mají své napětí. Ráda vytvářím atmosféru, na kterou se nezapomíná.

Miluji doteky, pohledy a tichou přitažlivost mezi dvěma lidmi. Se mnou nejde jen o setkání, ale o pocit, ke kterému se chceš vracet.

Jsem milá, hravá a vnímavá. Umím si užít okamžik a zároveň si držím styl a úroveň.

Diskrétnost a respekt jsou samozřejmostí.', 'I am a woman who enjoys attention, closeness, and moments filled with subtle tension. I love creating an atmosphere you won’t forget.

I enjoy touch, eye contact, and the quiet attraction between two people. With me, it’s not just about a meeting, but a feeling you’ll want to come back to.

I am kind, playful, and intuitive. I know how to enjoy the moment while maintaining style and elegance.

Discretion and respect are a given.', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower"]', 'pending', NULL, NULL, NULL, '2026-04-27 08:02:38', NULL, 'brown', 1, 'Ruka leva korunka, klíční kost datum a za uchem houslový klíč.', 0, 'brown'),
(26, 'Diana', 28, 177, 105, NULL, NULL, NULL, 'nereknunevim0@gmail.com', '737317922', NULL, 'experienced', '["Čeština","English","Slovenčina","Deutsch"]', '[]', '...', '', NULL, '[]', '["classic","blowjob_condom","massage","cuddling","licking","69","cum_on_body","shared_shower","erotic_massage","prostate_massage","hard_sex","light_sm","facesitting","foot_fetish","bdsm","role_play","threesome_fmf","threesome_mfm","lesbi_show","blowjob_no_condom","kissing","deepthroat","cof","swallow","cim","anal_girl","anal_man","rimming_active","rimming_passive","piss_active"]', 'pending', NULL, NULL, NULL, '2026-05-02 19:24:53', NULL, 'green', 1, 'Ruce, nohy, oblicej, krk', 0, 'blonde');
