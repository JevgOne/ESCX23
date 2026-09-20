# EVŽEN REVIEW v3 — Re-review: display_name + migrace location_id

**Datum:** 2026-09-20
**Status:** SPLNĚNO

---

## Co bylo opraveno

### Oprava 1: `l.name` (slug) → `l.display_name` (čitelný název)

Všechny SQL dotazy v systému nyní používají `l.display_name AS location_name` místo `l.name`:

| Soubor | Řádek | Dotaz | display_name? |
|--------|-------|-------|---------------|
| booking-queries.ts | 66 | getCalendarGirls (den view) | `l.display_name AS location_name` — OK |
| booking-queries.ts | 139 | getCalendarBookings (bookings) | `l.display_name AS location_name` — OK |
| booking-queries.ts | 236 | getWeekSchedules (týden) | `l.display_name AS location_name` — OK |
| booking-actions.ts | 122 | getGirlsForQuickBooking | `l.display_name AS location_name` — OK |
| booking-actions.ts | 683 | getQuickBookingData schedules | `l.display_name AS location_name` — OK |
| dashboard/page.tsx | 82 | pending bookings | `l.display_name AS location_name` — OK |
| dashboard/page.tsx | 142 | recent bookings | `l.display_name AS location_name` — OK |
| dashboard/page.tsx | 158 | today all bookings | `l.display_name AS location_name` — OK |

**Verdikt: OPRAVENO** — Všech 8 klíčových SQL dotazů používá `display_name`.

### Oprava 2: Migrace — přiřazení location_id VŠEM slečnám

**Soubor:** `lib/db.ts` řádky 58-66

```sql
UPDATE girl_schedules
SET location_id = (SELECT id FROM locations WHERE is_primary = 1 LIMIT 1)
WHERE location_id IS NULL
  AND (SELECT id FROM locations WHERE is_primary = 1 LIMIT 1) IS NOT NULL
```

**Analýza:**
- Migrace najde primární lokaci (`is_primary = 1`) a přiřadí ji ke VŠEM záznamům v `girl_schedules` kde `location_id IS NULL`
- Tím se zajistí, že KAŽDÁ slečna se směnou bude mít přiřazenou lokaci
- Migrace je idempotentní (spustí se při každém startu, ale updatuje jen NULL záznamy)
- Je obalena v try/catch pro bezpečnost

**Verdikt: OPRAVENO** — Všechny slečny s rozvrhem dostanou location_id.

---

## Ověření toku dat

### Jak se lokace dostává ke slečně v kalendáři:
1. `girl_schedules` má `location_id` (NOT NULL díky migraci)
2. SQL JOIN: `LEFT JOIN locations l ON l.id = gs.location_id`
3. Výsledek: `l.display_name AS location_name` → např. "Praha 2"
4. Mapování: `locationName: r.location_name ? String(r.location_name) : null`
5. Zobrazení: modrý badge `<span className="cal-girl-loc">{girl.locationName}</span>`

### Jak se lokace dostává k bookingu:
1. Při vytvoření bookingu: `SELECT gs.location_id FROM girl_schedules gs WHERE ...` (booking-actions.ts:346)
2. Uloží se do `bookings_v2.location_id`
3. Při čtení: `LEFT JOIN locations l ON l.id = b.location_id` → `l.display_name`

### Existující bookings bez location_id:
- Starší bookings vytvořené před migrací mohou mít `location_id = NULL`
- V takovém případě `LEFT JOIN` vrátí NULL → lokace se nezobrazí
- Toto je AKCEPTOVATELNÉ — staré bookings nebudou mít badge, nové ano

---

## Kontrola display_name obsahu

Z `docs/secretstory-export/locations.sql`:
- ID 1: `name='praha-2'`, `display_name='Praha 2'`

Z `lib/site-facts.ts` komentáře (řádek 47):
> "display_name reads 'Nové Město, Praha 2' — the part before the comma is the neighbourhood"

To naznačuje, že display_name mohou být aktualizovány na detailnější formát (např. "Nové Město, Praha 2"). Ať je formát jakýkoliv, systém korektně zobrazuje display_name místo slug "praha-2".

---

## ZÁVĚR

| Problém | Status |
|---------|--------|
| SQL dotazy používají l.name (slug) | OPRAVENO — všude l.display_name |
| Některé slečny nemají location_id | OPRAVENO — migrace přiřadí primary |
| Lokace zvýrazněná ve všech views | SPLNĚNO (z review v2) |
| Manažerka vidí hned rezervace | SPLNĚNO (z review v1) |

**CELKOVÝ VERDIKT: SPLNĚNO** — Obě opravy jsou korektní. Systém nyní zobrazuje čitelný název lokace (display_name) pro všechny slečny ve všech views.
