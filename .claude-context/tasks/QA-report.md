# QA Report: Manager mobile view + Location highlighting
**Datum:** 2026-09-20  
**Kontrolor:** kontrolor  
**Soubory:** dashboard/page.tsx, layout.tsx, CalendarDayView.tsx, CalendarMobileList.tsx, CalendarWeekView.tsx, QuickBookingPanel.tsx

---

## VÝSLEDEK: PASS s jednou poznámkou (nízká priorita)

---

## 1. TypeScript / Build

| Check | Výsledek |
|-------|----------|
| `npx tsc --noEmit` | **PASS** – žádné chyby v produkčním kódu |
| `npm run build` | **FAIL** (očekávané) – LibsqlError: URL_INVALID (chybí DB URL v .env.production.local, nesouvisí s implementací) |

TSC chyby jsou výhradně v `e2e/tests/full-test.spec.ts` (null-check v testech), ne v produkčním kódu.

---

## 2. Manager mobile view — dashboard/page.tsx

### 2.1 SQL dotaz na dnešní bookings s JOIN locations
**PASS**

```sql
SELECT b.id, b.date, b.start_time, b.end_time, b.status, b.duration_minutes, b.channel,
       g.name AS girl_name,
       bc.nickname AS client_nickname,
       l.name AS location_name
FROM bookings_v2 b
LEFT JOIN girls g ON g.id = b.girl_id
LEFT JOIN booking_clients bc ON bc.id = b.client_id
LEFT JOIN locations l ON l.id = b.location_id
WHERE b.date = ? AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')
ORDER BY b.start_time, g.name
```
- Parametrizovaný dotaz (args: [today]) — SQL injection nehrozí
- Tři LEFT JOINy: girls, booking_clients, locations — správně

### 2.2 Sekce "Dnešní přehled" NAD KPI karty
**PASS**

Pořadí v JSX (řádky 227–415):
1. `<div className="db-today">` — Dnešní přehled (řádek 228)
2. `<div className="db-grid-4">` — KPI karty (řádek 268)

Sekce je správně nad KPI kartami.

### 2.3 Chronologický seznam: čas, slečna, klient, lokace, status
**PASS**

Řádky 248–261:
```tsx
<span className="db-today-time">{startHHMM}</span>    // čas
<span className="db-dot" style={...} />                // status (color dot)
<span className="db-today-girl">{b.girl_name}</span>   // slečna
<span className="db-today-client">{b.client_nickname}</span>  // klient
{b.location_name && <span className="db-today-loc">...</span>}  // lokace
```
SQL řadí `ORDER BY b.start_time, g.name` — chronologicky správně.

### 2.4 Probíhající rezervace zvýrazněná
**PASS**

Logika (řádky 243–245):
```tsx
const isNow = currentTime >= formatTime(startTime) && currentTime < formatTime(endTime)
              && (status === 'confirmed' || status === 'in_progress');
const isPast = currentTime >= formatTime(endTime) || status === 'completed';
```
CSS (řádky 629–635):
```css
.db-today-now {
  background: rgba(96,165,250,0.1);
  border: 1px solid rgba(96,165,250,0.25);
}
.db-today-past { opacity: 0.5; }
```
Modrý highlight pro probíhající, ztlumení pro minulé — správně.

### 2.5 Bottom nav — "Dnes" jako první položka
**PASS**

layout.tsx řádek 242:
```tsx
<a href="/booking/dashboard" className={...}>
  <span className="sf-bn-icon">📊</span>
  <span>Dnes</span>
</a>
```
Je první v `<nav className="sf-bottom-nav">`. Pořadí: Dnes → Rychlá → Kalendář → Klienti → Směny → Více.

---

## 3. Location highlighting — ve všech views

### 3.1 CalendarDayView.tsx
**PASS**

Řádky 133–134 (girl header):
```tsx
{girl.locationName && (
  <span className="cal-girl-loc">{girl.locationName}</span>
)}
```
CSS (řádky 274–279):
```css
.cal-girl-loc {
  font-size: 10px; font-weight: 600;
  padding: 1px 6px; border-radius: 4px;
  background: rgba(96,165,250,0.12); color: var(--blue);
}
```
Booking blok (řádek 202):
```tsx
{b.locationName && !isBreak && <div className="cal-bk-meta">{b.locationName}</div>}
```
Modrý badge u girl headeru implementován. U booking bloku se lokace zobrazuje jako `cal-bk-meta` (šedá) bez modrého stylu — viz poznámka níže.

### 3.2 CalendarMobileList.tsx
**PASS**

Řádky 64–65:
```tsx
{girl.locationName && (
  <span className="cal-ml-loc">{girl.locationName}</span>
)}
```
CSS (řádky 263–267):
```css
.cal-ml-loc {
  background: rgba(96,165,250,0.12); color: var(--blue);
}
```
Modrý badge implementován správně.

### 3.3 CalendarWeekView.tsx
**PASS**

Řádky 111–113:
```tsx
{girl.locationName && (
  <span className="cal-wg-girl-loc">{girl.locationName}</span>
)}
```
CSS (řádky 231–233):
```css
.cal-wg-girl-loc {
  display: block; font-size: 9px; font-weight: 600;
  color: var(--blue);
}
```
Implementováno, ale bez background badge (jen barva textu). Konzistentní s ostatními views? Viz poznámka.

### 3.4 QuickBookingPanel.tsx
**PASS**

Řádky 398–399:
```tsx
{dayInfo?.locationName && (
  <span className="qb-girl-loc">{dayInfo.locationName}</span>
)}
```
CSS (řádek 72–74):
```css
.qb-girl-loc {
  font-size: 10px; font-weight: 600; color: var(--blue); margin-left: 4px;
}
```
Implementováno, bez background — stejný pattern jako WeekView.

### 3.5 Dashboard — 2x JOIN locations
**PASS**

V `todayAllResult` (řádky 153–167) i `recentBookingsResult` (řádky 137–151) jsou LEFT JOIN locations. Dashboard zobrazuje `location_name` v obou sekcích.

---

## 4. Bezpečnostní audit

### SQL Injection
**PASS** — všechny SQL dotazy v dashboard/page.tsx používají parametrizované args, žádná string interpolace v SQL.

### XSS
**PASS** — `dangerouslySetInnerHTML` je použit pouze pro CSS styly (konstanty definované v kódu, ne z uživatelského vstupu). Uživatelský obsah (girl_name, client_nickname, location_name) je renderován přes JSX text nodes s explicitním `String(...)` castingem.

### Broken imports
**PASS** — TypeScript kompilace prošla bez chyb v produkčních souborech.

---

## 5. Poznámky (nízká priorita)

### P3: Nekonzistentní styling lokace v booking blocích (CalendarDayView)
V `cal-girl-loc` (girl header) je modrý badge s backgroundem. V `cal-bk-meta` (booking blok, řádek 202) je lokace bez modrého stylu — zobrazí se jako `var(--muted)` text. Toto je mírná nekonzistence s ostatními komponentami. Není blocker.

### P3: CalendarWeekView lokace bez background badge
`cal-wg-girl-loc` má jen `color: var(--blue)` bez `background`. DayView a MobileList mají `background: rgba(96,165,250,0.12)`. Malá vizuální nekonzistence.

---

## Závěr

Obě implementace (Manager mobile view + Location highlighting) jsou funkčně správné, bezpečné a bez TypeScript chyb. Build failuje pouze z důvodu chybějícího DB connection stringu v CI prostředí — nesouvisí s implementací. Doporučuji APPROVE s volitelnou P3 opravou vizuální konzistence lokace badge.
