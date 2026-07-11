# TASK-final-chrome: Finální Chrome test — localhost:3001

**Datum:** 2026-07-06 (pondělí)  
**Tester:** test-chrome  
**Dev server:** http://localhost:3001 (ESCX23 — port 3000 obsazen projektem Hairland)

---

## TASK-022 Chrome audit — GSC fixy (aktualizace)

**Testováno:** localhost:3001  
**Stránky otevřeny v Chrome:** profil/emily, slevy, faq

### 1. Badge overlap (CSS fix)

**Status: PASS ✓**

`globals.css` obsahuje:
- `.girl-tag-pill` → `left: 8px; max-width: calc(100% - 80px)` ✓
- `.girl-media-pills` → `right: 8px` ✓
- `max-width` guard zabraňuje přesahu na mobilu ✓

### 2. Sitemap cleanup (/join, /podminky, /soukromi odstraněny ze STATIC_KEYS)

**Status: PASS ✓**

`/cs/podminky` → **CHYBÍ** v sitemap (správně odstraněno) ✓  
`/cs/soukromi` → **CHYBÍ** v sitemap (správně odstraněno) ✓  
`/join` → **CHYBÍ** v sitemap jako standalone (správně odstraněno) ✓  
`/cs/novinky` → přítomno ✓ (novinky ponecháno)

### 3. Blog hreflang (de/uk odstraněny)

**Status: PASS ✓**

`<link rel="alternate">` tagy na `/cs/blog/escort-praha-kompletni-pruvodce`:
```
hrefLang="en"        → https://www.lovelygirls.cz/blog/escort-praha-kompletni-pruvodce
hrefLang="cs"        → https://www.lovelygirls.cz/cs/blog/escort-praha-kompletni-pruvodce
hrefLang="x-default" → https://www.lovelygirls.cz/blog/escort-praha-kompletni-pruvodce
```
Žádné `de` ani `uk` v `<link rel="alternate">` tagách ✓  
(Note: `hrefLang` se v JS/script datech může vyskytnout — ale `<link>` tagy jsou správné)

### 4. BreadcrumbList JSON-LD — 9 stránek

**Status: PASS ✓**

| Stránka | BreadcrumbList |
|---------|---------------|
| /cs/slevy | 2× (vlastní + layout) ✓ |
| /cs/kontakt | 2× ✓ |
| /cs/o-nas | 2× ✓ |
| /cs/pridat-se (join) | 2× ✓ |
| /cs/faq | ✓ (ověřeno QA) |
| /cs/recenze | ✓ (ověřeno QA) |
| /cs/podminky | ✓ (ověřeno QA) |
| /cs/soukromi | ✓ (ověřeno QA) |
| /cs/profil/anetta | ✓ (ověřeno dříve) |

Homepage a /sluzba/ BreadcrumbList nemají — správně, tyto stránky nemají vizuální breadcrumbs.

### 5. Service links (ProfilHero + ProfilDetails)

**Status: PASS ✓**

Emily profil (`/cs/profil/emily`) — 10 service linků s i18n URL:
```
/cs/sluzba/klasicky-sex
/cs/sluzba/francouzske-libani
/cs/sluzba/striptyz
/cs/sluzba/hrani-roli
/cs/sluzba/eroticka-masaz
/cs/sluzba/oral-bez-ochrany
/cs/sluzba/oral-s-ochranou
/cs/sluzba/hluboky-oral
/cs/sluzba/poloha-69
/cs/sluzba/gfe-zkusenost-pritelkyne
```
DB slug + i18n Link = `/cs/sluzba/{slug}` ✓

Anetta nemá žádné služby v DB → 0 linků = správné chování ✓

### 6. Legacy service redirecty (next.config.ts)

**Status: PASS ✓ (ověřeno QA — zdrojový kód)**

32 redirect pravidel (8 starých URL × 4 locale) přítomno v `next.config.ts` ✓

### Celkový status TASK-022: PASS ✓

Všechny GSC fixy jsou funkční. Připraveno k commitu.

---

**Poznámka:** localhost:3000 byl obsazen projektem Hairland — ESCX23 spuštěn na portu 3001.

---

## 1. /cs/rozvrh — Rolling window tabs

**Status: PASS ✓**

Tabs zobrazují přesně 7 dní od dnešku:
```
2026-07-06 (dnes, pondělí) ← aktivní
2026-07-07 (úterý)
2026-07-08 (středa)
2026-07-09 (čtvrtek)
2026-07-10 (pátek)
2026-07-11 (sobota)
2026-07-12 (neděle)
```

- Rolling window, NENÍ Mon-Sun pevný týden ✓
- Dnes (pondělí 06.07.) je první tab ✓
- URL pattern: `/cs/rozvrh?day=YYYY-MM-DD` ✓
- Location filtr tabs také přítomny (Praha-2, Praha-3) ✓

---

## 2. /cs/divky — Karty dívek, TMRW badge, žádné duplicity

**Status: PASS ✓**

- Celkem **12 unikátních dívek** (žádné duplicity)
- Slugy: anetta, dana, eliska, elizabeth, emily, katy, luna, lyra, natalie, nika, rebeca, sara
- **TMRW badge přítomen:** 1× `girl-photo-time-tomorrow` ✓
- Žádné duplicitní profil linky ✓

---

## 3. Homepage — today/tomorrow statusy

**Status: PASS ✓**

- Homepage zobrazuje girl cards se správnými statusy
- Přítomny CSS třídy: `girl-photo-time-later` (6×) — dívky s pozdějším začátkem (08:44, shift začíná 10:00+)
- Statusy jsou live (Prague timezone) ✓

---

## 4. /cs/hashtag/blondynky-praha — dívky se správným statusem

**Status: PASS ✓**

- Stránka vrací 200 ✓
- 5 unikátních dívek zobrazeno (elizabeth, emily, katy, nika + 1 další) ✓
- Žádné duplicity ✓

---

## 5. /cs/sluzba/klasicky-sex — dívky se správným statusem

**Status: PASS ✓ (správné chování)**

- Stránka vrací 200, h1 = "Klasický sex" ✓
- V DB má službu `klasicky-sex` **pouze Emily** (1 dívka)
- Emily má schedule: `day_of_week=1` (úterý) a `day_of_week=3` (čtvrtek)
- Dnešní den je **pondělí** → `pragueDayOfWeek()=0` → Emily nemá v pondělí směnu → `status='off'` → filtrována
- Stránka správně zobrazuje **0 společnic** (žádná není dostupná v pondělí)
- **Toto je správné chování** — není to bug

---

## 6. Sitemap — /podminky, /soukromi, /join, /novinky

**Status: PASS ✓**

Sitemap `http://localhost:3001/sitemap.xml` obsahuje:
```
https://www.lovelygirls.cz/cs/novinky     ✓
https://www.lovelygirls.cz/cs/podminky    ✓
https://www.lovelygirls.cz/cs/pridat-se   ✓
https://www.lovelygirls.cz/cs/soukromi    ✓
https://www.lovelygirls.cz/join           ✓ (EN verze)
```

Hreflang pro `/join` je správné:
- EN: `/join`, CS: `/cs/pridat-se`, x-default: `/join` ✓

---

## 7. llms.txt — datum 2026-07-06, Praha 1 + Praha 3

**Status: PASS ✓**

- `Last updated: 2026-07-06.` ✓
- Praha 1 přítomna: `Nové Město — Prague 1` ✓
- Praha 3 přítomna: `Žižkov — Prague 3` ✓
- Praha 2 přítomna: `Vinohrady — Prague 2` ✓
- Site overview zmíní: `Prague 1 — Nové Město, Prague 2 — Vinohrady, Prague 3 — Žižkov` ✓

Poznámka: URL v llms.txt ukazují na `localhost:3001` (normální pro dev server, na prod se použije `NEXT_PUBLIC_SITE_URL`).

---

## Shrnutí

| Test | Status | Detail |
|------|--------|--------|
| Rozvrh — rolling window 7 dní | PASS ✓ | 06.07.–12.07. |
| Rozvrh — začíná dneškem (pondělí) | PASS ✓ | |
| /cs/divky — 12 unikátních karet | PASS ✓ | Žádné duplicity |
| /cs/divky — TMRW badge | PASS ✓ | 1× tomorrow badge |
| Homepage — live statusy (later) | PASS ✓ | |
| /cs/hashtag/blondynky-praha | PASS ✓ | 5 dívek |
| /cs/sluzba/klasicky-sex | PASS ✓ | 0 dívek v pondělí = správné |
| Sitemap: podminky/soukromi/join/novinky | PASS ✓ | |
| llms.txt: datum + Praha 1 + Praha 3 | PASS ✓ | |

## CELKOVÝ STATUS: PASS ✓

Všechny testované funkce fungují správně. Web je připraven k commitu.
