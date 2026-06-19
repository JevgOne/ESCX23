# TASK-006 QA Report — Eyebrow fix + Trust row + DB data poboček

**Datum:** 2026-06-02  
**Kontrolor:** kontrolor agent  
**Status: PASSED — vše OK**

---

## 1. Simplify kontrola

Kód je čistý. Žádné zbytečné duplicity ani zbytečná složitost.

---

## 2. Debug kontrola

### npm run build
✅ **BUILD PASSED** — žádné errors, žádné warnings

### TypeScript (npx tsc --noEmit)
✅ **PASSED** — žádné chyby

### ESLint
⚠️ ESLint hlásí chybějící `eslint.config.js` (ESLint v9 formát) — toto je **pre-existing issue**, nesouvisí s tasky #4/#5. Build přes Next.js funguje normálně.

---

## 3. Reverzní kontrola

### Bug 1: Eyebrow fix — PASSED ✅

Všech 6 komponent zkontrolováno:

| Komponenta | Stav |
|---|---|
| `components/home/ActivityFeed.tsx:19` | ✅ `{t('eyebrow')}` bez `— ` |
| `components/home/GirlsGridSection.tsx:24` | ✅ `{t('eyebrow')}` bez `— ` |
| `components/home/ContactSteps.tsx:14` | ✅ `{t('eyebrow')}` bez `— ` |
| `components/home/HashtagCloud.tsx:54` | ✅ `{t('eyebrow')}` bez `— ` |
| `components/home/LocationsRow.tsx:38` | ✅ `{t('eyebrow')}` bez `— ` |
| `components/home/ReviewsStrip.tsx:45` | ✅ `{t('eyebrow')}` bez `— ` |

CSS v `globals.css:290-293`:
```css
.section-eyebrow::before {
  content: '— ';
  letter-spacing: normal;
}
```
✅ Dash přidán přes `::before` s `letter-spacing: normal` — správně.

Poznámka: `LocationsRow.tsx:78` obsahuje `10:00 — 22:30` — to je time range v textu, NEjedná se o eyebrow prefix. OK.

### Bug 2: Trust row overflow — PASSED ✅

| Selector | Řádek | overflow |
|---|---|---|
| `.trust-row` | `globals.css:1363` | ✅ `overflow: hidden` |
| `.trust-icon` | `globals.css:1391` | ✅ `overflow: hidden` |

### DB data poboček — PASSED ✅

Databáze (`data/app.db`) obsahuje správná data:

| name | display_name | opening_date |
|---|---|---|
| `praha-2` | Nové Město, Praha 2 | `null` (aktivní) |
| `praha-3` | Žižkov, Praha 3 | `2026-06-18` ✅ |
| `praha-5` | Anděl, Praha 5 | `2026-07-25` ✅ |

Žižkov = 18.6.2026, Smíchov (Praha 5/Anděl) = 25.7.2026 — odpovídá zadání.

---

## Souhrn

| Oblast | Výsledek |
|---|---|
| Eyebrow fix (6 komponent) | ✅ OK |
| CSS `::before` s `letter-spacing: normal` | ✅ OK |
| Trust row `overflow: hidden` | ✅ OK |
| Trust icon `overflow: hidden` | ✅ OK |
| DB: praha-3 opening_date | ✅ 2026-06-18 |
| DB: praha-5 opening_date | ✅ 2026-07-25 |
| Build | ✅ PASSED |
| TypeScript | ✅ PASSED |

**Nález: ŽÁDNÉ bloky. Implementace je správná a kompletní.**
