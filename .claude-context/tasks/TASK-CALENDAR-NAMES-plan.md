# TASK #8: Kalendar — zobrazit jmena klientu misto "GCal Import"

## Status: PLAN HOTOVY — ceka na implementaci

## Analyza

### Problem
Kalendar ukazuje "GCal Import" u vsech importovanych rezervaci. Uzivatel rika: "Chci videt jmena".

### Root cause
GCal import (`app/api/admin/fix-data/route.ts` radek 105) vytvari bookings s:
- `client_id` = sdileny placeholder klient "GCal Import" (LG-GCAL)
- `source = 'gcal_import'`
- `notes` = jmeno klienta z ICS summary (napr. "Milan", "Pavel Novak")

Query v `lib/booking-queries.ts` (radek 150) pouziva `bc.nickname` (= "GCal Import") jako `clientNickname`. Ignoruje `b.notes` kde je skutecne jmeno.

### Kde se clientNickname zobrazuje
1. `components/booking/CalendarDayView.tsx` radek 190 — denni pohled
2. `components/booking/CalendarWeekView.tsx` radky 134, 145 — tydenni pohled
3. `components/booking/BookingDetailOverlay.tsx` radky 30, 79 — detail modal

### Data flow
```
bookings_v2.client_id -> booking_clients.nickname = "GCal Import"  <- SPATNE
bookings_v2.notes = "Milan"                                        <- SPRAVNE
bookings_v2.source = "gcal_import"                                 <- indikator
```

## Plan implementace

### Varianta A: Fix v query (DOPORUCENO — nejcistejsi)

Uprava `lib/booking-queries.ts` funkce `getCalendarBookings()`:

#### Krok 1: Pridat `b.source` do SELECT

Radek 130:
```sql
SELECT
  b.id, b.girl_id, b.date, b.start_time, b.end_time,
  b.duration_minutes, b.status, b.channel, b.points_earned,
  b.price, b.notes, b.source,   -- PRIDAT b.source
  bc.nickname AS client_nickname,
  ...
```

#### Krok 2: Pouzit notes jako clientNickname pro gcal_import

Radek 150:
```ts
// PRED:
clientNickname: r.client_nickname ? String(r.client_nickname) : 'Neznámý',

// PO:
clientNickname: String(r.source) === 'gcal_import' && r.notes
  ? String(r.notes)
  : r.client_nickname
    ? String(r.client_nickname)
    : 'Neznámý',
```

**Hotovo.** Zadna zmena v komponentach — `clientNickname` uz se vsude pouziva spravne.

### Varianta B: Fix v komponentach (alternativa — horsi)
Pridat `source` field do `CalendarBooking` interface a v kazde komponente kontrolovat. NEDOPORUCENO — zbytecna duplikace logiky.

### Varianta C: Fix v SQL pomoci CASE (alternativa)
```sql
CASE WHEN b.source = 'gcal_import' AND b.notes IS NOT NULL
  THEN b.notes ELSE bc.nickname END AS client_nickname
```
Taky OK ale mene citelne nez v TypeScript.

## Soubory k editovat

1. **`lib/booking-queries.ts`** — radky 130 a 150: pridat `b.source` do SELECT, pouzit notes pro gcal_import

## Zmena je 2 radky kodu

To je vse. Zadna nova komponenta, zadna DB zmena, zadny novy soubor.

## Edge cases
- Pokud `notes` je null i pro gcal_import → fallback na "GCal Import" (puvodni chovani)
- Pokud notes obsahuje dlouhy text → zobrazeni v kalendari bude orizle CSS (overflow hidden uz existuje)
- Neovlivni budouci bookings vytvorene manualne nebo pres bot — ty maji spravny client_id
