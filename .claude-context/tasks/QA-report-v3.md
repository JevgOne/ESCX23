# QA Report v3: display_name fix + data migration
**Datum:** 2026-09-20  
**Kontrolor:** kontrolor  
**Task:** #12 (IMPL: Fix location badge — display_name + data fix)

---

## VÝSLEDEK: PASS

---

## 1. TypeScript

`npx tsc --noEmit` — **PASS**, žádné chyby v produkčním kódu.

---

## 2. Grep: žádný výskyt `l.name AS location_name`

Grep přes celý projekt (`**/*.ts`, `**/*.tsx`): **0 shod**.

Starý vzor `l.name AS location_name` byl kompletně odstraněn.

---

## 3. SQL dotazy — použití `l.display_name AS location_name`

### lib/booking-queries.ts
| Řádek | SQL fragment | Status |
|-------|-------------|--------|
| 66 | `l.display_name AS location_name` | PASS |
| 139 | `l.display_name AS location_name` | PASS |
| 236 | `l.display_name AS location_name` | PASS |

Mapping výsledků: `r.location_name ? String(r.location_name) : null` na řádcích 107, 168, 260.

### lib/booking-actions.ts
| Řádek | SQL fragment | Status |
|-------|-------------|--------|
| 122 | `l.display_name AS location_name` | PASS |
| 683 | `l.display_name AS location_name` | PASS |

Mapping: `r.location_name ? String(r.location_name) : null` na řádku 171, 701.

### lib/studio-queries.ts
| Řádek | SQL fragment | Status |
|-------|-------------|--------|
| 96 | `l.display_name AS location_name` | PASS |
| 153 | `l.display_name AS location_name` | PASS |

Mapping: `r.location_name ? String(r.location_name) : null` na řádcích 129, 194.

### app/booking/dashboard/page.tsx
| Řádek | SQL fragment | Status |
|-------|-------------|--------|
| 82 | `l.display_name AS location_name` | PASS |
| 142 | `l.display_name AS location_name` | PASS |
| 158 | `l.display_name AS location_name` | PASS |

---

## 4. Migrace v lib/db.ts

Řádky 58–68:
```sql
UPDATE girl_schedules
SET location_id = (SELECT id FROM locations WHERE is_primary = 1 LIMIT 1)
WHERE location_id IS NULL
  AND (SELECT id FROM locations WHERE is_primary = 1 LIMIT 1) IS NOT NULL
```

**PASS** — migrace:
- Cílí pouze na záznamy kde `location_id IS NULL`
- Přiřadí primární lokaci (is_primary = 1)
- Guard: subquery `IS NOT NULL` zabrání selhání pokud primární lokace neexistuje
- Zabaleno v try/catch — neblokuje start aplikace při opakovaném spuštění
- Spouští se při každém startu (idempotentní — druhé spuštění nezmění nic, protože `location_id IS NULL` podmínka nebude splněna)

---

## 5. Shrnutí

| Check | Výsledek |
|-------|----------|
| TSC --noEmit | PASS |
| `l.name AS location_name` v projektu | 0 výskytů (PASS) |
| booking-queries.ts — display_name | 3/3 dotazy opraveny (PASS) |
| booking-actions.ts — display_name | 2/2 dotazy opraveny (PASS) |
| studio-queries.ts — display_name | 2/2 dotazy opraveny (PASS) |
| dashboard/page.tsx — display_name | 3/3 dotazy opraveny (PASS) |
| db.ts migrace NULL location_id | Implementována, bezpečná (PASS) |

**APPROVE.**
