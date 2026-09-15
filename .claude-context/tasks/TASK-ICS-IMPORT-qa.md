# QA Report — Task #1: ICS Import

**Datum:** 2026-09-15  
**Kontrolor:** kontrolor  
**Soubor:** `app/api/admin/fix-data/route.ts`  
**Commity:** `8e8b9ae`, `49cad6a`

---

## 1. Simplify — kvalita kódu

**PASS** — Kód je přehledný, dobře strukturovaný.

Poznámky:
- Hardcoded `GIRL_ID_MAP` je na řádku 5–10, jasně okomentován jako "primary, reliable" — záměrné a správné pro one-time import.
- DB fallback pro nové dívky (řádky 63–69) je dobrý safety net.
- Alias support (`caty→katy`, `victoria→viktoria`) je v mappingu, funguje korektně.
- `try/catch` je přítomen na obou POST i GET handlerech, chyby loguje do `console.error` a vrací 500 s detail zprávou.
- Auth check přes `IMPORT_SECRET` env var je na začátku obou handlerů — správně.
- Placeholder client `LG-GCAL` je vytvořen jako idempotentní operace (SELECT → INSERT only if missing) — správně.
- Duplicate check (řádky 85–95) porovnává `girl_id + date + start_time` a vylučuje cancelled/expired stavy — správně.

**Žádné zjednodušení není potřeba.**

---

## 2. Debug — potenciální chyby

**PASS s 1 drobnou poznámkou**

Potenciální issue:
- Řádek 98: `const clientNote = summary.replace(/^\S+\s*/, '').trim() || null;` — extrahuje text za prvním slovem jako client note. Pokud summary je pouze jméno dívky bez dalšího textu, vrátí `null`. To je správné chování, ale je to tiché — žádný log. Přijatelné pro one-time import.

Žádné kritické bugy nenalezeny:
- FK constraint ošetřen (placeholder LG-GCAL client).
- SQL injection riziko: parametrizované queries na všech místech kde se vkládají hodnoty — OK.
- `Number()` konverze pro `id` hodnoty z DB — OK pro libSQL.

---

## 3. Reverzní kontrola — porovnání se zadáním

Zadání: "21 bookings importováno, staré pending expirováno, girl ID mapping správný"

| Požadavek | Stav | Poznámka |
|-----------|------|----------|
| Import ICS bookings | PASS | endpoint přijímá `body.bookings[]` a importuje |
| 21 bookings importováno | NELZE OVĚŘIT | endpoint existuje a je funkční; počet 21 závisí na skutečném volání API, kód neomezuje počet |
| Staré pending expirováno | PASS | `body.fixPending` trigger správně updatuje status → expired |
| Girl ID mapping | PASS | 19 dívek v hardcoded mapě + DB fallback |
| Duplicate prevention | PASS | kontrola `girl_id + date + start_time` |
| Auth ochrana | PASS | Bearer token z env `IMPORT_SECRET` |
| FK constraint | PASS | placeholder LG-GCAL client (commit 49cad6a) |
| Error handling | PASS | try/catch s logováním a 500 response |

---

## Verdikt

**APPROVED** — Kód je kvalitní, bezpečný, splňuje zadání. Endpoint je připraven k použití.

Jediná otevřená věc: počet "21 importovaných bookings" je runtime fakt závislý na datech v API callu, ne na kódu samotném — nelze verifikovat staticky.
