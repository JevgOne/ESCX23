# PLAN: Manager Mobile Booking View — Dnešní rezervace na první pohled

**Datum:** 2026-09-20
**Task:** Manažerka při otevření aplikace na mobilu vidí hned dnešní rezervace

---

## Analýza současného stavu

### Co vidí manažerka teď na mobilu:
1. **Dashboard** (`/booking/dashboard`) — KPI karty (počet dnes, týden, měsíc, no-show rate), čekající na potvrzení, kdo dnes pracuje, top dívky, poslední rezervace. Na mobilu se gridy přepnou na 1 sloupec, ale **neobsahuje kompletní seznam dnešních rezervací se všemi detaily**.
2. **Kalendář** (`/booking/calendar`) — má `CalendarMobileList` komponentu, která zobrazuje rezervace seskupené podle dívky. Obsahuje čas a klienta, ale **NE lokaci**. Navíc je to na jiné stránce.
3. **Bottom nav** — navigace: Rychlá, Kalendář, Klienti, Směny, Více. **Není tam Dashboard ani "Dnes"**.

### Klíčový problém:
- Manažerka musí proklikat na kalendář, aby viděla co se dnes děje
- Dashboard ukazuje statistiky, ale ne konkrétní "kdo v kolik má čas"
- CalendarMobileList seskupuje podle dívky, ale **chybí lokace**
- Žádný dedicated "dnešní přehled" optimalizovaný pro rychlý mobilní check

### Datové zdroje (už existují):
- `getCalendarGirls(date)` → vrací `CalendarGirl[]` s `name, shiftStart, shiftEnd, locationName, isWorking`
- `getCalendarBookings(dateFrom, dateTo)` → vrací `CalendarBooking[]` s `girlName, clientNickname, startTime, endTime, durationMinutes, status, locationName, channel`
- Dashboard query (řádek 134-146 v `dashboard/page.tsx`) už tahá dnešní bookings ale jen posledních 5

---

## Plán implementace

### Přístup: Rozšířit Dashboard o "Dnešní rezervace" sekci optimalizovanou pro mobil

**Proč ne nová stránka:** Manažerka už chodí na dashboard. Lepší je tam přidat mobilně-optimalizovaný blok se všemi dnešními rezervacemi, než vytvářet novou stránku a měnit routing.

### Krok 1: Nový SQL dotaz v dashboard/page.tsx

Přidat do `Promise.all` query pro **všechny dnešní rezervace** (ne jen 5):

```sql
SELECT b.id, b.date, b.start_time, b.end_time, b.status,
       b.duration_minutes, b.channel,
       g.name AS girl_name,
       bc.nickname AS client_nickname,
       l.name AS location_name
FROM bookings_v2 b
LEFT JOIN girls g ON g.id = b.girl_id
LEFT JOIN booking_clients bc ON bc.id = b.client_id
LEFT JOIN locations l ON l.id = b.location_id
WHERE b.date = ?
  AND b.status NOT IN ('expired', 'cancelled_client', 'cancelled_girl')
ORDER BY b.start_time, g.name
```

Args: `[today]`

### Krok 2: Nová sekce "Dnešní přehled" v dashboard UI

Přidat **nad** stávající KPI karty (na mobilu bude hned viditelná) novou sekci:

```
┌─────────────────────────────────────┐
│ DNES  So 20.9.  14:32              │
│─────────────────────────────────────│
│ 10:00  Aneta   • Klient123  Praha  │
│ 11:00  Aneta   • NovyKlient Praha  │
│ 12:00  Nikola  • VIP_Jan    Brno   │
│ 14:00  Aneta   • Klient456  Praha  │
│ 15:30  Nikola  • Neznamy    Brno   │
│                                     │
│ Celkem: 5 rezervací                 │
└─────────────────────────────────────┘
```

**Informace v každém řádku:**
1. **Čas** (start_time, formát HH:MM) — výrazné, monospace
2. **Slečna** (girl_name) — bold
3. **Klient** (client_nickname) — muted barva
4. **Lokace** (location_name) — malý badge/tag

**Vizuální pravidla:**
- Řazení chronologicky podle start_time
- Status indikátor: zelená tečka = potvrzeno, žlutá = čeká, modrá = probíhá, šedá = dokončeno
- Aktuální/nejbližší rezervace zvýrazněná (border nebo background)
- Klikatelné — odkaz na detail (`/booking/calendar?date=...&detail=ID`)

### Krok 3: Responsivní CSS

- **Mobil (< 768px):** Tato sekce je PRVNÍ věc co manažerka vidí. Kompaktní řádky, velký čas, čitelná jména.
- **Desktop:** Sekce se zobrazí normálně nad KPI kartami, ale menší — dashboard zůstane primárně statistický.

### Krok 4: Bottom nav — přidat Dashboard

V `layout.tsx` přidat Dashboard do bottom nav (nahradit nebo přidat):

```tsx
<a href="/booking/dashboard" className={pathname === '/booking/dashboard' ? 'active' : ''}>
  <span className="sf-bn-icon">{'\u{1F4CA}'}</span>
  <span>Dnes</span>
</a>
```

Umístit jako **první položku** v bottom nav, aby manažerka mohla vždy jedním tapem vidět dnešní stav.

---

## Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `app/booking/dashboard/page.tsx` | Nový SQL dotaz + nová sekce "Dnešní přehled" + CSS styly |
| `app/booking/layout.tsx` | Bottom nav — přidat "Dnes" (dashboard) jako první položku |

---

## Co NEMĚNIT

- `CalendarMobileList.tsx` — zůstane jak je, slouží pro kalendářový den
- `lib/booking-actions.ts` — není potřeba, data tahá dashboard přímo
- `lib/booking-queries.ts` — není potřeba, dashboard dělá vlastní SQL
- Žádná nová stránka, žádný nový component soubor

---

## Odhad rozsahu

- Dashboard: ~60 řádků nový SQL + JSX + ~40 řádků CSS
- Layout: ~5 řádků (přidání do bottom nav)
- **Celkem: ~105 řádků nového kódu, 2 soubory**
