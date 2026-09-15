# TASK-012 Chrome Test Report — /booking/quick operátorský panel

**Datum:** 2026-09-14  
**Tester:** test-chrome agent  
**Prostředí:** Lokální server (port 3001), přihlášení jako admin  

---

## Shrnutí

/booking/quick se **nespustí** kvůli kritické chybě v SQL dotazu. Všechny ostatní testy jsou blokovány touto chybou.

---

## KRITICKÁ CHYBA — BLOCKER

### SQLITE_ERROR: no such column: type

**Soubor:** `/Users/zen/Projects/ESCX23/lib/booking-actions.ts` — řádek 449–451  
**Funkce:** `getWeekSchedulesForAll()`

**Vadný SQL dotaz (aktuálně):**
```sql
SELECT girl_id, date, type, start_time, end_time
FROM schedule_exceptions
```

**Správný SQL dotaz (fix):**
```sql
SELECT girl_id, date, exception_type, start_time, end_time
FROM schedule_exceptions
```

**Proč to padá:** Tabulka `schedule_exceptions` má sloupec `exception_type` (s prefixem), nikoliv `type`. SQLite vrátí `SQLITE_ERROR: no such column: type` a celá stránka selže s 500.

**Ověřeno:** DB schema (data/app.db) obsahuje:
```sql
exception_type TEXT NOT NULL CHECK(exception_type IN ('unavailable', 'custom_hours'))
```

**Stack trace z browseru:**
```
Runtime LibsqlError: SQLITE_ERROR: no such column: type
at getWeekSchedulesForAll (lib/booking-actions.ts:449:34)
```

---

## Výsledky testů

### TEST 1: Načtení stránky /booking/quick
**Status: FAIL (BLOCKER)**  
Stránka padá s 500 chybou ihned po načtení. Zobrazí se Next.js error overlay se stack trace výše.

### TEST 2: Auth guard
**Status: PASS**  
Nepřihlášený uživatel → redirect 307 na `/booking`. Login stránka existuje a funguje.

### TEST 3: Login
**Status: PASS** (lokálně)  
`info@lovelygirls.cz / Test2026!` → úspěšný login → redirect na `/booking/dashboard`.  
Dashboard se načte správně, sidebar obsahuje: Rychlá rezervace, Dashboard, Kalendář, Klienti, Rozvrh směn, Dívky, Pobočky, Reporty, Nastavení, Audit log, Uživatelé, TG Bot.

### TEST 4–10: Veškeré funkce panelu
**Status: NELZE TESTOVAT**  
Blokováno kritickou chybou v TEST 1. Jakmile se naviguje na `/booking/quick`, stránka selže ještě před renderem UI.

---

## Screenshoty

Uloženo v `/tmp/booking-quick-test/`:
- `v3-00-login.png` — login stránka (PASS)
- `v3-01-after-login.png` — dashboard po přihlášení (PASS)
- `v3-01-quick.png` — crash na /booking/quick se stack trace (FAIL)
- `v3-error.png` — error stránka

---

## Požadovaná oprava

**Implementátor musí opravit `lib/booking-actions.ts:451`:**

Změnit:
```ts
SELECT girl_id, date, type, start_time, end_time
FROM schedule_exceptions
```

Na:
```ts
SELECT girl_id, date, exception_type, start_time, end_time
FROM schedule_exceptions
```

Po opravě je nutné znovu provést celý test panel (TEST 1–10).

---

## Produkce vs. Lokál

- **Produkce (lovelygirls.cz/booking/quick):** Nedostupná pro testování — admin credentials produkce neznámy.
- **Lokální server (port 3001):** Testováno s resetovaným heslem `Test2026!` přes `scripts/set-admin-password.mjs`.

---

**Závěr:** Panel nelze uvolnit do produkce dokud není opravena chyba v `getWeekSchedulesForAll()`. Fix je triviální (jedna změna názvu sloupce), ale musí ho provést implementátor + projít opětovným testem.
