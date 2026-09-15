# TASK-012 Chrome Retest Report — /booking/quick po opravě exception_type

**Datum:** 2026-09-14  
**Tester:** test-chrome agent  
**Prostředí:** Lokální server (port 3001), přihlášení jako info@lovelygirls.cz  

---

## Shrnutí

Původní bug (`type` → `exception_type`) je opravený. Ale stránka stále padá — nová chyba v `app/booking/quick/page.tsx:12`: SQL dotazuje sloupec `base_price`, který v tabulce `pricing_plans` neexistuje (správný název je `price`).

---

## Výsledky testů

### TEST 1: Stránka se načte bez chyb
**Status: FAIL — nová SQL chyba**

```
SQLITE_ERROR: no such column: base_price
app/booking/quick/page.tsx (11:31) @ QuickBookingPage
```

SQL v page.tsx řádek 12:
```sql
SELECT duration, base_price FROM pricing_plans WHERE is_active = 1 ORDER BY duration
```

Správný název sloupce (ověřeno schématem DB):
```sql
SELECT duration, price FROM pricing_plans WHERE is_active = 1 ORDER BY duration
```

### TEST 2–10: Veškeré funkce panelu
**Status: NELZE TESTOVAT** — blokováno crashem v TEST 1.

---

## Stav oprav

| Bug | Soubor | Status |
|-----|--------|--------|
| `se.type` → `se.exception_type` | `lib/booking-actions.ts:451` | OPRAVENO |
| `base_price` → `price` | `app/booking/quick/page.tsx:12,16` | NEOPRAVENO — nový blocker |

---

## Potřebná oprava

**Soubor:** `/Users/zen/Projects/ESCX23/app/booking/quick/page.tsx`

Řádek 12 — změnit:
```ts
'SELECT duration, base_price FROM pricing_plans WHERE is_active = 1 ORDER BY duration',
```
Na:
```ts
'SELECT duration, price FROM pricing_plans WHERE is_active = 1 ORDER BY duration',
```

Řádek 16 — změnit:
```ts
price: Number(r.base_price),
```
Na:
```ts
price: Number(r.price),
```

---

## Login + Auth guard

- Login (`info@lovelygirls.cz / Test2026!`) → PASS, redirect na `/booking/dashboard`
- Auth guard → PASS (bez přihlášení redirect 307 na `/booking`)

---

## Screenshoty

Uloženo v `/tmp/booking-retest/`:
- `01-login.png` — login stránka
- `02-after-login.png` — dashboard
- `03-quick-load.png` — crash na /booking/quick (base_price error)

---

**Závěr:** Jeden SQL bug opraven, ale vznikl druhý. Po opravě `base_price` → `price` v page.tsx je potřeba znovu spustit retest.
