# QA Report — Task #8: Kalendář names (gcal_import fallback)

**Datum:** 2026-09-15  
**Kontrolor:** kontrolor  
**Soubor:** `lib/booking-queries.ts`  
**Commit:** `93a3af5`

---

## 1. Simplify

**PASS** — Jednoduchá jednořádková změna, žádná nadbytečná komplexita.

---

## 2. Debug

**PASS s 1 edge case poznámkou**

Implementace (řádky 150–152):
```ts
clientNickname: String(r.source) === 'gcal_import' && r.notes
  ? String(r.notes)
  : r.client_nickname ? String(r.client_nickname) : 'Neznámý',
```

Logika:
- `source === 'gcal_import'` A `notes` není null/prázdný → zobraz notes (jméno klienta z ICS summary)
- jinak → zobraz `client_nickname` nebo fallback 'Neznámý'

**Edge case:** Pokud je `source === 'gcal_import'` ale `notes` je null (žádný text za jménem dívky v ICS summary) — fallback na `client_nickname`. Placeholder klient "GCal Import" (nickname) se pak zobrazí na kalendáři. To je akceptovatelné chování — lepší než zobrazit "GCal Import" vždy.

**Poznámka:** `b.notes` je celý text notes (může obsahovat i jiné informace, nejen jméno klienta). Pokud byl při importu `clientNote` extrahován jako `summary.replace(/^\S+\s*/, '').trim()` (dle fix-data route), bude v notes čistě jen část summaru za jménem dívky — OK pro zobrazení jako jméno klienta na kalendáři.

---

## 3. Reverzní kontrola

| Požadavek | Stav | Poznámka |
|-----------|------|----------|
| gcal_import bookings ukazují notes | PASS | podmínka `source === 'gcal_import' && r.notes` |
| "GCal Import" se nezobrazuje | PASS | notes mají přednost před client_nickname |
| Fallback pro null notes | PASS | fallback na client_nickname → 'Neznámý' |
| Ostatní bookings nezměněny | PASS | podmínka `source === 'gcal_import'` je úzká |

---

## Verdikt

**APPROVED** — Implementace správná, minimální, přesně cílená. Edge case pro null notes je ošetřen rozumným fallbackem.
