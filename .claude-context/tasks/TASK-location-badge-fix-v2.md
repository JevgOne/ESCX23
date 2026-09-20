# PLAN+FIX: Location badge problémy z produkce

**Datum:** 2026-09-20

---

## Analýza 3 problémů

### PROBLÉM 1: Badge text je "praha-2" místo "Praha 2"

**Root cause:** SQL dotazy v `booking-queries.ts` a `booking-actions.ts` používají `l.name` místo `l.display_name`.

Tabulka `locations` má 2 sloupce:
- `name` = slug/technický název: `"praha-2"` (TEXT NOT NULL UNIQUE)
- `display_name` = uživatelský název: `"Praha 2"` (TEXT NOT NULL)

**Odkud se bere špatný text:**

| Soubor | Řádek | SQL | Problém |
|--------|-------|-----|---------|
| `lib/booking-queries.ts` | 66 | `l.name AS location_name` | SLUG! |
| `lib/booking-queries.ts` | 139 | `l.name AS location_name` | SLUG! |
| `lib/booking-queries.ts` | 236 | `l.name AS location_name` | SLUG! |
| `lib/booking-actions.ts` | 122 | `l.name AS location_name` | SLUG! |
| `lib/booking-actions.ts` | 683 | `l.name AS location_name` | SLUG! |
| `lib/studio-queries.ts` | 96 | `l.name AS location_name` | SLUG! |
| `lib/studio-queries.ts` | 153 | `l.name AS location_name` | SLUG! |

**Soubory kde je SPRÁVNĚ (pro srovnání):**
- `lib/queries.ts` — používá `l.display_name AS schedule_location` (9+ výskytů)
- `lib/telegram-ai/tool-handlers.ts` — používá `l.display_name AS location_name`
- `lib/telegram-ai/booking-flow.ts` — používá `l.display_name AS location_name`

**FIX:** Změnit `l.name` na `l.display_name` ve všech 7 místech výše.

### PROBLÉM 2: Badge se zobrazuje JEN u některých slečen

**Root cause:** Některé slečny nemají `location_id` v `girl_schedules` pro daný den.

SQL v `getCalendarGirls()` (booking-queries.ts:71-77):
```sql
LEFT JOIN (
  SELECT girl_id, start_time, end_time, location_id, ...
  FROM girl_schedules
  WHERE day_of_week = ? AND is_active = 1
    AND (effective_from IS NULL OR effective_from <= ?)
) gs ON gs.girl_id = g.id AND gs.rn = 1
LEFT JOIN locations l ON l.id = gs.location_id
```

Pokud `gs.location_id` je NULL → `LEFT JOIN locations` nevrátí nic → `location_name` je NULL → badge se nezobrazí.

**To je SPRÁVNÉ chování** — pokud nemají přiřazenou lokaci, badge se prostě nezobrazí. Ale uživatel by měl vědět, že problém je v datech (chybějící location_id u některých schedules), ne v kódu.

**DOPORUČENÍ:** Toto NENÍ kód bug. Slečny, které nemají badge, prostě nemají přiřazenou lokaci v girl_schedules. Fix = přiřadit jim lokaci v administraci.

### PROBLÉM 3: Badge barva vypadá růžově/coral místo modře

**Root cause analýza:** CSS v kódu je **správně modrý** ve všech views:
- `CalendarDayView.tsx:274-278` → `color: var(--blue); background: rgba(96,165,250,0.12);`
- `CalendarMobileList.tsx:264-268` → `color: var(--blue); background: rgba(96,165,250,0.12);`
- `CalendarWeekView.tsx:231-234` → `color: var(--blue); background: rgba(96,165,250,0.12);`
- `QuickBookingPanel.tsx:72-75` → `color: var(--blue); background: rgba(96,165,250,0.12);`
- `dashboard/page.tsx:552-557` → `color: var(--blue); background: rgba(96,165,250,0.12);`

`var(--blue)` = `#60a5fa` (definováno v layout.tsx:33).

**Možné vysvětlení:** Uživatel se mohl dívat na stránku kde ještě nebyl nový kód deploynutý, nebo existující `.db-list-loc` třída z dashboardu (řádek 488-494 v PŮVODNÍM kódu) měla jinou barvu. Původní `.db-list-loc` v dashboard styles (řádek 488-494):
```css
.db-list-loc {
  font-size: 11px;
  color: var(--dim);
  background: rgba(255,255,255,0.05);
  padding: 1px 6px;
  border-radius: 4px;
}
```

Ten originální styl používal `var(--dim)` a `rgba(255,255,255,0.05)` — ne coral. Implementátor to ale přepsal na modrý. Barva by měla být OK po deployi.

**FIX:** Žádný kód fix potřeba. Ověřit po deployi.

---

## Implementační plán

### Krok 1: Fix `l.name` → `l.display_name` (7 míst, 3 soubory)

#### `lib/booking-queries.ts`

**Řádek 66:**
```
BEFORE: l.name AS location_name,
AFTER:  l.display_name AS location_name,
```

**Řádek 139:**
```
BEFORE: l.name AS location_name
AFTER:  l.display_name AS location_name
```

**Řádek 236:**
```
BEFORE: l.name AS location_name
AFTER:  l.display_name AS location_name
```

#### `lib/booking-actions.ts`

**Řádek 122:**
```
BEFORE: l.name AS location_name,
AFTER:  l.display_name AS location_name,
```

**Řádek 683:**
```
BEFORE: l.name AS location_name
AFTER:  l.display_name AS location_name
```

#### `lib/studio-queries.ts`

**Řádek 96:**
```
BEFORE: SELECT gs.start_time, gs.end_time, l.name AS location_name,
AFTER:  SELECT gs.start_time, gs.end_time, l.display_name AS location_name,
```

**Řádek 153:**
```
BEFORE: SELECT gs.start_time, gs.end_time, l.name AS location_name,
AFTER:  SELECT gs.start_time, gs.end_time, l.display_name AS location_name,
```

### Krok 2: ŽÁDNÝ kód fix pro missing badges

To je datový problém — slečny bez location_id v schedules. Reporting zpátky uživateli.

### Krok 3: ŽÁDNÝ kód fix pro barvu

CSS je správně modrý (`var(--blue)`). Ověřit po deployi.

---

## Soubory k editaci

| Soubor | Změna | Počet editů |
|--------|-------|-------------|
| `lib/booking-queries.ts` | `l.name` → `l.display_name` | 3x |
| `lib/booking-actions.ts` | `l.name` → `l.display_name` | 2x |
| `lib/studio-queries.ts` | `l.name` → `l.display_name` | 2x |

**Celkem: 7 jednořádkových změn, 3 soubory.**

---

## Zpráva pro uživatele

> **Badge text "praha-2":** Opraveno — kód četl technický slug místo display name. Teď bude "Praha 2".
>
> **Badge jen u některých slečen:** To není bug — slečny bez badge nemají přiřazenou pobočku v rozvrhu směn. Potřeba jim nastavit lokaci v administraci (Pobočky/Rozvrh).
>
> **Barva badge:** CSS je nastaveno na modrou (`#60a5fa`). Pokud vidíte jinou barvu, zkuste hard refresh (Ctrl+Shift+R).
