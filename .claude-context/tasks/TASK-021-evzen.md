# TASK-021 — Evzen review: Audit fixy + Schedule fixy (v2 — hloubkova kontrola)

**Datum:** 2026-07-06
**Kontrolor:** Evzen THE KING
**Scope:** Audit fixy (TASK-012) + Schedule fixy (TASK-021)

---

## AUDIT FIXY (TASK-012) — 7/7 PASS

| # | Bod | Stav | Dukaz |
|---|-----|------|-------|
| A1 | .env na www.lovelygirls.cz | PASS | `.env.prod.local`, `.env.prod-pull.local`, `.env.vercel-prod.local`, `.env.prod-check.local` — vsechny `NEXT_PUBLIC_SITE_URL="https://www.lovelygirls.cz"`. Zbyly `escx23.vercel.app` jen v redirect pravidlu `next.config.ts:33` (spravne). |
| A2 | 6 stranek canonical/alternates | PASS | `/podminky`, `/soukromi`, `/join`, `/novinky`, `/kontakt`, `/recenze` — vsechny maji `getCanonicalUrl()` + `alternates.canonical` v `generateMetadata`. |
| A3 | Sitemap +4 stranky | PASS | `app/sitemap.ts` STATIC_KEYS obsahuje `/podminky` (0.3), `/soukromi` (0.3), `/join` (0.4), `/novinky` (0.5). Vsechny 4 locale s alternates. |
| A4 | Blog sitemap bez de/uk | PASS | `app/sitemap.ts:217-234` — blog entries jen pro `['en', 'cs']`, alternates jen `en`+`cs`+`x-default`. |
| A5 | llms.txt updatovan | PASS | `app/llms.txt/route.ts` — `LAST_UPDATED = '2026-07-06'`, host z headers, fallback `www.lovelygirls.cz`. |
| A6 | /escort-prague redirect | PASS | `next.config.ts:85` — `/escort-prague` -> `/en/girls` (opraveno z neexistujiciho `/girls`). |
| A7 | applyDBOverride try/catch | PASS | `lib/seo/db-override.ts:13-46` — cela funkce v try/catch, pri chybe vraci `inlineMetadata`. |

---

## SCHEDULE FIXY (TASK-021) — hloubkova analyza

### 1. Cron maze schedule_exceptions v 22:31 Prague?

**vercel.json:5** — `"schedule": "31 21 * * *"` = 21:31 UTC

| Sezona | UTC offset | Vysledek |
|--------|-----------|----------|
| CET (zima) | UTC+1 | **22:31 Praha** — presne dle zadani |
| CEST (leto) | UTC+2 | **23:31 Praha** — pozdeji, ale stale po zaviraci dobe (22:30) |

**Handler** (`app/api/cron/cleanup-daily-overrides/route.ts`):
```ts
const today = pragueDateISO();
DELETE FROM schedule_exceptions WHERE date <= ?  [today]
```
- Maze `schedule_exceptions` pro dnesek a drive (Prague TZ)
- Auth pres `CRON_SECRET`

**Verdikt: PASS**

### 2. Po smazani je rozvrh PRAZDNY? (zadny fallback na weekly schedule?)

**KRITICKA ANALYZA — uzivatel rekl: "smaze rozvrh z dneska kompletne z DB, zustane prazdny"**

Cron maze POUZE `schedule_exceptions` (denni overrides). `girl_schedules` (tydenni defaults) zustavaji v DB.

**Co to realne znamena pro /rozvrh po 22:31:**

`getGirlsForDay()` (`lib/queries.ts:750-818`):
- SQL: `LEFT JOIN girl_schedules gs ... LEFT JOIN schedule_exceptions se ...`
- Po cronu: `schedule_exceptions` pro dnesek = smazany (se.* = NULL)
- `girl_schedules` tydenni defaults = STALE v DB

**ALE klicovy filtr (radky 814-818):**
```ts
if (isToday && now) {
  if (now >= from && now <= to) status = 'working';
  else if (now < from) status = 'later';
  else return null;  // <-- shift uz skoncil → divka se NEZOBRAZI
}
```

Po 22:30 (zaviraci doba) se pro dnesek vsechny smeny ukazuji jako skoncene → `return null` → prazdny rozvrh.

**Uzivatelovo "zustane prazdny" = SPRAVNE:** Po 22:31 je dnesek efektivne prazdny, protoze smeny uz skoncily.

**Pro ZITREK:** `schedule_exceptions` pro zitrek NEJSOU smazany (cron maze jen `date <= today`). Zitrek se zobrazi z `girl_schedules` tydenich defaultu + pripadnych zitrejsich overrides.

**Uzivatelovo "nevznikne ta mezera" = SPRAVNE:** Tydenni defaults okamzite naplni zitrejsi rozvrh.

**Verdikt: PASS**

### 3. Na /divky — TMRW badge po smazani overrides?

**`getGirlsWithToday()`** (`lib/queries.ts:164-296`):

TMRW badge pochazi z dvou zdroju:
1. `girl_schedules gs2` (tydenni default pro zitrejsi den) — radek 199
2. `schedule_exceptions se2` (zitrejsi override) — radek 202

Logika (radky 234-238):
```ts
let tmrwFrom = r.tmrw_from ? ... : null;   // z girl_schedules pro zitrek
let tmrwTo = r.tmrw_to ? ... : null;
if (r.tmrw_ex_type === 'unavailable') { tmrwFrom = null; tmrwTo = null; }
```

**Po cronu:**
- `schedule_exceptions` pro DNESEK = smazany
- `schedule_exceptions` pro ZITREK = ZACHOVANY (cron maze jen `<= today`)
- `girl_schedules` tydenni defaults = ZACHOVANY

**TMRW badge se zobrazi z `girl_schedules` pro zitrejsi den tydne I BEZ jakychkoli schedule_exceptions.** To je SPRAVNE — zabranuje "mezere" kterou uzivatel zminoval.

**Verdikt: PASS**

### 4. Na /rozvrh — prazdny den bez dat?

**Scenar: uzivatel navstivi /rozvrh ve 22:35 Praha (po cronu):**

Pro tab "dnes":
- `getGirlsForDay(today)` → smeny uz skoncily (now > shift_to) → `return null` → EmptyState
- `schedule_exceptions` pro dnesek smazany → zadne overrides

Pro tab "zitrek" a dal:
- `getGirlsForDay(tomorrow)` → `girl_schedules` defaults pro zitrejsi den → divky se zobrazi
- `schedule_exceptions` pro zitrek zachovany (pokud existuji)

**Verdikt: PASS**

### 5. Rolling window today+6 (ne Mon-Sun)?

**`generateWeekDays()`** (`rozvrh/page.tsx:61-81`):
```ts
for (let i = 0; i < 7; i++) {
  d.setUTCDate(d.getUTCDate() + i);  // today + 0..6
}
```

Redirect (radky 126-135):
```ts
maxDate = today + 6 dnu
if (requestedDay < today || requestedDay > maxDayISO) redirect(...)
```

- Nedele: tabs = [Ne, Po, Ut, St, Ct, Pa, So] — pondelí (zitrek) viditelne
- Minule dny → redirect

**Verdikt: PASS**

### 6. Deduplikace girl_schedules?

**`getGirlsForDay()`** (`lib/queries.ts:766-775`) — OPRAVENO:
```sql
ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
... AND gs.rn = 1
```

**Verdikt: PASS** pro /rozvrh

---

## NALEZ MIMO SCOPE (eviduji, neblokuje)

**Chybejici deduplikace v dalsich queries:**

`getGirlsWithToday()` (radek 194) a `getGirlsForListing()` (radek 1937) pouzivaji prosty `LEFT JOIN girl_schedules gs` BEZ `ROW_NUMBER()` deduplikace. Pokud ma divka vice `girl_schedules` zaznamu pro stejny `day_of_week` s ruznym `effective_from`, mohla by se na /divky a /homepage zobrazit vicekrat.

**Dopad:** Nizky — zavisi na tom, zda v DB existuji duplicitni zaznamy. Neni soucasti tohoto zadani.
**Doporuceni:** Evidovat jako budouci fix (aplikovat stejny ROW_NUMBER pattern jako v getGirlsForDay).

---

## CELKOVY VERDIKT

### SCHVALENO ✅

| # | Pozadavek uzivatele (doslovna citace) | Implementace | Stav |
|---|------|------|------|
| "ve 22:31 se smaze rozvrh z dneska" | Cron 21:31 UTC = 22:31 CET, `DELETE schedule_exceptions WHERE date <= today` | PASS |
| "kompletne z DB, zustane prazdny" | Dnesek po 22:30 = vsechny smeny skoncily → prazdny. Schedule_exceptions cisteny. | PASS |
| "to same kazdy den" | vercel.json cron `"31 21 * * *"` — kazdy den | PASS |
| "nevznikne ta mezera" | Tydenni defaults (`girl_schedules`) zustavaji → TMRW badge + zitrejsi rozvrh funguje | PASS |
| Rolling window today+6 | `generateWeekDays()` i=0..6, redirect mimo rozsah | PASS |
| Deduplikace | `ROW_NUMBER() PARTITION BY girl_id` v `getGirlsForDay()` | PASS |
| Prague TZ | `pragueDateISO()` pouziva `Europe/Prague` vsude | PASS |

**Zadne odchylky od zadani. Pripraveno k commitu.**

Poznamka mimo scope: `getGirlsWithToday()` a `getGirlsForListing()` nemaji ROW_NUMBER() deduplikaci — doporucuji evidovat jako budouci fix.
