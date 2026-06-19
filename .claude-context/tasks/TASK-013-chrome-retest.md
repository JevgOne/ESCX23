# TASK-013-chrome-retest — Chrome Re-test: Homepage po s.caption fix

**Datum:** 2026-06-02  
**Tester:** TEST-CHROME  
**Dev server:** http://localhost:3000

---

## Souhrn

| # | Test | Výsledek |
|---|------|----------|
| 1 | Homepage se renderuje bez erroru | FAIL — nový crash |
| 2 | LocationsRow — Žižkov/Smíchov badges | FAIL — stránka se nevyrenderuje |
| 3 | Stories row — funguje | FAIL — stránka se nevyrenderuje |

---

## Detaily

### TEST 1: Homepage render — FAIL

**URL:** http://localhost:3000/cs  
**HTTP status:** 500

`s.caption` fix byl aplikován, ale homepage stále crashuje s **novou chybou**:

```
SQLITE_ERROR: no such column: g.vip
```

- `#__next_error__` element přítomen v DOM
- Zobrazí se: "This page couldn't load — A server error occurred."
- Stránka se nevyrenderuje

**Předchozí chyba (opravena):** `SQLITE_ERROR: no such column: s.caption`  
**Nová chyba:** `SQLITE_ERROR: no such column: g.vip`

Sloupec `g.vip` chybí v DB schématu. Pravděpodobně SQL dotaz na companions/girls tabulce referuje sloupec `vip` který nebyl migrován.

---

### TEST 2: LocationsRow badges — FAIL (nelze ověřit)

- Stránka crashuje, žádné visible elements
- RSC payload v HTML source OBSAHUJE badge data (18.6 a 25.7 přítomny)
- Vizuálně nelze ověřit — `loc-row` elementy: 0

---

### TEST 3: Stories row — FAIL (nelze ověřit)

- Stránka crashuje, `stories` elementy: 0
- Nelze ověřit zda stories fungují

---

## Blokující bug: `SQLITE_ERROR: no such column: g.vip`

**Příznaky:**
- HTTP 500 na `/cs` (a pravděpodobně i ostatní locale homepage)
- Console error: `SQLITE_ERROR: no such column: g.vip`

**Dopad:**
- Homepage nefunkční
- Vše na homepage nelze vizuálně ověřit

**Doporučená oprava:**
Najít SQL dotaz s `g.vip` v homepage server component (pravděpodobně v companions/girls query) a opravit — buď přidat migraci pro sloupec `vip`, nebo odebrat referenci pokud sloupec neexistuje v DB schématu.

---

## Závěr

Fix `s.caption` byl aplikován ale odkryl další DB chybu `g.vip`. Homepage stále nefunkční. Potřeba další oprava.
