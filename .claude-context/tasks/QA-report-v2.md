# QA Report v2: Location badge fix — re-review
**Datum:** 2026-09-20  
**Kontrolor:** kontrolor  
**Soubory:** dashboard/page.tsx, CalendarDayView.tsx, CalendarMobileList.tsx, CalendarWeekView.tsx, QuickBookingPanel.tsx, BookingDetailOverlay.tsx

---

## VÝSLEDEK: PASS — všechny P3 poznámky opraveny

---

## TypeScript

`npx tsc --noEmit` — **PASS**, žádné chyby v produkčním kódu.

---

## Checklist: Badge specifikace (min 11px, var(--blue), rgba(96,165,250,0.12), border-radius 4px)

| Soubor | Třída | font-size | color | background | border-radius | Status |
|--------|-------|-----------|-------|------------|---------------|--------|
| dashboard | `.db-today-loc` | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| dashboard | `.db-list-loc` | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| CalendarDayView | `.cal-girl-loc` | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| CalendarDayView | `.cal-bk-loc` (NOVÝ) | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| CalendarMobileList | `.cal-ml-loc` | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| CalendarMobileList | `.cal-ml-bk-loc` (NOVÝ) | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| CalendarWeekView | `.cal-wg-girl-loc` | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| QuickBookingPanel | `.qb-girl-loc` | 11px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |
| BookingDetailOverlay | `.bdo-loc-badge` | 12px | var(--blue) | rgba(96,165,250,0.12) | 4px | PASS |

---

## Detailní review

### Dashboard (dashboard/page.tsx)

**db-today-loc** (řádky 657–667):
```css
.db-today-loc {
  font-size: 11px; font-weight: 600; color: var(--blue);
  background: rgba(96,165,250,0.12); padding: 1px 6px;
  border-radius: 4px; white-space: nowrap; margin-left: auto; flex-shrink: 0;
}
```
**PASS** — plný badge.

**db-list-loc** (řádky 552–559):
```css
.db-list-loc {
  font-size: 11px; font-weight: 600; color: var(--blue);
  background: rgba(96,165,250,0.12); padding: 1px 6px; border-radius: 4px;
}
```
**PASS** — používán v pending bookings, working girls i recent bookings sekcích.

### CalendarDayView.tsx

**cal-girl-loc** (řádky 274–279): PASS — badge s background.

**cal-bk-loc** (řádky 280–285) — NOVÝ:
```css
.cal-bk-loc {
  font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
  background: rgba(96,165,250,0.12); color: var(--blue);
  display: inline-block; margin-top: 2px;
}
```
Použití (řádek 202): `{b.locationName && !isBreak && <span className="cal-bk-loc">{b.locationName}</span>}`  
**PASS** — nahrazuje původní `cal-bk-meta`, guard `!isBreak` správně.

### CalendarMobileList.tsx

**cal-ml-loc** (řádky 263–268): PASS — badge s background.

**cal-ml-bk-loc** (řádky 270–275) — NOVÝ:
```css
.cal-ml-bk-loc {
  font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
  background: rgba(96,165,250,0.12); color: var(--blue);
  margin-left: auto; flex-shrink: 0;
}
```
Použití (řádek 93): `{b.locationName && !isBreak && <span className="cal-ml-bk-loc">{b.locationName}</span>}`  
**PASS** — guard `!isBreak` správně.

### CalendarWeekView.tsx

**cal-wg-girl-loc** (řádky 231–235):
```css
.cal-wg-girl-loc {
  display: inline-block; font-size: 11px; font-weight: 600;
  color: var(--blue); background: rgba(96,165,250,0.12);
  padding: 1px 6px; border-radius: 4px; margin-top: 2px;
}
```
**PASS** — opraveno oproti v1 (přidáno background).

### QuickBookingPanel.tsx

**qb-girl-loc** (řádky 72–76):
```css
.qb-girl-loc {
  font-size: 11px; font-weight: 600; color: var(--blue);
  background: rgba(96,165,250,0.12); padding: 1px 6px; border-radius: 4px;
  margin-left: 4px;
}
```
**PASS** — opraveno oproti v1 (přidáno background).

### BookingDetailOverlay.tsx

**bdo-loc-badge** (řádky 256–260):
```css
.bdo-loc-badge {
  font-size: 12px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(96,165,250,0.12); color: var(--blue);
}
```
Použití (řádek 127): `{b.locationName && <span className="bdo-loc-badge">{b.locationName}</span>}`  
**PASS** — 12px (větší než minimum 11px, odpovídá kontextu hero sekce). Nahrazuje původní inline text.

---

## Bezpečnost

- Žádné nové XSS rizika — `locationName` renderován přes JSX text node
- Žádné nové SQL dotazy přidány

---

## Závěr

Všechny P3 poznámky z QA v1 byly opraveny. Badge styling je konzistentní ve všech 6 souborech. TypeScript čistý. **APPROVE.**
