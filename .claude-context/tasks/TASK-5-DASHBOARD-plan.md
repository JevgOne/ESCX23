# TASK-005: Dashboard — realne statistiky a prehled

## Status: PLAN READY
## Datum: 2026-09-15

---

## ANALYZA STAVU

### Aktualni stav
- `app/booking/dashboard/page.tsx` — 10 radku, prazdny placeholder: "Statistiky a prehled budou brzy dostupne."
- Stranka pouziva `export default function` (ne async) — neni Server Component.

### Dostupne zdroje dat
1. **`lib/booking-queries.ts`** — hlavni zdroj:
   - `getCalendarGirls(date)` — girls pracujici dany den (vcetne schedule exceptions)
   - `getCalendarBookings(dateFrom, dateTo)` — bookings za rozsah dat
   - `computeDayStats(bookings, girls)` — totalBookings, confirmed, pending, workingGirls
   - Types: `CalendarGirl`, `CalendarBooking`, `DayStats`

2. **`lib/db.ts`** — libSQL/Turso client, primo SQL queries

3. **DB tabulky (z migraci v db.ts a booking-queries.ts)**:
   - `bookings_v2`: id, client_id, girl_id, date, start_time, end_time, duration_minutes, price, status, channel, points_earned, notes, source, created_at, completed_at
   - `booking_clients`: nickname, trust_level, total_visits, total_spent, no_show_count
   - `girls`: id, name, status (active/inactive/archived)
   - `girl_schedules`: girl_id, day_of_week, start_time, end_time, is_active, effective_from
   - `girl_photos`: girl_id, url, is_primary
   - `schedule_exceptions`: girl_id, date, exception_type (unavailable/custom_hours)
   - `booking_drafts`: telegram drafts

4. **Booking statusy**: draft, pending, confirmed, in_progress, completed, no_show, declined, expired, cancelled_client, cancelled_girl, rescheduled, reassigned

### Design kontext
- Dark theme s CSS variables z layoutu (--bg, --bg-soft, --bg-elev, --line, --text, --muted, --dim, --coral, --green, --blue, --yellow, --red, --purple, --teal)
- Inline styles a `<style dangerouslySetInnerHTML>` pattern (jako calendar page)
- Ziadne externí CSS frameworky
- Responsive (sidebar kolabuje pod 768px)

---

## IMPLEMENTACNI PLAN

### Soubor: `app/booking/dashboard/page.tsx`

Zmenit na **async Server Component** s realnymi DB queries.

### Sekce dashboardu (6 sekcí):

#### 1. KPI karty (horni rada)
4 karty v jednom radku:
- **Dnesni rezervace** — pocet non-draft bookings pro dnes, podtitul "X nadchazejicich" (kde cas > now)
- **Tento tyden** — pocet bookings tento tyden (po-ne), podtitul "X potvrzenych"
- **Mesicni trzby** — SUM(price) za aktualni mesic, format "XX XXX Kc"
- **Pending** — pocet bookings se status='pending', cervena/zluta pokud > 0

#### 2. Kdo dnes pracuje (pracovni panel)
- Pouzit `getCalendarGirls(today)` — filtrovat `isWorking === true`
- Pro kazdou: foto (40x40 rounded), jmeno, smena (10:00-20:00), lokace
- Badge s poctem dnesnich bookings per girl
- Kompaktni horizontalni seznam / grid

#### 3. Nadchazejici rezervace (timeline)
- Dnesni bookings serazene dle start_time, filtr na cas >= now
- Max 5-8 zobrazenych, link "Zobrazit vse" na calendar
- Kazda: cas, klient nickname, girl jmeno, status badge, trvani
- Barevne kodovani kanalu (phone/telegram/whatsapp) — stejna paleta jako calendar

#### 4. Top girls (tento mesic)
- GROUP BY girl_id, COUNT bookings za aktualni mesic
- Top 5, s fotkou, jmenem, poctem bookings, % z celku
- Vizualne: horizontal bar chart ciste v CSS

#### 5. Pending akce (alert panel)
- Bookings kde status = 'pending' — cekaji na potvrzeni
- Bookings kde needs_confirmation = 1 — novy klient, nutna konfirmace
- Kazda s tlacitkem/linkem na detail
- Zlute/oranzove zvyrazneni

#### 6. No-show statistika
- Pocet no_show bookings tento mesic vs celkem
- No-show rate = no_show / (completed + no_show) * 100
- Jednoduchý procento + trend indikator

---

### SQL QUERIES (nove, primo v page.tsx nebo jako helpery)

```sql
-- Dnesni bookings
SELECT COUNT(*) as total,
  SUM(CASE WHEN start_time > ? THEN 1 ELSE 0 END) as upcoming
FROM bookings_v2
WHERE date = ? AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl', 'draft')

-- Tydenni bookings
SELECT COUNT(*) as total,
  SUM(CASE WHEN status IN ('confirmed', 'completed', 'in_progress') THEN 1 ELSE 0 END) as confirmed
FROM bookings_v2
WHERE date >= ? AND date <= ?
  AND status NOT IN ('expired', 'cancelled_client', 'cancelled_girl', 'draft')

-- Mesicni trzby
SELECT COALESCE(SUM(price), 0) as revenue,
  COUNT(*) as total_bookings
FROM bookings_v2
WHERE date >= ? AND date <= ?
  AND status IN ('completed', 'confirmed', 'in_progress')

-- Pending bookings
SELECT COUNT(*) as pending
FROM bookings_v2
WHERE status = 'pending'

-- Pending detail (pro alert panel)
SELECT b.id, b.date, b.start_time, b.duration_minutes, b.channel,
  bc.nickname, g.name as girl_name
FROM bookings_v2 b
LEFT JOIN booking_clients bc ON bc.id = b.client_id
LEFT JOIN girls g ON g.id = b.girl_id
WHERE b.status = 'pending'
ORDER BY b.date, b.start_time
LIMIT 10

-- Top girls tento mesic
SELECT g.id, g.name,
  (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) as photo_url,
  COUNT(b.id) as booking_count
FROM bookings_v2 b
JOIN girls g ON g.id = b.girl_id
WHERE b.date >= ? AND b.date <= ?
  AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl', 'draft')
GROUP BY g.id
ORDER BY booking_count DESC
LIMIT 5

-- No-show rate tento mesic
SELECT
  SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_shows,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
FROM bookings_v2
WHERE date >= ? AND date <= ?

-- Nadchazejici dnesni bookings
SELECT b.id, b.start_time, b.end_time, b.duration_minutes, b.status, b.channel,
  bc.nickname as client_nickname, bc.trust_level,
  g.name as girl_name
FROM bookings_v2 b
LEFT JOIN booking_clients bc ON bc.id = b.client_id
LEFT JOIN girls g ON g.id = b.girl_id
WHERE b.date = ? AND b.start_time >= ?
  AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl', 'draft')
ORDER BY b.start_time
LIMIT 8
```

### ARCHITEKTURA

```
app/booking/dashboard/page.tsx  (async Server Component)
  |
  |- import { db } from '@/lib/db'
  |- import { getCalendarGirls } from '@/lib/booking-queries'
  |- import { requireBooking } from '@/lib/auth'  (nepotrebuje admin!)
  |
  |- Vsechny queries bezi paralelne pres Promise.all()
  |- Inline <style> pro dashboard-specificke CSS (vzor: calendar page)
  |- Ziadne client components — ciste server rendered
```

### DESIGN SPECIFIKACE

- **KPI karty**: grid 4 sloupce (responsive 2 na mobilu), bg-elev, zaoblene rohy, ikona vlevo, cislo velke, podtitul muted
- **Working girls**: horizontalni scroll na mobilu, flex-wrap na desktopu
- **Timeline**: vertikalni seznam, levy border color-coded dle channel
- **Top girls bar chart**: CSS width proporcni k max, coral gradient
- **Pending panel**: zlute/oranzove border-left, CTA link na booking detail
- **No-show**: velky procento uprostred, mala popiska

### PRISTUP K DATUM

```typescript
// Prague timezone
function getPragueNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Pondeli aktualniho tydne
function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  return m;
}

// 1. den aktualniho mesice + posledni den
const monthStart = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
const monthEnd = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
```

### DULEZITE POZNAMKY

1. **Dashboard neni admin-only** — pouzit `requireBooking()` (ne `requireBookingAdmin()`), protoze je v sidebar pro vsechny role (operator, manager, admin)
2. **`export const dynamic = 'force-dynamic'`** — nutne pro fresh data
3. **Demo data fallback** — pokud DB prazdna, `getCalendarGirls` a `getCalendarBookings` vraci demo data. Dashboard by mel ukazat realna data i kdyz jsou nulova (ne demo fallback). Pro statistiky delat primo SQL queries.
4. **Format ceny**: `price.toLocaleString('cs-CZ')` + " Kc"
5. **Cas format**: HH:MM (24h), jako v calendar
6. **Channel colors** (z CalendarDayView):
   - phone: var(--blue) / rgba(96,165,250,0.15)
   - telegram: #229ED9
   - whatsapp: #25D366
   - admin: var(--purple)
7. **Status colors**:
   - confirmed/completed/in_progress: var(--green)
   - pending: var(--yellow)
   - no_show: var(--red)
   - draft: dashed yellow
8. **Trust level colors** (z CalendarDayView):
   - vip: var(--coral)
   - regular: var(--blue)
   - new: var(--yellow)

### ODHAD SLOZITOSTI

- 1 soubor k editaci: `app/booking/dashboard/page.tsx`
- Ziadne nove soubory
- Ziadne zmeny v lib/ — vsechny nove queries primo v page
- ~250-350 radku vysledneho kodu (JSX + SQL + CSS)

---

## CHECKLIST PRO IMPLEMENTATORA

- [ ] Zmenit na `async` Server Component
- [ ] Pridat `export const dynamic = 'force-dynamic'`
- [ ] Import `requireBooking` z `@/lib/auth`
- [ ] Import `db` z `@/lib/db`
- [ ] Import `getCalendarGirls` z `@/lib/booking-queries`
- [ ] Implementovat vsech 8 SQL queries
- [ ] Promise.all pro paralelni fetch
- [ ] KPI karty (4x)
- [ ] Working girls panel
- [ ] Upcoming bookings timeline
- [ ] Top girls bar chart
- [ ] Pending akce panel
- [ ] No-show statistika
- [ ] Inline CSS (dark theme, responsive)
- [ ] Otestovat ze stranka renderuje bez chyb
- [ ] Overit ze dashboard funguje pro operator roli (ne jen admin)
