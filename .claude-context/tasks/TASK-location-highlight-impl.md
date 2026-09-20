# IMPL: Location (Praha) highlighted everywhere

**Datum:** 2026-09-20
**Status:** Hotovo

## Provedené změny (5 souborů)

### 1. `components/booking/CalendarDayView.tsx`
- Girl header: přidán `girl.locationName` jako modrý badge pod směnou
- CSS: `.cal-girl-loc` — blue badge, inline-block

### 2. `components/booking/CalendarMobileList.tsx`
- Girl header: přidán `girl.locationName` badge vedle shift
- CSS: `.cal-ml-loc` — blue badge, margin-left 6px

### 3. `components/booking/CalendarWeekView.tsx`
- Girl name cell: přidán `girl.locationName` pod jméno (wrapped v `<div>`)
- CSS: `.cal-wg-girl-loc` — blue text, 9px, block display

### 4. `components/booking/QuickBookingPanel.tsx`
- Girl pills: čte `dayInfo.locationName` z `weekSchedules` pro vybraný den
- CSS: `.qb-girl-loc` — blue text, 10px, inline

### 5. `app/booking/dashboard/page.tsx`
- Pending query: přidán `LEFT JOIN locations` + `l.name AS location_name`
- Recent bookings query: přidán `LEFT JOIN locations` + `l.name AS location_name`
- Pending JSX: přidán `db-list-loc` badge
- Recent bookings JSX: přidán `db-list-loc` badge

## Vizuální konzistence
- Všude modrý tag/badge: `color: var(--blue)`, `background: rgba(96,165,250,0.12)`
- Konzistentní s existujícím `db-list-loc` stylem v dashboard
