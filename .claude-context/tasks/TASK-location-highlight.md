# PLAN: Zvýraznění lokace (Praha) u slečen — všude v systému

**Datum:** 2026-09-20
**Task:** V celém systému musí být ZVÝRAZNĚNÁ pobočka (Praha) na které slečna pracuje

---

## Analýza — kde se zobrazují slečny a kde chybí lokace

### Data k dispozici:
- `CalendarGirl.locationName` — string | null (z `girl_schedules` JOINed s `locations`)
- `CalendarBooking.locationName` — string | null (z `bookings_v2.location_id` JOINed s `locations`)
- Schedule page — `s.location_name` z `getAllSchedulesGrouped()`

### Audit všech views:

| View | Soubor | Zobrazuje lokaci? | Stav |
|------|--------|-------------------|------|
| Calendar Day View — girl header | `CalendarDayView.tsx:126-133` | **NE** — jen jméno + směna | CHYBÍ |
| Calendar Day View — booking block | `CalendarDayView.tsx:199` | ANO — `b.locationName` v meta | OK (malé) |
| Calendar Mobile List — girl header | `CalendarMobileList.tsx:49-67` | **NE** — jen jméno + směna | CHYBÍ |
| Calendar Mobile List — booking | `CalendarMobileList.tsx:82-93` | **NE** — jen čas + klient | CHYBÍ |
| Calendar Week View — girl name cell | `CalendarWeekView.tsx:102-110` | **NE** — jen avatar + jméno | CHYBÍ |
| Calendar Week View — mini booking | `CalendarWeekView.tsx:130-135` | **NE** — jen čas + délka + klient | CHYBÍ |
| Dashboard — "Dnes pracuji" | `dashboard/page.tsx:275-285` | ANO — `g.locationName` jako badge | OK |
| Dashboard — "Čekající" list | `dashboard/page.tsx:245-258` | **NE** — jen slečna + klient + čas | CHYBÍ |
| Dashboard — "Poslední rez." | `dashboard/page.tsx:328-347` | **NE** — jen slečna + klient + status | CHYBÍ |
| Quick Booking — girl pills | `QuickBookingPanel.tsx:384-395` | **NE** — jen jméno + směna | CHYBÍ |
| Quick Booking — summary | `QuickBookingPanel.tsx:504-513` | **NE** — jen jméno + čas + cena | CHYBÍ |
| Booking Detail Overlay | `BookingDetailOverlay.tsx:127` | ANO — `b.locationName` v programu | OK |
| Schedule page — desktop grid | `schedule/page.tsx:162-163` | ANO — `s.location_name` tag | OK |
| Schedule page — mobile cards | `schedule/page.tsx:192+` | ANO | OK |
| Girls page | `girls/page.tsx:49-75` | **NE** — žádná lokace info | CHYBÍ (ale admin-only) |

---

## Plán implementace

### Vizuální řešení pro lokaci

Použít **konzistentní badge/tag** pro lokaci ve VŠECH views:

```css
.loc-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(96,165,250,0.12);
  color: var(--blue);
  white-space: nowrap;
}
```

Modrý tag — výrazný ale nekonfrontační, konzistentní s existujícím designem (blue je definovaná v layout.tsx CSS variables).

### Krok 1: CalendarDayView.tsx — Girl header + lokace tag

**Řádek 125-133** — přidat `girl.locationName` pod shift info:

```tsx
<div>
  <div className="cal-girl-name">{girl.name}</div>
  <div className={`cal-girl-shift ${girl.isWorking ? 'online' : 'offline'}`}>
    {girl.isWorking
      ? `${girl.shiftStart} - ${girl.shiftEnd}`
      : 'Nepracuje dnes'
    }
  </div>
  {girl.locationName && (
    <span className="cal-girl-loc">{girl.locationName}</span>
  )}
</div>
```

CSS přidat do `DAY_VIEW_STYLES`:
```css
.cal-girl-loc {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(96,165,250,0.12);
  color: var(--blue);
  display: inline-block;
  margin-top: 1px;
}
```

### Krok 2: CalendarMobileList.tsx — Girl header + lokace tag

**Řádek 57-65** — přidat `girl.locationName` vedle shift:

```tsx
<div className="cal-ml-info">
  <span className="cal-ml-name">{girl.name}</span>
  <span className="cal-ml-shift">
    {girl.isWorking
      ? `${girl.shiftStart} – ${girl.shiftEnd}`
      : 'Nepracuje'
    }
    {girl.locationName && (
      <span className="cal-ml-loc">{girl.locationName}</span>
    )}
  </span>
</div>
```

CSS přidat do `MOBILE_LIST_STYLES` (uvnitř `@media (max-width: 768px)`):
```css
.cal-ml-loc {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(96,165,250,0.12);
  color: var(--blue);
  margin-left: 6px;
}
```

### Krok 3: CalendarWeekView.tsx — Girl name cell + lokace

**Řádek 102-110** — přidat `girl.locationName` pod jméno:

```tsx
<div key={`g-${girl.id}`} className="cal-wg-girl">
  <div className="cal-wg-girl-av" style={{ background: girlColor }}>
    {girl.photoUrl
      ? <img src={girl.photoUrl} alt={girl.name} width={24} height={24} />
      : girl.name.charAt(0)
    }
  </div>
  <div>
    <span className="cal-wg-girl-nm">{girl.name}</span>
    {girl.locationName && (
      <span className="cal-wg-girl-loc">{girl.locationName}</span>
    )}
  </div>
</div>
```

CSS přidat do `WEEK_VIEW_STYLES`:
```css
.cal-wg-girl-loc {
  display: block;
  font-size: 9px;
  font-weight: 600;
  color: var(--blue);
}
```

### Krok 4: QuickBookingPanel.tsx — Girl pills + lokace

**Řádek 384-395** — přidat lokaci do girl buttonu. 

**Problém:** `GirlSummary` typ z `booking-actions.ts` nemá `locationName`. Ale `DaySchedule` (z `weekSchedules`) má `locationName`.

Řešení: při vykreslení girlu přečíst lokaci z `weekSchedules[g.id]` pro vybraný den:

```tsx
{girlsForDate.map((g) => {
  const sched = weekSchedules[g.id] ?? [];
  const dayInfo = sched.find((s) => s.date === selectedDate);
  return (
    <button
      key={g.id}
      className={`qb-girl${selectedGirlId === g.id ? ' active' : ''}`}
      onClick={() => selectGirl(g.id)}
    >
      {g.name}
      <span className="qb-girl-shift">{g.shiftStart}&#8211;{g.shiftEnd}</span>
      {dayInfo?.locationName && (
        <span className="qb-girl-loc">{dayInfo.locationName}</span>
      )}
    </button>
  );
})}
```

CSS přidat do `STYLES`:
```css
.qb-girl-loc {
  font-size: 10px;
  font-weight: 600;
  color: var(--blue);
  margin-left: 4px;
}
```

### Krok 5: Dashboard — "Čekající" a "Poslední rezervace"

Dashboard query pro pending bookings (řádek 78-87) **nemá JOIN na locations**. Nutné přidat:

```sql
SELECT b.id, b.date, b.start_time, b.duration_minutes,
       g.name AS girl_name,
       bc.nickname AS client_nickname,
       l.name AS location_name        -- PŘIDAT
FROM bookings_v2 b
LEFT JOIN girls g ON g.id = b.girl_id
LEFT JOIN booking_clients bc ON bc.id = b.client_id
LEFT JOIN locations l ON l.id = b.location_id   -- PŘIDAT JOIN
WHERE b.status = 'pending'
ORDER BY b.date, b.start_time
LIMIT 10
```

Stejně pro "Poslední rezervace" query (řádek 134-146) — **také nemá locations JOIN**, přidat stejný JOIN.

V JSX přidat lokaci tag do obou sekcí.

---

## Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `components/booking/CalendarDayView.tsx` | Girl header: přidat locationName badge + CSS |
| `components/booking/CalendarMobileList.tsx` | Girl header: přidat locationName badge + CSS |
| `components/booking/CalendarWeekView.tsx` | Girl cell: přidat locationName + CSS |
| `components/booking/QuickBookingPanel.tsx` | Girl pill: přidat locationName z weekSchedules + CSS |
| `app/booking/dashboard/page.tsx` | 2x SQL přidat JOIN locations + JSX lokace tag + CSS |

---

## Co NEMĚNIT

- `BookingDetailOverlay.tsx` — už zobrazuje locationName
- `schedule/page.tsx` — už zobrazuje location_name
- Dashboard sekce "Dnes pracuji" — už zobrazuje locationName
- `lib/booking-queries.ts` — CalendarGirl i CalendarBooking už mají locationName
- `lib/booking-actions.ts` — DaySchedule už má locationName

---

## Odhad rozsahu

- CalendarDayView: ~8 řádků JSX + ~8 řádků CSS
- CalendarMobileList: ~5 řádků JSX + ~8 řádků CSS
- CalendarWeekView: ~8 řádků JSX + ~5 řádků CSS
- QuickBookingPanel: ~5 řádků JSX + ~6 řádků CSS
- Dashboard: ~10 řádků SQL/JSX + ~8 řádků CSS
- **Celkem: ~71 řádků nového kódu, 5 souborů**
