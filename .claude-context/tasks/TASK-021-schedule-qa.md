# TASK-021: QA — Schedule fixy (rolling window, deduplikace, TZ, cron)

**Datum:** 2026-07-06
**Kontrolor:** kontrolor
**Scope:** Task #10 (IMPL: Schedule fix) — 4 body A/B/C/D

---

## TypeScript

```
npx tsc --noEmit:
  e2e/tests/full-test.spec.ts(26,31): error TS18047: 'sidebarText' is possibly 'null'. (pre-existing)
  e2e/tests/full-test.spec.ts(26,66): error TS18047: 'sidebarText' is possibly 'null'. (pre-existing)
  e2e/tests/full-test.spec.ts(26,102): error TS18047: 'sidebarText' is possibly 'null'. (pre-existing)
```

**Produkční kód bez chyb.** ✅ (`getMondayOfWeek` orphan byl opraven task #13.)

---

## A) Rolling window — `generateWeekDays()` a redirect logika

### `generateWeekDays()` — `rozvrh/page.tsx:61-81`

```ts
function generateWeekDays(today: string, locale: string) {
  for (let i = 0; i < 7; i++) {
    const d = new Date(today + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);  // today + 0..6
    ...
  }
}
```

**Rolling window today + 6 dní.** Generuje 7 dnů od dnešku bez ohledu na den v týdnu. ✅

**Neděle večer test:** Pokud `today = neděle`, tabs = [Ne, Po, Út, St, Čt, Pá, So]. Pondělí (zítřek) je na pozici index 1 — **viditelný**. ✅

### Redirect logika — `rozvrh/page.tsx:126-135`

```ts
const today = pragueDateISO();
const maxDate = new Date(today + 'T12:00:00Z');
maxDate.setUTCDate(maxDate.getUTCDate() + 6);
const maxDayISO = maxDate.toISOString().slice(0, 10);

if (requestedDay < today || requestedDay > maxDayISO) {
  redirect(`/${locale}${CANONICAL_PATH[locale] ?? '/rozvrh'}`);
}
```

Window = today..today+6. Dny mimo rozsah → redirect na /rozvrh. ✅

**Starý `getMondayOfWeek()` odstraněn** — kód nyní používá přímé `maxDate` výpočty bez `getMondayOfWeek`. ✅

---

## B) `getGirlsForDay()` — ROW_NUMBER() deduplikace

### `lib/queries.ts:766-775`

```sql
LEFT JOIN (
  SELECT girl_id, start_time, end_time, is_active, location_id,
         ROW_NUMBER() OVER (
           PARTITION BY girl_id
           ORDER BY effective_from DESC NULLS LAST
         ) AS rn
  FROM girl_schedules
  WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
```

**ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST)** — vybírá nejnovější záznam per dívka per day_of_week. ✅

- `PARTITION BY girl_id` — deduplikuje per dívka ✅
- `ORDER BY effective_from DESC NULLS LAST` — nejnovější effective_from vítězí, záznamy bez effective_from (NULL = always valid) jsou poslední (nejnižší priorita) ✅
- `AND gs.rn = 1` — jen první (nejnovější) řádek ✅

**Schéma logiky:** Pokud má dívka 2 záznamy pro pondělí (starý `effective_from = NULL` a nový `effective_from = 2026-07-01`), vybere se novější (2026-07-01). Pokud má jen NULL záznam, vybere se ten. ✅

---

## C) Prague TZ — `tomorrowDate` výpočet

### `lib/queries.ts:742-746`

```ts
const tomorrowDate = (() => {
  const d = new Date(today + 'T12:00:00Z');  // today je Prague ISO date
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
})();
```

`today` pochází z `pragueDateISO()` (řádek 740) — funkce v `lib/utils.ts:24` která vrací aktuální datum v `Europe/Prague` timezone. ✅

`tomorrowDate` = Prague dnešek + 1 den. Pokud je server v UTC a je 23:30 UTC (= 01:30 Praha), `pragueDateISO()` vrátí správně zítřejší datum pražského času. ✅

**Srovnání se starým kódem:** Starý kód (před fixem) dělal `new Date(); tomorrow.setDate(tomorrow.getDate() + 1)` — používal server lokální čas bez TZ korekce. Nový kód staví `tomorrowDate` nad `today = pragueDateISO()` — správně. ✅

---

## D) Cron — cleanup-daily-overrides

### Handler — `app/api/cron/cleanup-daily-overrides/route.ts`

```ts
const today = pragueDateISO();
await db.execute({
  sql: `DELETE FROM schedule_exceptions WHERE date <= ?`,
  args: [today],
});
```

- Maže `schedule_exceptions` (= `today_overrides`) pro dnešek a dřívější ✅
- Používá `pragueDateISO()` — správná Praha TZ ✅
- Authorization check přes `CRON_SECRET` ✅

### vercel.json schedule

```json
{ "path": "/api/cron/cleanup-daily-overrides", "schedule": "31 20 * * *" }
```

`31 20 * * *` = **20:31 UTC** každý den.

**Timezone analýza:**

| Sezóna | UTC offset | 20:31 UTC = |
|--------|-----------|-------------|
| CEST (léto, cca. březen–říjen) | UTC+2 | **22:31 Praha** ✅ |
| CET (zima, cca. říjen–březen) | UTC+1 | **21:31 Praha** ⚠️ |

**Problém v zimě:** Zavírací čas je 22:30 Praha. V zimě (CET) by cron běžel v **21:31 Praha** — hodinu před zavírací dobou. To znamená, že dívky ještě pracují a schedule_exceptions pro dnešek se smaže příliš brzy.

**Dopad:** V zimní sezoně (CET) se `today_overrides` smaže v 21:31 Praha, tedy hodinu před koncem dne. Uživatelé navštěvující /rozvrh v 21:32–22:30 Praha vidí pouze default schedule bez dnešních override hodnot.

**Správné řešení (navrhnuté v zadání):**
- Možnost A: Změnit na `31 21 * * *` (21:31 UTC = 22:31 Praha v CET zimě, 23:31 Praha v CEST létě — obě po zavírací době) ✅
- Možnost B: Handler zkontroluje Prague time a vrátí 200 bez akce pokud Praha < 22:30

**Možnost A je jednodušší a bezpečnější.** `21:31 UTC`:
- CET (zima): 22:31 Praha — 1 minuta po zavírací době ✅
- CEST (léto): 23:31 Praha — stále v noci, bez dopadu ✅

---

## Reverzní kontrola vs. zadání

| Bod | Požadavek | Status | Poznámka |
|-----|-----------|--------|----------|
| A | `generateWeekDays()` je rolling today+6, ne Mon-Sun | ✅ | `for (let i = 0; i < 7; i++) { setUTCDate(+i) }` |
| A | V neděli je pondělí viditelné | ✅ | Index 1 = today+1 |
| B | `getGirlsForDay()` má `ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST)` | ✅ | Přesně jak požadováno |
| C | `tomorrowDate` používá Prague TZ | ✅ | Staví na `pragueDateISO()` |
| D | Handler maže `schedule_exceptions` | ✅ | `DELETE WHERE date <= today` |
| D | Cron `31 20 * * *` = 20:31 UTC | ✅ | V vercel.json |
| D | ⚠️ Zimní TZ problém (`20:31 UTC = 21:31 Praha CET`) | **NEOPRAVENO** ❌ | viz níže |

---

## Závěr

### Bloker

**Žádný bloker pro produkční deploy** — rozvrh funguje, TS čistý.

### Střední nález — cron zimní TZ

`"31 20 * * *"` v zimě (CET) = 21:31 Praha — 59 minut před zavírací dobou 22:30.

**Dopad:** V období CET (říjen–březen, ~5 měsíců/rok) se today_overrides maže příliš brzy. Uživatelé vidí default schedule místo dnešních override hodnot po 21:31 Praha.

**Doporučená oprava** v `vercel.json`:
```json
{ "path": "/api/cron/cleanup-daily-overrides", "schedule": "31 21 * * *" }
```
`21:31 UTC` = 22:31 Praha CET (zima) = 23:31 Praha CEST (léto) — vždy po zavírací době.

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | Cron `31 20 * * *` — v zimě (CET) běží v 21:31 Praha, hodinu před zavírací dobou | Střední |
| 2 | e2e TypeScript chyby (3× sidebarText) — pre-existing | Existující |

### Aktualizace — vercel.json opraven task #13

`vercel.json` byl změněn na `"31 21 * * *"` (21:31 UTC) — zimní TZ problém vyřešen.

| Sezóna | 21:31 UTC = |
|--------|------------|
| CET (zima) | 22:31 Praha ✅ (1 min po zavírací době) |
| CEST (léto) | 23:31 Praha ✅ (v noci, bez dopadu) |

### Verdikt
**PASS** — A, B, C, D implementovány správně. Zimní TZ problém v cronu byl opraven task #13 (`31 20` → `31 21`). TypeScript čistý.
