# QA Report — Task #4: /booking/schedule stránka

**Datum:** 2026-09-15  
**Kontrolor:** kontrolor  
**Soubor:** `app/booking/schedule/page.tsx`  
**Commit:** `5372bc6`

---

## 1. Simplify — kvalita kódu

**PASS** — Kód je přehledný a dobře strukturovaný.

Poznámky:
- Helper funkce (`getMonday`, `addDays`, `fmt`, `toISO`, `getTodayDow`) jsou malé a jednoznačné — OK.
- `byDay` Map je sestavena dvakrát (desktop grid i mobile cards) ze stejných dat. Mírná duplikace, ale přijatelná — jde o odlišné rendering větve, refactor by přidal komplexitu.
- STYLES inline string na konci souboru — konzistentní pattern s ostatními stránkami projektu.
- `force-dynamic` je správně nastaven — stránka vždy fetches live data.

---

## 2. Debug — potenciální chyby

**PASS s 1 poznámkou**

Kontroly:
- `getMonday()` bez parametru bere `new Date()` — správně.
- Přechod neděle→pondělí: `day === 0 ? -6 : 1 - day` — správná logika pro ISO týden (Po=1..Ne=0).
- `isCurrentWeek` porovnání: `todayISO >= mondayISO && todayISO <= toISO(sunday)` — string ISO porovnání funguje správně pro YYYY-MM-DD formát.
- `girlIds` SQL injection: `IN (${girlIds.map(() => '?').join(',')})` s `args: girlIds` — parametrizované, OK.
- Prázdný stav (`withSchedule.length === 0` → "Zadne rozvrhy.") — ošetřen.
- `shifts!.map(...)` na řádku 214 — non-null assertion, ale předchází mu `.filter((d) => d.shifts && d.shifts.length > 0)` na řádku 188 — bezpečné.

**Poznámka:** `effective_from` field je načítán v `getAllSchedulesGrouped()` ale v page.tsx vůbec nepoužíván — rozvrhy se zobrazují bez ohledu na datum platnosti. Pokud má `effective_from` logický význam (rozvrh platný od...), stránka ho ignoruje. Není to bug pro aktuální zadání, ale možný nesoulad pro budoucí use case.

---

## 3. Reverzní kontrola — porovnání se zadáním

| Požadavek | Stav | Poznámka |
|-----------|------|----------|
| Stránka existuje (ne 404) | PASS | `app/booking/schedule/page.tsx` existuje, route `/booking/schedule` funkční |
| Týdenní grid 7 sloupců | PASS | `grid-template-columns: 140px repeat(7, 1fr)`, Mon-Sun header |
| Week navigation | PASS | `?week=YYYY-MM-DD` query param, šipky prev/next, tlačítko "Dnes" |
| Dnešní den zvýrazněn | PASS | `ws-today` class + `rgba(242,125,141,0.06)` background, coral text barva |
| Mobile responsive | PASS | `@media (max-width: 768px)` — desktop table hidden, mobile cards shown |
| Dark theme | PASS | CSS vars (`var(--bg-elev)`, `var(--line)`, `var(--text)`, `var(--muted)`) — konzistentní s projektem |
| Rozvrh všech dívek | PASS | `getAllSchedulesGrouped()` fetches active/inactive/pending girls |
| Girl filter pills | PASS (bonus) | filtrování podle dívky přes `?girl=slug` |
| Avatar + barva dívky | PASS (bonus) | foto nebo initial s girl color |
| Počet dní / týden v mobile | PASS (bonus) | "X dnu / tyden" v card header |

---

## Verdikt

**APPROVED** — Stránka splňuje všechny požadavky zadání. Implementace je čistá, responsivní, dark-theme konzistentní.

Jediná poznámka do budoucna: `effective_from` se ignoruje při zobrazení — pokud bude potřeba "rozvrh platný od data", bude nutné filtrovat `schedRes` podle tohoto pole.
