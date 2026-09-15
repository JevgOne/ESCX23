# TASK-017: Blog — 12 nových článků, předepsat drafty do DB

**Datum:** 2026-09-03
**Status:** Plán hotový, čeká na implementaci

---

## 1. AKTUÁLNÍ STAV BLOGU

### Existující články v DB (podle seed souborů):

**blog-seed.sql (IDs 1-15, published May 2026):**
1. `escort-praha-kompletni-pruvodce` — Kompletní průvodce
2. `jak-vybrat-spolecnici-praha` — 7 tipů pro výběr
3. `girlfriend-experience-gfe-praha` — GFE vysvětleno
4. `soukrome-apartmany-escort-praha` — Soukromé apartmány
5. `prvni-navsteva-escort-agentury` — První návštěva
6. `escort-praha-ceny` — Ceník vysvětlen
7. `privatni-apartman-escort-praha` — Privátní apartmán
8. `jak-funguje-escort-agentura` — Jak funguje agentura
9. `gfe-girlfriend-experience-praha` — GFE podrobně
10. `bezpecny-escort-praha` — Bezpečnost
11. `escort-pro-zacatecniky` — Pro začátečníky
12. `nejlepsi-escort-praha-recenze` — Recenze
13. `escort-etiketa-pravidla` — Etiketa
14. `vip-escort-praha` — VIP escort
15. `diskretni-setkani-praha` — Diskrétní setkání

**blog-restore-guides.sql (IDs 16-18, restored legacy):**
16. `ceny-escortu-v-praze-co-ovlivnuje-cenu` — Ceny escortu
17. `outcall-do-hotelu-v-praze-prakticky-pruvodce` — Outcall průvodce
18. `kalendar-dostupnosti-jak-ho-cist-a-rychle-domluvit` — Kalendář dostupnosti

**blog-restore-stories.sql (IDs 30-36, restored stories/interviews):**
30-36: Povídky a rozhovory se společnicemi

**blog-lady4love.sql (ID 40, partner article):**
40. `jak-vybrat-bezpecnou-escort-platformu` — Partner článek

**CELKEM existujících: ~25 článků** (IDs 1-18, 30-36, 40)

### Témata už pokrytá (NEOPAKOVAT):
- Obecný průvodce escort Praha, výběr společnice, GFE (2x), soukromé apartmány (2x), první návštěva (2x), ceník/ceny (2x), etiketa, bezpečnost, VIP escort, diskrétní setkání/incall, outcall/hotel, kalendář dostupnosti, recenze v průmyslu, erotické povídky (3x), rozhovory (4x), výběr platformy

---

## 2. DB SCHEMA

```
blog_posts: id, slug, title_cs, title_en, excerpt_cs, excerpt_en,
            content_cs, content_en, meta_description_cs, meta_description_en,
            cover_url, author, status (draft/published), reading_time_min,
            published_at, created_at, updated_at

blog_tags: id, slug, name_cs, name_en
blog_post_tags: post_id, tag_id
```

- Blog obsah je **pouze CS + EN** (DE/UK redirectují na CS)
- Auto-publish cron: `/api/cron/publish-blog` — hourly, draft→published když published_at <= now()
- ID rozsah pro nové články: **50-61** (bezpečná mezera od existujících)

---

## 3. 12 NOVÝCH ČLÁNKŮ

### Publikační harmonogram: 1/týden, pondělí 10:00 CET, 8.9.–24.11.2026

| # | Datum | Slug | CS titulek | Pilíř |
|---|-------|------|------------|-------|
| 1 | 8.9. | `co-je-escort-agentura` | Co je escort agentura a jak se liší od privátních inzerátů | Edukace |
| 2 | 15.9. | `nejlepsi-ctvrti-praha-navsteva` | Nejlepší čtvrti Prahy pro diskrétní návštěvu | Praha |
| 3 | 22.9. | `recenze-proc-jsou-dulezite` | Proč jsou recenze klíčové při výběru společnice | Edukace |
| 4 | 29.9. | `escort-pro-cizince-praha` | Escort v Praze pro turisty a cizince | Praha |
| 5 | 6.10. | `duo-escort-praha` | Duo setkání v Praze: Vše co potřebujete vědět | Služby |
| 6 | 13.10. | `jak-funguje-rezervace` | Jak funguje rezervace u LovelyGirls | Edukace |
| 7 | 20.10. | `podzimni-praha-intimni-pruvodce` | Podzimní Praha: Intimní průvodce pro chladnější večery | Sezónní |
| 8 | 27.10. | `eroticka-masaz-vs-escort` | Erotická masáž vs. escort setkání: Jaký je rozdíl | Služby |
| 9 | 3.11. | `pravni-ramec-escort-cesko` | Právní rámec escort služeb v ČR | Edukace |
| 10 | 10.11. | `10-duvodu-lovelygirls` | 10 důvodů proč si klienti vybírají LovelyGirls | Trust |
| 11 | 17.11. | `adventni-praha-romanticke-setkani` | Adventní Praha: Romantická setkání | Sezónní |
| 12 | 24.11. | `silvestrovska-noc-escort-praha` | Silvestrovská noc: Exkluzivní společnice pro Nový rok | Sezónní |

---

### ČLÁNEK 1 — ID 50, 8. září 2026
**Slug:** `co-je-escort-agentura`
- **CS:** Co je escort agentura a jak se liší od privátních inzerátů
- **EN:** What Is an Escort Agency and How It Differs From Private Ads
- **Keywords:** escort agentura Praha, rozdíl agentura vs privat, verified escort Prague
- **Osnova:** Definice agentura vs nezávislá. Proces ověřování. Red flags privátních inzerátů. Proč agentura = bezpečnější. FAQ.
- **Linky:** /divky, /faq, /recenze
- **Čtení:** 5 min | **Tagy:** pruvodce, bezpecnost

### ČLÁNEK 2 — ID 51, 15. září 2026
**Slug:** `nejlepsi-ctvrti-praha-navsteva`
- **CS:** Nejlepší čtvrti Prahy pro diskrétní návštěvu
- **EN:** Best Prague Neighbourhoods for a Discreet Visit
- **Keywords:** escort Vinohrady, escort Žižkov, Prague districts escort
- **Osnova:** Přehled čtvrtí s apartmány. Praha 2 Vinohrady. Praha 3 Žižkov. Centrum. Doprava. Která čtvrť pro jakého klienta. FAQ.
- **Linky:** /pobocka/praha-2, /pobocka/praha-3
- **Čtení:** 6 min | **Tagy:** praha, lokace

### ČLÁNEK 3 — ID 52, 22. září 2026
**Slug:** `recenze-proc-jsou-dulezite`
- **CS:** Proč jsou recenze klíčové při výběru společnice
- **EN:** Why Reviews Matter When Choosing a Companion
- **Keywords:** escort recenze Praha, companion reviews Prague
- **Osnova:** Jak recenze pomáhají. Co dělá recenzi užitečnou. Co nepsat. Moderace recenzí. Dopad na společnice. Jak napsat recenzi krok za krokem. FAQ.
- **Linky:** /recenze, /profil/{slug}
- **Čtení:** 4 min | **Tagy:** tipy, recenze

### ČLÁNEK 4 — ID 53, 29. září 2026
**Slug:** `escort-pro-cizince-praha`
- **CS:** Escort v Praze pro turisty a cizince: Kompletní průvodce
- **EN:** Escort in Prague for Tourists and Foreigners: Complete Guide
- **Keywords:** escort Prague tourist, English speaking escort Prague
- **Osnova:** Praha jako top destinace. Jazyky. Měna (CZK+EUR). Letiště→apartmán. Kulturní rozdíly. Právní situace. FAQ.
- **Linky:** /faq, /cenik, /rozvrh, /kontakt
- **Čtení:** 6 min | **Tagy:** praha, turistika, pruvodce

### ČLÁNEK 5 — ID 54, 6. října 2026
**Slug:** `duo-escort-praha`
- **CS:** Duo setkání v Praze: Vše co potřebujete vědět
- **EN:** Duo Meeting in Prague: Everything You Need to Know
- **Keywords:** duo escort Praha, two girls escort Prague
- **Osnova:** Co je duo. Jak funguje rezervace párů. Ceník. Které společnice nabízí duo. Tipy pro first-timers. Doporučená délka 90-120 min. FAQ.
- **Linky:** /divky, /cenik, /sluzba/threesome_fmf
- **Čtení:** 5 min | **Tagy:** sluzby, duo

### ČLÁNEK 6 — ID 55, 13. října 2026
**Slug:** `jak-funguje-rezervace`
- **CS:** Jak funguje rezervace u LovelyGirls: Od kontaktu po setkání
- **EN:** How Booking Works at LovelyGirls: From First Contact to Meeting
- **Keywords:** jak rezervovat escort Praha, booking escort Prague
- **Osnova:** 5 kroků (profily → WhatsApp → výběr → adresa → příchod). Storno podmínky. Last-minute vs předem. FAQ.
- **Linky:** /rozvrh, /kontakt, /divky, /cenik
- **Čtení:** 4 min | **Tagy:** pruvodce, rezervace

### ČLÁNEK 7 — ID 56, 20. října 2026
**Slug:** `podzimni-praha-intimni-pruvodce`
- **CS:** Podzimní Praha: Intimní průvodce pro chladnější večery
- **EN:** Autumn Prague: An Intimate Guide for Cooler Evenings
- **Keywords:** Prague autumn, escort Prague October
- **Osnova:** Podzim = nejromantičtější sezóna. Restaurace a vinárny. Víkendový plán. Delší programy. GFE. Méně turistů = větší dostupnost. FAQ.
- **Linky:** /rozvrh, /divky, /hashtag/gfe-praha, /cenik
- **Čtení:** 5 min | **Tagy:** praha, sezonna, lifestyle

### ČLÁNEK 8 — ID 57, 27. října 2026
**Slug:** `eroticka-masaz-vs-escort`
- **CS:** Erotická masáž vs. escort setkání: Jaký je rozdíl
- **EN:** Erotic Massage vs. Escort Meeting: What's the Difference
- **Keywords:** erotická masáž Praha, erotic massage vs escort
- **Osnova:** Definice. Rozsah služeb. Soukromí. Cenové porovnání. Flexibilita. Personalizace. Kvalita. Kdy zvolit co. FAQ.
- **Linky:** /sluzba/erotic_massage, /divky, /cenik
- **Čtení:** 5 min | **Tagy:** sluzby, porovnani

### ČLÁNEK 9 — ID 58, 3. listopadu 2026
**Slug:** `pravni-ramec-escort-cesko`
- **CS:** Právní rámec escort služeb v ČR: Co říká zákon
- **EN:** Legal Framework of Escort Services in Czech Republic
- **Keywords:** je escort legální, escort zákon ČR, legal escort Czech Republic
- **Osnova:** Český zákon. Co je legální/nelegální. Perspektiva klienta. Compliance agentur. Srovnání EU. Ochrana soukromí. FAQ.
- **Linky:** /faq, /podminky, /soukromi
- **Čtení:** 6 min | **Tagy:** pravo, bezpecnost, faq

### ČLÁNEK 10 — ID 59, 10. listopadu 2026
**Slug:** `10-duvodu-lovelygirls`
- **CS:** 10 důvodů proč si klienti vybírají LovelyGirls Praha
- **EN:** 10 Reasons Why Clients Choose LovelyGirls Prague
- **Keywords:** nejlepší escort Praha, best escort agency Prague
- **Osnova:** 10 bodů (ověřené fotky, transparentní ceník, apartmány, recenze, profesionální recepce, live rozvrh, slevy, soukromí, legalita, kvalita). FAQ.
- **Linky:** /divky, /recenze, /cenik, /slevy, /faq, /o-nas
- **Čtení:** 5 min | **Tagy:** pruvodce, o-nas

### ČLÁNEK 11 — ID 60, 17. listopadu 2026
**Slug:** `adventni-praha-romanticke-setkani`
- **CS:** Adventní Praha: Romantická setkání v nejkrásnějším období
- **EN:** Advent Prague: Romantic Encounters During the Most Beautiful Time
- **Keywords:** escort Prague December, advent Prague
- **Osnova:** Advent magie v Praze. Vánoční trhy. Romantický plán. Delší programy. Provozní doba přes svátky. FAQ.
- **Linky:** /rozvrh, /divky, /cenik
- **Čtení:** 5 min | **Tagy:** praha, sezonna, lifestyle

### ČLÁNEK 12 — ID 61, 24. listopadu 2026
**Slug:** `silvestrovska-noc-escort-praha`
- **CS:** Silvestrovská noc: Exkluzivní společnice pro oslavu Nového roku
- **EN:** New Year's Eve in Prague: Exclusive Companions for Your Celebration
- **Keywords:** escort Prague New Year, Silvester escort Praha
- **Osnova:** Proč oslavit Silvestr se společnicí. Overnight programy. Jak rezervovat (brzy!). Restaurace a bary. GFE. Bezpečnost. FAQ.
- **Linky:** /cenik, /divky, /hashtag/gfe-praha, /kontakt
- **Čtení:** 5 min | **Tagy:** praha, sezonna, lifestyle

---

## 4. NOVÉ TAGY K VYTVOŘENÍ

| Slug | name_cs | name_en |
|------|---------|---------|
| `pruvodce` | Průvodce | Guide |
| `bezpecnost` | Bezpečnost | Safety |
| `praha` | Praha | Prague |
| `tipy` | Tipy | Tips |
| `recenze` | Recenze | Reviews |
| `turistika` | Pro turisty | For Tourists |
| `sluzby` | Služby | Services |
| `duo` | Duo | Duo |
| `rezervace` | Rezervace | Booking |
| `sezonna` | Sezónní | Seasonal |
| `lifestyle` | Lifestyle | Lifestyle |
| `porovnani` | Porovnání | Comparison |
| `pravo` | Právo | Legal |
| `faq` | FAQ | FAQ |
| `o-nas` | O nás | About Us |
| `lokace` | Lokace | Locations |

---

## 5. IMPLEMENTAČNÍ POSTUP

### Workflow per článek:
1. Napsat `content_cs` — plný HTML (~800-1200 slov, 3-5 `<h2>`, FAQ sekce)
2. Napsat `content_en` — nativní EN (ne překlad)
3. Připravit metadata: title, excerpt, meta_description (CS + EN)
4. SQL INSERT jako `status = 'draft'`, `published_at` = plánované pondělí 10:00
5. Cron auto-publish
6. Přiřadit tagy

### Content HTML formát:
```html
<h2 id="sekce-slug">Nadpis</h2>
<p>Text s <strong>důležitými</strong> pojmy.</p>
<ul><li><strong>Bod</strong> — vysvětlení</li></ul>
<h3>FAQ otázka?</h3>
<p>Odpověď.</p>
```

### Interní linky v obsahu:
- CS: `<a href="/cs/divky">společnice</a>`
- EN: `<a href="/girls">companions</a>`

### Content guidelines:
- Tón: profesionální, přístupný, nikdy vulgární
- SEO: keyword v titulku, prvním odstavci, min. 2 nadpisech
- Min. 1 FAQ sekce s `<h3>` otázkami
- Autor: "Redakce"
- Reading time: ~200 slov/min

### SQL seed soubor:
Vytvořit `data/blog-sept-2026.sql` s 12 INSERT OR REPLACE statements (IDs 50-61).
