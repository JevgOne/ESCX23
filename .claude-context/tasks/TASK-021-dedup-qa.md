# TASK-021: QA — Dedup fix všech 7 query funkcí

**Datum:** 2026-07-06
**Kontrolor:** kontrolor
**Scope:** Tasks #10, #15, #16 — ROW_NUMBER dedup + Prague TZ

---

## TypeScript

```
npx tsc --noEmit:
  e2e/tests/full-test.spec.ts(26,31): error TS18047: 'sidebarText' is possibly 'null'. (pre-existing)
  e2e/tests/full-test.spec.ts(26,66): error TS18047: 'sidebarText' is possibly 'null'. (pre-existing)
  e2e/tests/full-test.spec.ts(26,102): error TS18047: 'sidebarText' is possibly 'null'. (pre-existing)
```

**Produkční kód bez chyb.** ✅

---

## Výsledky kontroly

### 1. `getGirlsForDay()` — `lib/queries.ts:731` (task #10)

**ROW_NUMBER:**
```sql
LEFT JOIN (
  SELECT girl_id, start_time, end_time, is_active, location_id,
         ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
```
✅ ROW_NUMBER OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST)

**tomorrowDate (`lib/queries.ts:742-746`):**
```ts
const tomorrowDate = (() => {
  const d = new Date(today + 'T12:00:00Z');  // today = pragueDateISO()
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
})();
```
✅ Staví na `pragueDateISO()` — Prague TZ

---

### 2. `getGirlsForListing()` — `lib/queries.ts:1881` (task #15)

**ROW_NUMBER (2× — pro today gs a tomorrow gs2):**
```sql
LEFT JOIN (
  SELECT girl_id, start_time, end_time, is_active, location_id,
         ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
LEFT JOIN (
  SELECT girl_id, start_time, end_time, is_active, location_id,
         ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs2 ON gs2.girl_id = g.id AND gs2.rn = 1
```
✅ Obě subquery (today + tomorrow) mají ROW_NUMBER

**tomorrowDate (`lib/queries.ts:1887-1890`):**
```ts
const tomorrowD = new Date(today + 'T12:00:00Z');  // today = pragueDateISO()
tomorrowD.setUTCDate(tomorrowD.getUTCDate() + 1);
const tomorrowDate = tomorrowD.toISOString().slice(0, 10);
```
✅ Prague TZ

---

### 3. `getGirlsWithToday()` — `lib/queries.ts:167` (task #15)

**ROW_NUMBER (2× — pro today gs a tomorrow gs2):**
```sql
LEFT JOIN (
  SELECT girl_id, start_time, end_time, is_active, location_id,
         ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
LEFT JOIN (
  SELECT girl_id, start_time, end_time, is_active, location_id,
         ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs2 ON gs2.girl_id = g.id AND gs2.rn = 1
```
✅ Obě subquery mají ROW_NUMBER

**tomorrowDate (`lib/queries.ts:172-175`):**
```ts
const tomorrowD = new Date(today + 'T12:00:00Z');  // today = pragueDateISO()
tomorrowD.setUTCDate(tomorrowD.getUTCDate() + 1);
const tomorrowDate = tomorrowD.toISOString().slice(0, 10);
```
✅ Prague TZ

---

### 4. `getGirlsForHashtag()` — `lib/queries.ts:2049` (task #15)

**ROW_NUMBER:**
```sql
LEFT JOIN (
  SELECT girl_id, start_time, end_time, is_active, location_id,
         ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
```
✅ ROW_NUMBER přítomen

**tomorrowDate:** Funkce zobrazuje pouze today status (working/later/off) bez "zítra" dat — tomorrowDate nepotřebuje. ✅ Správně — hashtag stránka nezobrazuje "zítra" badge.

**today:** `const today = pragueDateISO()` ✅

---

### 5. `getGirlsForService()` — `lib/queries.ts:62` (task #16)

**ROW_NUMBER:**
```sql
LEFT JOIN (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
```
✅ ROW_NUMBER přítomen

**tomorrowDate:** Jako hashtag funkce — zobrazuje pouze today status, tomorrowDate nepotřebuje. ✅

**today:** `const today = pragueDateISO()` ✅

---

### 6. `getHomepageStats()` — `lib/queries.ts:411` (task #16)

**ROW_NUMBER:**
```sql
LEFT JOIN (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
```
✅ ROW_NUMBER přítomen

**today:** `const today = (await import('./utils')).pragueDateISO()` ✅

**Poznámka — dynamic import:** `getHomepageStats` používá `await import('./utils')` pro Prague helpers místo top-level importu. Funkčně totožné, mírně nekonzistentní se zbytkem souboru (který používá top-level import). Non-bloker.

---

### 7. `getGirlScheduleForToday()` — `lib/queries.ts:1619` (task #16)

**ROW_NUMBER:**
```sql
LEFT JOIN (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
```
✅ ROW_NUMBER přítomen. `LIMIT 1` na vnějším dotazu je redundantní (ROW_NUMBER již zaručuje max 1 řádek per girl_id) ale neškodný.

**today:** `const today = pragueDateISO()` ✅

---

## Souhrn

| Funkce | ROW_NUMBER | tomorrowDate Prague TZ | Verdikt |
|--------|-----------|----------------------|---------|
| `getGirlsForDay()` | ✅ | ✅ | PASS |
| `getGirlsForListing()` | ✅ (2×) | ✅ | PASS |
| `getGirlsWithToday()` | ✅ (2×) | ✅ | PASS |
| `getGirlsForHashtag()` | ✅ | N/A (no tomorrow) | PASS |
| `getGirlsForService()` | ✅ | N/A (no tomorrow) | PASS |
| `getHomepageStats()` | ✅ | N/A (stats only) | PASS |
| `getGirlScheduleForToday()` | ✅ | N/A (today only) | PASS |
| **TypeScript** | **✅ čistý** | | |

### Blokery
Žádné.

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | `getHomepageStats()` používá `await import('./utils')` pro Prague helpers místo top-level importu — mírně nekonzistentní | Velmi nízká |
| 2 | `getGirlScheduleForToday()` má `LIMIT 1` na vnějším dotazu — redundantní s ROW_NUMBER, ale neškodné | Ignorovatelné |
| 3 | e2e TypeScript chyby (3× sidebarText) — pre-existing | Existující |

### Verdikt
**PASS** — Všech 7 query funkcí má správný ROW_NUMBER OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) pattern. `tomorrowDate` ve funkcích kde je potřeba (getGirlsForDay, getGirlsForListing, getGirlsWithToday) staví na `pragueDateISO()` — správná Prague TZ. TypeScript čistý.
